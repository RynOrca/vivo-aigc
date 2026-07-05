/**
 * 嵌入式 AI 感知管线 — 前端直连 Qwen-VL + DeepSeek
 *
 * APK 模式下无需笔记本后端，手机直接调用 AI API 完成面部分析。
 * API Key 优先从 localStorage 读取，fallback 到硬编码默认值。
 *
 * 管线：
 *   摄像头截帧(base64) → Qwen-VL 面部分析 → DeepSeek 数值校准 → StudyState
 *
 * CORS 处理：
 *   - APK/原生环境：CapacitorHttp 原生请求（无 CORS 限制）
 *   - Web 浏览器：标准 fetch（开发时走 Vite 代理或后端）
 */

import { CapacitorHttp } from '@capacitor/core'

// ===== API Key 管理 =====

const QEWN_DEFAULT_KEY = 'YOUR_QEWN_KEY_HERE'
const QEWN_DEFAULT_URL = 'https://llm-dm4c0m7ddxaxtw51.cn-beijing.maas.aliyuncs.com/compatible-mode'
const QEWN_DEFAULT_MODEL = 'qwen-vl-plus'

const DEEPSEEK_DEFAULT_KEY = 'YOUR_DEEPSEEK_KEY_HERE'
const DEEPSEEK_DEFAULT_URL = 'https://api.deepseek.com'
const DEEPSEEK_DEFAULT_MODEL = 'deepseek-v4-flash'

function getKey(name, fallback) {
  try { return localStorage.getItem(name) || fallback } catch (_) { return fallback }
}
function setKey(name, value) {
  try { localStorage.setItem(name, value) } catch (_) { /* noop */ }
}

export function getQewnKey() { return getKey('vivo_qewn_key', QEWN_DEFAULT_KEY) }
export function setQewnKey(v) { setKey('vivo_qewn_key', v) }
export function getQewnUrl() { return getKey('vivo_qewn_url', QEWN_DEFAULT_URL) }
export function setQewnUrl(v) { setKey('vivo_qewn_url', v) }
export function getDeepseekKey() { return getKey('vivo_ds_key', DEEPSEEK_DEFAULT_KEY) }
export function setDeepseekKey(v) { setKey('vivo_ds_key', v) }
export function getDeepseekUrl() { return getKey('vivo_ds_url', DEEPSEEK_DEFAULT_URL) }
export function setDeepseekUrl(v) { setKey('vivo_ds_url', v) }

// ===== Prompts（与后端 faceAnalyzer.js + deepseekPrompts.js 对齐）=====

const FACE_ANALYSIS_PROMPT = `你是一个学习状态视觉感知模型。请仔细看这张用户前置摄像头拍摄的面部照片，输出以下 JSON 字段（只输出 JSON，不要任何解释）：

{
  "isUserPresent": true/false,
  "faceCount": 0-5,
  "eyeClosedRatio": 0.0-1.0,
  "gazeDirection": "center/left/right/up/down",
  "gazeAwaySeconds": 0-300,
  "headDown": true/false,
  "headDownSeconds": 0-300,
  "headYawDeg": -30.0 ~ 30.0,
  "headPitchDeg": -20.0 ~ 20.0,
  "mouthOpen": true/false,
  "mouthOpenCount": 0-10,
  "currentAppType": "study/neutral/entertainment"
}

要求：
1. 头部角度按人脸关键点估算，不确定时写 0
2. 闭眼占比按眼睛纵横比(EAR)估算
3. 视线方向按瞳孔/头部朝向估算，不确定时写 "center"
4. 没检测到人脸：isUserPresent=false, gazeAwaySeconds=0, faceCount=0
5. currentAppType 只能从 "study" "neutral" "entertainment" 中选一个

只输出 JSON。`

const CALIBRATION_SYSTEM_PROMPT =
  '你是一个学习状态感知校准模型。严格按用户消息中的 schema 输出 JSON，不要任何解释。'

function buildCalibrationPrompt(qwenFeatures, ctx) {
  const recentFive = (ctx.focusScores || []).slice(-5).join(', ') || '无'
  return `你是学习专注度校准模型。根据视觉感知模型（Qwen-VL）的粗分类输出，计算当前学习状态。

=== 视觉感知原始数据 ===
${JSON.stringify(qwenFeatures, null, 2)}

=== 学习上下文 ===
- 已学习时长：${ctx.elapsedSeconds || 0} 秒
- 历史平均专注分：${ctx.historicalAvgFocus || 75}
- 最近分心次数：${ctx.recentDistractions || 0}
- 过去 5 个 focusScore：${recentFive}

=== 计算规则 ===
1. focusScore(0-100):
   - isUserPresent=false → 0
   - 基础 90，扣分：
     * gazeDirection != "center" → -15~30
     * eyeClosedRatio>0.2 → -10~25
     * headDown=true → -10~20
     * |headYawDeg|>15 → -5~15
   - 平滑：新=历史*0.3+视觉*0.7，clamp(0,100)

2. fatigueScore(0-100):
   - 基础 = elapsedSeconds/60*2
   - eyeClosedRatio>0.15 → +15
   - eyeClosedRatio>0.3 → +30
   - mouthOpen && mouthOpenCount>0 → +15

3. distractionLevel:
   - !isUserPresent → L3
   - gazeDirection!="center" || headDown || eyeClosedRatio>0.15 → L1
   - (gazeDirection!="center" && eyeClosedRatio>0.25) || focusScore<60 → L2
   - focusScore<75 → L1
   - else NONE

4. emotion: 按 fatigueScore<40&&NONE→calm, fatigueScore>=60→tired, L2/L3→distracted, L3&&!isPresent→anxious

严格输出 JSON: {"focusScore":int,"fatigueScore":int,"distractionLevel":"NONE/L1/L2/L3","emotion":"calm/tired/anxious/distracted","triggerReason":"原因或null"}`
}

// ===== 工具函数 =====

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)) }

function clampFaceFeatures(f) {
  return {
    isUserPresent: f.isUserPresent !== false,
    faceCount: clamp(f.faceCount | 0, 0, 5),
    eyeClosedRatio: clamp(parseFloat(f.eyeClosedRatio) || 0, 0, 1),
    gazeDirection: ['center','left','right','up','down'].includes(f.gazeDirection) ? f.gazeDirection : 'center',
    gazeAwaySeconds: clamp(f.gazeAwaySeconds | 0, 0, 300),
    headDown: Boolean(f.headDown),
    headDownSeconds: clamp(f.headDownSeconds | 0, 0, 300),
    headYawDeg: clamp(parseFloat(f.headYawDeg) || 0, -90, 90),
    headPitchDeg: clamp(parseFloat(f.headPitchDeg) || 0, -90, 90),
    mouthOpen: Boolean(f.mouthOpen),
    mouthOpenCount: clamp(f.mouthOpenCount | 0, 0, 10),
    currentAppType: ['study','neutral','entertainment'].includes(f.currentAppType) ? f.currentAppType : 'study',
  }
}

function parseJson(rawText) {
  if (!rawText) throw new Error('空响应')
  const m = rawText.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('未找到 JSON')
  return JSON.parse(m[0])
}

// ===== HTTP 请求（APK 用原生 HTTP 绕过 CORS，Web 用 fetch）=====

const _isNative = typeof window !== 'undefined' && !!(window.Capacitor || window.__capacitor)

async function httpPostJson(url, headers, body) {
  if (_isNative) {
    // Capacitor 原生 HTTP — 无 CORS 限制
    const res = await CapacitorHttp.request({
      method: 'POST',
      url,
      headers,
      data: body,
      responseType: 'text',
      connectTimeout: 30000,
      readTimeout: 30000,
    })
    if (res.status < 200 || res.status >= 300) {
      const errBody = typeof res.data === 'string' ? res.data : JSON.stringify(res.data || {})
      throw new Error(`API ${res.status}: ${errBody.slice(0, 200)}`)
    }
    if (typeof res.data === 'object') return res.data
    try { return JSON.parse(res.data) } catch (_) { throw new Error('响应非 JSON: ' + String(res.data).slice(0, 80)) }
  }

  // Web 环境：标准 fetch（开发时可用 Vite 代理或后端中转）
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`API ${res.status}: ${errText.slice(0, 200)}`)
  }
  return res.json()
}

async function openaiFetch(baseUrl, apiKey, body) {
  const base = baseUrl.replace(/\/+$/, '').replace(/\/v1\/?$/, '')
  const url = `${base}/v1/chat/completions`
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` }

  const data = await httpPostJson(url, headers, { ...body, stream: false })

  let content = data?.choices?.[0]?.message?.content
  if (!content || content.trim() === '') {
    content = data?.choices?.[0]?.message?.reasoning_content
  }
  if (!content) throw new Error('API 返回空内容')
  return content.trim()
}

// ===== 公开接口 =====

/**
 * 嵌入式 AI 面部分析（前端直连 Qwen-VL + DeepSeek，无需后端）
 *
 * @param {string} base64 - 纯 base64（不含 data:image/... 前缀）
 * @param {object} ctx - 学习上下文
 * @returns {Promise<{ faceFeatures, studyState, intervention }>}
 */
export async function analyzeFaceDirect(base64, ctx = {}) {
  const qewnKey = getQewnKey()
  const qewnUrl = getQewnUrl()
  const dsKey = getDeepseekKey()
  const dsUrl = getDeepseekUrl()

  // Step 1: Qwen-VL 面部分析
  const qwenRaw = await openaiFetch(qewnUrl, qewnKey, {
    model: QEWN_DEFAULT_MODEL,
    messages: [{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
        { type: 'text', text: FACE_ANALYSIS_PROMPT }
      ]
    }],
    max_tokens: 1024,
  })

  const faceFeatures = clampFaceFeatures(parseJson(qwenRaw))

  // Step 2: DeepSeek 数值校准
  const dsRaw = await openaiFetch(dsUrl, dsKey, {
    model: DEEPSEEK_DEFAULT_MODEL,
    messages: [
      { role: 'system', content: CALIBRATION_SYSTEM_PROMPT },
      { role: 'user', content: buildCalibrationPrompt(faceFeatures, ctx) },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 2048,
  })

  const calibrated = parseJson(dsRaw)

  // Step 3: 构造 StudyState（与后端 face.js 格式对齐）
  const elapsed = ctx.elapsedSeconds || 0
  const focusScore = clamp(Math.round(Number(calibrated.focusScore) || 80), 0, 100)
  const fatigueScore = clamp(Math.round(Number(calibrated.fatigueScore) || 10), 0, 100)
  const distractionLevel = ['NONE','L1','L2','L3'].includes(calibrated.distractionLevel)
    ? calibrated.distractionLevel : 'NONE'
  const emotion = ['calm','tired','anxious','distracted'].includes(calibrated.emotion)
    ? calibrated.emotion : 'calm'

  const studyState = {
    sessionId: ctx.sessionId || 'study_001',
    timestamp: Math.floor(Date.now() / 1000),
    elapsedSeconds: elapsed,
    focusScore,
    fatigueScore,
    distractionLevel,
    emotion,
    currentScene: 'study',
    isUserPresent: faceFeatures.isUserPresent,
    headDownSeconds: faceFeatures.headDownSeconds,
    eyeClosedRatio: faceFeatures.eyeClosedRatio,
    gazeAwaySeconds: faceFeatures.gazeAwaySeconds,
    mouthOpenCount: faceFeatures.mouthOpenCount,
    currentAppType: faceFeatures.currentAppType,
    distractionCount: ctx.distractionCount || 0,
    triggerReason: calibrated.triggerReason || null,
  }

  // 跟踪分心计数（前端本地维护）
  if (distractionLevel !== 'NONE') {
    const now = Math.floor(Date.now() / 1000)
    if (!ctx._lastDistractionTime || (now - ctx._lastDistractionTime) > 15) {
      studyState.distractionCount = (ctx.distractionCount || 0) + 1
      ctx._lastDistractionTime = now
    }
  }

  // 生成干预事件
  let intervention = null
  if (distractionLevel !== 'NONE') {
    const messages = {
      L1: '眼睛离开屏幕有点久了，回到当前题目上吧 🙂',
      L2: '你已经分心一小会儿了，先把注意力拉回当前这一步吧。',
      L3: '看起来当前状态不太好，硬撑效果有限。建议休息 5 分钟。',
    }
    intervention = {
      eventId: `evt_${Date.now().toString(36)}`,
      sessionId: studyState.sessionId,
      level: distractionLevel,
      type: distractionLevel === 'L1' ? 'TEXT' : distractionLevel === 'L2' ? 'VOICE' : 'POPUP',
      title: `${distractionLevel} 提醒`,
      message: messages[distractionLevel] || '请回到学习状态',
      action: '回到当前任务',
      triggerReason: studyState.triggerReason || 'AI 感知触发',
      timestamp: Math.floor(Date.now() / 1000),
    }
  }

  return { faceFeatures, studyState, intervention }
}

// ===== API 连通性测试 =====

/**
 * 测试 Qwen-VL API 连通性
 * @returns {Promise<{ ok: boolean, message: string, latencyMs: number }>}
 */
export async function testQwenConnectivity() {
  const key = getQewnKey()
  const url = getQewnUrl()
  const start = Date.now()
  try {
    const res = await openaiFetch(url, key, {
      model: QEWN_DEFAULT_MODEL,
      messages: [{ role: 'user', content: '回复 OK' }],
      max_tokens: 10,
    })
    const latency = Date.now() - start
    return { ok: true, message: `连通 (${latency}ms): ${res.slice(0, 30)}`, latencyMs: latency }
  } catch (e) {
    const latency = Date.now() - start
    return { ok: false, message: e.message.slice(0, 120), latencyMs: latency }
  }
}

/**
 * 测试 DeepSeek API 连通性
 * @returns {Promise<{ ok: boolean, message: string, latencyMs: number }>}
 */
export async function testDeepseekConnectivity() {
  const key = getDeepseekKey()
  const url = getDeepseekUrl()
  const start = Date.now()
  try {
    const res = await openaiFetch(url, key, {
      model: DEEPSEEK_DEFAULT_MODEL,
      messages: [{ role: 'user', content: '回复 OK' }],
      max_tokens: 10,
    })
    const latency = Date.now() - start
    return { ok: true, message: `连通 (${latency}ms): ${res.slice(0, 30)}`, latencyMs: latency }
  } catch (e) {
    const latency = Date.now() - start
    return { ok: false, message: e.message.slice(0, 120), latencyMs: latency }
  }
}

export default { analyzeFaceDirect, testQwenConnectivity, testDeepseekConnectivity }

/**
 * API 服务层 — Mock 与真实后端的统一入口
 *
 * ==== 集成说明 ====
 *
 * MOCK_MODE 控制数据源：
 *   - true  （默认）：所有函数返回本地 Mock 数据，无需后端
 *   - false ：走 HTTP 请求到真实后端（默认 http://localhost:8000）
 *
 * 切换方式：
 *   1. 直接修改下方 MOCK_MODE 变量
 *   2. 或通过 setMockMode(bool) 运行时切换（Settings 页 Toggle）
 *
 * 用法：
 *   import { getStudyState, requestIntervention, requestRestChat, requestReport, setMockMode } from './api.js'
 */

// Mock 模式下使用前端内置 Mock 数据（与 sensing/mockGenerator.js 算法一致）
import { generateStudyState, generateIntervention, generateRestChat, generateReport } from './mockAdapter.js'

// ===== 配置 =====

// 使用 let 而非 const，支持运行时切换（Settings 页 Toggle 生效关键）
export let MOCK_MODE = true
export const BASE_URL = 'http://localhost:8000'

/**
 * 运行时切换 Mock 模式（由 Settings 页 Toggle 调用）
 * @param {boolean} value - true = Mock, false = 真实后端
 */
export function setMockMode(value) {
  MOCK_MODE = value
  console.log(`[API] MOCK_MODE 切换为: ${value ? 'Mock' : '真实后端'}`)
}

/**
 * Mock 模式下错误时的 fallback 数据
 */
function mockFallback() {
  return generateStudyState(0)
}

// ===== 内部工具 =====

async function apiCall(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
    if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
    const json = await res.json()
    if (json.code !== 0) throw new Error(`API error ${json.code}: ${json.message}`)
    return json.data
  } catch (err) {
    // 后端不可用时给出清晰日志，由各业务函数决定是否降级 Mock
    console.warn(`[API] ${path} 请求失败:`, err.message)
    throw err
  }
}

// ===== 公开接口 =====

/**
 * 获取当前学习状态 — Task 2 感知模块
 * Mock: 本地生成   真实: GET /api/study/state?sessionId=xxx
 * @param {number} elapsedSeconds
 * @param {string} sessionId
 */
export async function getStudyState(elapsedSeconds, sessionId = 'study_001') {
  if (MOCK_MODE) return generateStudyState(elapsedSeconds, sessionId)
  return apiCall(`/api/study/state?sessionId=${sessionId}`)
}

/**
 * 请求 AI 分级干预 — Task 3 AI 服务
 * Mock: 本地模板   真实: POST /api/ai/intervention
 * @param {string} sessionId
 * @param {object} state - StudyState 或 { distractionLevel, focusScore, fatigueScore, triggerReason }
 */
export async function requestIntervention(sessionId, state) {
  if (MOCK_MODE) return generateIntervention(sessionId, state.distractionLevel)
  return apiCall('/api/ai/intervention', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      focusScore: state.focusScore,
      fatigueScore: state.fatigueScore,
      distractionLevel: state.distractionLevel,
      triggerReason: state.triggerReason || '状态变化',
    }),
  })
}

/**
 * 获取休息伴聊文案 — Task 3 AI 服务
 * Mock: 本地模板   真实: POST /api/ai/rest-chat
 * @param {string} sessionId
 * @param {object} data - { sessionDuration, userGoal, fatigueScore, recentState }
 */
export async function requestRestChat(sessionId, data) {
  if (MOCK_MODE) return generateRestChat(data.totalMinutes || data.sessionDuration)
  return apiCall('/api/ai/rest-chat', {
    method: 'POST',
    body: JSON.stringify({ sessionId, ...data }),
  })
}

/**
 * 生成学习日报 — Task 3 AI 服务
 * Mock: 本地计算   真实: POST /api/ai/report
 * @param {string} sessionId
 * @param {object} data - StudyReport 所需全部字段
 */
export async function requestReport(sessionId, data) {
  if (MOCK_MODE) return generateReport(data)
  return apiCall('/api/ai/report', {
    method: 'POST',
    body: JSON.stringify({ sessionId, ...data }),
  })
}

/**
 * 请求口头复盘问题 — Task 3 AI 服务
 * @param {string} sessionId
 * @param {object} data - { taskName, focusScore, distractionCount, durationMinutes }
 */
export async function requestOralReview(sessionId, data) {
  if (MOCK_MODE) {
    // 复用 reportMock 中的复盘问题
    const { generateRestChat } = await import('./reportMock.js')
    const rest = generateRestChat(0)
    return { sessionId, question: rest.question }
  }
  return apiCall('/api/ai/oral-review', {
    method: 'POST',
    body: JSON.stringify({ sessionId, ...data }),
  })
}

/**
 * 开始学习会话 — POST /api/study/start
 * @param {object} data - { userId, taskName, targetMinutes }
 */
export async function startStudy(data) {
  if (MOCK_MODE) {
    const sessionId = `study_${Date.now().toString(36)}`
    return {
      sessionId,
      startedAt: Math.floor(Date.now() / 1000),
      initialState: generateStudyState(0, sessionId),
    }
  }
  return apiCall('/api/study/start', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 结束学习会话 — POST /api/study/end
 * @param {object} data - { sessionId, totalMinutes, focusHistory, distractionCount }
 */
export async function endStudy(data) {
  if (MOCK_MODE) return { ...data, message: '学习会话已结束（Mock）' }
  return apiCall('/api/study/end', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

/**
 * 分析面部照片 — POST /api/ai/analyze-face
 *
 * Mock 模式（默认）：本地生成 faceFeatures + 简单规则算出 studyState
 * 真实模式：上传 base64 到后端，走 Qwen-VL + DeepSeek 管线
 *
 * 返回完整包：
 *   { faceFeatures, studyState, intervention }
 *   - faceFeatures: 12 个粗分类字段（闭眼占比/视线方向/头部偏角等）
 *   - studyState: 标准 StudyState 结构（与 Mock Schema 字段名完全对齐）
 *   - intervention: 如果 distractionLevel != NONE，附带触发事件；否则 null
 *
 * @param {string} sessionId
 * @param {string} imageBase64 - data:image/jpeg;base64,... 格式
 * @param {number} [elapsedSeconds] - 已学习秒数（Mock 分支用于模拟疲劳曲线）
 * @returns {Promise<{ faceFeatures: object, studyState: object, intervention: object|null }>}
 */
export async function analyzeFace(sessionId, imageBase64, elapsedSeconds = 0) {
  if (MOCK_MODE) {
    return generateMockFaceAnalysis(sessionId, elapsedSeconds)
  }
  // 空图片不调后端（预热/降级场景）
  if (!imageBase64 || imageBase64.length < 100) {
    return generateMockFaceAnalysis(sessionId, elapsedSeconds)
  }
  try {
    return await apiCall('/api/ai/analyze-face', {
      method: 'POST',
      body: JSON.stringify({ sessionId, image: { base64: imageBase64 } }),
    })
  } catch (err) {
    console.warn('[API] analyzeFace 后端不可用，降级本地 Mock:', err.message)
    return generateMockFaceAnalysis(sessionId, elapsedSeconds)
  }
}

/**
 * Mock 模式：生成面部粗分类 + 数值
 *
 * 模拟一段随时间缓慢下滑的专注曲线（10 分钟后开始疲劳）
 * 返回 faceFeatures / studyState / intervention 完整包
 */
function generateMockFaceAnalysis(sessionId, elapsed) {
  const fatigued = Math.min(1, elapsed / 600) // 10 分钟后达到最大疲劳
  const baseFocus = 85 - fatigued * 40
  const focusScore = Math.round(baseFocus + (Math.random() * 10 - 5))
  const fatigueScore = Math.round(20 + fatigued * 50 + Math.random() * 10)
  const eyeClosedRatio = parseFloat((fatigued * 0.3 + Math.random() * 0.05).toFixed(2))
  const gazeAwaySeconds = Math.floor(Math.random() * 15 + fatigued * 30)
  const gazeDirection = gazeAwaySeconds > 15
    ? ['left', 'right'][Math.floor(Math.random() * 2)]
    : 'center'
  const headYawDeg = parseFloat(((Math.random() * 20 - 10) * (fatigued + 0.3)).toFixed(1))

  let distractionLevel = 'NONE'
  if (gazeAwaySeconds >= 60 || focusScore < 50) distractionLevel = 'L2'
  else if (gazeAwaySeconds >= 20 || focusScore < 70) distractionLevel = 'L1'

  let emotion = 'calm'
  if (fatigueScore >= 60) emotion = 'tired'
  else if (distractionLevel === 'L2' || distractionLevel === 'L3') emotion = 'distracted'

  const faceFeatures = {
    isUserPresent: true,
    faceCount: 1,
    eyeClosedRatio,
    gazeDirection,
    gazeAwaySeconds,
    headDown: Math.random() < fatigued,
    headDownSeconds: Math.floor(Math.random() * 10 * fatigued),
    headYawDeg,
    headPitchDeg: parseFloat((Math.random() * 5 - 2).toFixed(1)),
    mouthOpen: Math.random() < fatigued * 0.3,
    mouthOpenCount: Math.floor(Math.random() * fatigued * 3),
    currentAppType: 'study',
  }

  const studyState = {
    sessionId,
    timestamp: Math.floor(Date.now() / 1000),
    elapsedSeconds: elapsed,
    focusScore: Math.max(0, Math.min(100, focusScore)),
    fatigueScore: Math.max(0, Math.min(100, fatigueScore)),
    distractionLevel,
    emotion,
    currentScene: 'study',
    isUserPresent: true,
    headDownSeconds: faceFeatures.headDownSeconds,
    eyeClosedRatio,
    gazeAwaySeconds,
    mouthOpenCount: faceFeatures.mouthOpenCount,
    currentAppType: 'study',
    distractionCount: Math.floor(elapsed / 120),
    triggerReason: distractionLevel !== 'NONE' ? `视线偏离${gazeAwaySeconds}秒` : null,
  }

  let intervention = null
  if (distractionLevel !== 'NONE') {
    intervention = {
      eventId: `evt_${Date.now().toString(36)}`,
      sessionId,
      level: distractionLevel,
      type: distractionLevel === 'L1' ? 'TEXT' : distractionLevel === 'L2' ? 'VOICE' : 'POPUP',
      title: `${distractionLevel} 提醒`,
      message: distractionLevel === 'L1'
        ? '眼睛离开屏幕有点久了，回到当前题目上吧 🙂'
        : distractionLevel === 'L2'
          ? '你已经分心一小会儿了，先把注意力拉回当前这一步吧。'
          : '看起来当前状态不太好，硬撑效果有限。建议休息 5 分钟。',
      action: '回到当前任务',
      triggerReason: `视线偏离${gazeAwaySeconds}秒`,
      timestamp: Math.floor(Date.now() / 1000),
    }
  }

  return { faceFeatures, studyState, intervention }
}

export default {
  MOCK_MODE,
  BASE_URL,
  setMockMode,
  getStudyState,
  requestIntervention,
  requestRestChat,
  requestReport,
  requestOralReview,
  startStudy,
  endStudy,
  analyzeFace,
}

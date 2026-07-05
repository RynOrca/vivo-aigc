/**
 * Task 2 + Task 3 协作：面部感知分析器
 *
 * 调用 Qwen-VL（qwen-vl-plus）识别前置摄像头照片的面部特征
 * 输出与前端 StudyState Mock Schema 字段名**完全对齐**的粗分类数据
 *
 * 下游 DeepSeek 拿到这些粗分类数据后校准计算 focusScore / fatigueScore / distractionLevel
 * 前端 Mock Schema 字段名不变 → 前端 api.js 不感知背后是 Mock / 规则引擎 / AI 感知
 */

import { visionCompletion } from './llmClient.js'

// ===== 工具函数 =====

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

// ===== Prompt =====

const FACE_ANALYSIS_PROMPT = `你是一个学习状态视觉感知模型。请仔细看这张用户前置摄像头拍摄的面部照片，输出以下 JSON 字段（只输出 JSON，不要任何解释）：

{
  "isUserPresent": true/false,           // 是否检测到人脸；离座=false
  "faceCount": 0-5,                      // 检测到的人脸数量（多人=注意力不集中）
  "eyeClosedRatio": 0.0-1.0,             // 闭眼占比：0.0=全开 0.5=半闭 1.0=全闭
  "gazeDirection": "center/left/right/up/down",  // 视线方向
  "gazeAwaySeconds": 0-300,              // 视线偏离持续时间（秒），按图像中头部/眼部状态估算
  "headDown": true/false,                // 是否低头（俯视角>15°）
  "headDownSeconds": 0-300,              // 低头持续时间估算（秒）
  "headYawDeg": -30.0 ~ 30.0,           // 头部左右偏角（左负右正，按人脸关键点估算）
  "headPitchDeg": -20.0 ~ 20.0,         // 头部俯仰角（低头正，仰头负，按人脸关键点估算）
  "mouthOpen": true/false,              // 嘴是否张开（用于打哈欠检测）
  "mouthOpenCount": 0-10,               // 最近一分钟打哈欠次数估算
  "currentAppType": "study/neutral/entertainment"  // 按专注状态推断（主动判断/中性/娱乐状态）
}

要求：
1. 头部角度按人脸关键点估算，允许 ±5° 误差；不确定时写 0
2. 闭眼占比按眼睛纵横比(EAR)估算：EAR<0.2→>0.8闭眼；EAR 0.2-0.3→0.5左右；EAR>0.3→<0.1
3. 视线方向按瞳孔/头部朝向估算，不确定时写 "center"
4. 如果没检测到人脸：isUserPresent=false, gazeAwaySeconds=0, headDown=false, headDownSeconds=0, faceCount=0
5. mouthOpenCount：仅当 mouthOpen=true 且看起来连续张嘴（打哈欠动作）时给 >0 的数字
6. currentAppType 只能从 "study" "neutral" "entertainment" 中选一个

只输出 JSON。`

// ===== Mock 值（快速演示用，不需要 Key）=====

function mockFaceFeatures() {
  // 模拟一个轻微分心的学习者
  return {
    isUserPresent: true,
    faceCount: 1,
    eyeClosedRatio: parseFloat((0.05 + Math.random() * 0.1).toFixed(2)),
    gazeDirection: ['center', 'center', 'left', 'center'][Math.floor(Math.random() * 4)],
    gazeAwaySeconds: Math.floor(Math.random() * 15),
    headDown: Math.random() < 0.15,
    headDownSeconds: Math.floor(Math.random() * 8),
    headYawDeg: parseFloat((Math.random() * 10 - 5).toFixed(1)),
    headPitchDeg: parseFloat((Math.random() * 5 - 2).toFixed(1)),
    mouthOpen: false,
    mouthOpenCount: 0,
    currentAppType: 'study',
  }
}

// ===== 公开接口 =====

/**
 * 分析面部照片，返回粗分类字段（与 front-end Mock Schema 字段名对齐）
 *
 * @param {object} imageInput - { url?: string, base64?: string }
 * @param {object} [options]
 * @param {boolean} [options.mock=false] - 强制返回 Mock（不上云）
 * @returns {Promise<object>} 面部特征粗分类数据
 */
export async function analyzeFace(imageInput, options = {}) {
  if (!imageInput || (!imageInput.url && !imageInput.base64)) {
    throw new Error('imageInput 必须包含 url 或 base64 字段')
  }

  // Mock Key 优先
  if (options.mock === true) {
    return mockFaceFeatures()
  }

  // 真实 Qwen-VL 调用
  const imageUrl = imageInput.url || `data:image/jpeg;base64,${imageInput.base64}`

  try {
    const raw = await visionCompletion(FACE_ANALYSIS_PROMPT, imageUrl)

    // 用正则包裹 JSON（鲁棒）
    const m = raw.match(/\{[\s\S]*\}/)
    if (!m) {
      throw new Error(`Qwen-VL 响应中未找到 JSON: ${raw.slice(0, 200)}`)
    }

    const features = JSON.parse(m[0])

    // 数值 clamp（防止 VL 模型返回越界值）
    return {
      isUserPresent: features.isUserPresent !== false,
      faceCount: Math.max(0, Math.min(5, features.faceCount | 0)),
      eyeClosedRatio: clamp(parseFloat(features.eyeClosedRatio) || 0, 0, 1),
      gazeDirection: ['center', 'left', 'right', 'up', 'down'].includes(features.gazeDirection)
        ? features.gazeDirection
        : 'center',
      gazeAwaySeconds: Math.max(0, Math.min(300, features.gazeAwaySeconds | 0)),
      headDown: Boolean(features.headDown),
      headDownSeconds: Math.max(0, Math.min(300, features.headDownSeconds | 0)),
      headYawDeg: clamp(parseFloat(features.headYawDeg) || 0, -90, 90),
      headPitchDeg: clamp(parseFloat(features.headPitchDeg) || 0, -90, 90),
      mouthOpen: Boolean(features.mouthOpen),
      mouthOpenCount: Math.max(0, Math.min(10, features.mouthOpenCount | 0)),
      currentAppType: ['study', 'neutral', 'entertainment'].includes(features.currentAppType)
        ? features.currentAppType
        : 'study',
    }
  } catch (err) {
    console.warn(`[faceAnalyzer] Qwen-VL 分析失败，降级 Mock: ${err.message}`)
    return mockFaceFeatures()
  }
}

/**
 * 返回 Mock 面部特征（供前端 Mock 模式使用）
 * @returns {object}
 */
export function getMockFaceFeatures() {
  return mockFaceFeatures()
}

export default { analyzeFace, getMockFaceFeatures }

/**
 * Task 3 AI 感知管线 — 面部照片分析
 *
 * POST /api/ai/analyze-face
 *
 * 完整管线：前置摄像头拍一张照片
 *   → Qwen-VL 读面部特征（头角度、视线方向、眼睛开合、人脸存在）
 *   → DeepSeek 数值校准算出 focusScore / fatigueScore / distractionLevel
 *   → 如果 distractionLevel != NONE，返回干预事件
 *
 * Body: { sessionId: string, image: { url?: string, base64?: string } }
 * Response: { faceFeatures, studyState, intervention }
 *
 * 可用性：
 *   - AI_MOCK_MODE=true → 直接返回 Mock（无需 Key，前端 Demo 首选）
 *   - AI_MOCK_MODE=false → 走真实 Qwen-VL + DeepSeek
 *   - 任一失败 → 降级 Mock
 */

import { Router } from 'express'
import dotenv from 'dotenv'
import * as mockAI from '../services/mockAI.js'
import * as llmClient from '../services/llmClient.js'
import { analyzeFace, getMockFaceFeatures } from '../services/faceAnalyzer.js'
import { buildFaceStatePrompt, CALIBRATION_SYSTEM_PROMPT } from '../services/deepseekPrompts.js'
import { sessions } from '../routes/study.js'

dotenv.config()

const router = Router()

/**
 * 把 DeepSeek 返回的 JSON 文本解析 + 标准化
 */
function parseStudyStateJson(rawText) {
  if (!rawText) throw new Error('DeepSeek 返回空文本')
  const m = rawText.match(/\{[\s\S]*\}/)
  if (!m) throw new Error('DeepSeek 返回中未找到 JSON')
  return JSON.parse(m[0])
}

/**
 * POST /api/ai/analyze-face
 */
router.post('/analyze-face', async (req, res) => {
  const { sessionId, image } = req.body

  // 1. 校验
  if (!sessionId) {
    return res.status(400).json({ code: 400, message: 'sessionId 必填', data: null })
  }
  if (!image || (!image.url && !image.base64)) {
    return res.status(400).json({ code: 400, message: 'image 必包含 url 或 base64 字段', data: null })
  }

  // 检查 session 是否存在
  const session = sessions.get(sessionId)
  if (!session) {
    return res.status(404).json({ code: 404, message: `会话不存在: ${sessionId}`, data: null })
  }

  // 2. 暴力 Mock 模式
  if (process.env.AI_MOCK_MODE === 'true') {
    const faceFeatures = getMockFaceFeatures()
    const studyState = buildMockStudyState(faceFeatures, session)
    const intervention = studyState.distractionLevel !== 'NONE'
      ? buildMockIntervention(sessionId, studyState)
      : null

    return res.json({
      code: 0,
      message: 'ok (mock)',
      data: {
        sessionId,
        timestamp: Math.floor(Date.now() / 1000),
        faceFeatures,
        studyState,
        intervention,
      },
    })
  }

  // 3. 真实管线
  try {
    // 3a. Qwen-VL 读面部特征
    // 检查 Qwen-VL Key 是否可用
    if (!llmClient.isAvailable('vision')) {
      throw new Error('QEWN_API_KEY 未配置，无法识别面部')
    }
    const faceFeatures = await analyzeFace(image)

    // 3b. 计算学习上下文
    const elapsedSeconds = Math.floor(Date.now() / 1000) - session.startedAt
    const historicalAvgFocus = session.focusScores.length > 0
      ? Math.round(session.focusScores.reduce((a, b) => a + b, 0) / session.focusScores.length)
      : 75
    const recentDistractions = session.distractionCount || 0

    // 3c. DeepSeek 数值校准
    const deepseekRaw = await llmClient.chatCompletion(
      CALIBRATION_SYSTEM_PROMPT,
      buildFaceStatePrompt(faceFeatures, {
        elapsedSeconds,
        historicalAvgFocus,
        recentDistractions,
        focusScores: session.focusScores,
      }),
      {
        provider: process.env.DEFAULT_MODEL_PROVIDER,
        response_format: { type: 'json_object' },
        max_tokens: 512,
      },
    )

    const calibratedState = parseStudyStateJson(deepseekRaw)

    // 3d. 构造完整 StudyState
    const studyState = {
      sessionId,
      timestamp: Math.floor(Date.now() / 1000),
      elapsedSeconds,
      focusScore: clampInt(calibratedState.focusScore, 0, 100),
      fatigueScore: clampInt(calibratedState.fatigueScore, 0, 100),
      distractionLevel: ['NONE', 'L1', 'L2', 'L3'].includes(calibratedState.distractionLevel)
        ? calibratedState.distractionLevel
        : 'NONE',
      emotion: ['calm', 'tired', 'anxious', 'distracted'].includes(calibratedState.emotion)
        ? calibratedState.emotion
        : 'calm',
      currentScene: 'study',
      isUserPresent: faceFeatures.isUserPresent,
      headDownSeconds: faceFeatures.headDownSeconds || 0,
      eyeClosedRatio: faceFeatures.eyeClosedRatio || 0,
      gazeAwaySeconds: faceFeatures.gazeAwaySeconds || 0,
      mouthOpenCount: faceFeatures.mouthOpenCount || 0,
      currentAppType: ['study', 'neutral', 'entertainment'].includes(faceFeatures.currentAppType)
        ? faceFeatures.currentAppType
        : 'study',
      distractionCount: session.distractionCount || 0,
      triggerReason: calibratedState.triggerReason || null,
    }

    // 3e. 更新 session 状态
    session.focusScores.push(studyState.focusScore)
    if (studyState.distractionLevel !== 'NONE') {
      session.distractionCount = (session.distractionCount || 0) + 1
      studyState.distractionCount = session.distractionCount
    }
    session.lastState = studyState

    // 3f. 生成干预事件
    let intervention = null
    if (studyState.distractionLevel !== 'NONE') {
      intervention = mockAI.generateIntervention({
        sessionId,
        focusScore: studyState.focusScore,
        fatigueScore: studyState.fatigueScore,
        distractionLevel: studyState.distractionLevel,
        triggerReason: studyState.triggerReason,
      })
    }

    return res.json({
      code: 0,
      message: 'ok',
      data: {
        sessionId,
        timestamp: studyState.timestamp,
        faceFeatures,
        studyState,
        intervention,
      },
    })
  } catch (err) {
    console.warn(`[face] 真实管线失败，降级 Mock: ${err.message}`)

    // 降级 Mock
    const faceFeatures = getMockFaceFeatures()
    const studyState = buildMockStudyState(faceFeatures, session)

    return res.json({
      code: 0,
      message: 'ok (mock fallback)',
      data: {
        sessionId,
        timestamp: Math.floor(Date.now() / 1000),
        faceFeatures,
        studyState,
        intervention: studyState.distractionLevel !== 'NONE'
          ? buildMockIntervention(sessionId, studyState)
          : null,
      },
    })
  }
})

// ===== 工具函数 =====

function clampInt(v, min, max) {
  v = Math.round(Number(v) || 0)
  return Math.min(max, Math.max(min, v))
}

/**
 * 基于 faceFeatures 构建 Mock StudyState（纯规则，不依赖 LLM）
 * 让 Mock 模式演示的数值能正常联动 UI
 */
function buildMockStudyState(faceFeatures, session) {
  const elapsed = Math.floor(Date.now() / 1000) - session.startedAt

  // 简单规则
  let focusScore = 80
  if (!faceFeatures.isUserPresent) {
    focusScore = 0
  } else {
    focusScore -= faceFeatures.eyeClosedRatio * 30
    focusScore -= Math.min(40, faceFeatures.gazeAwaySeconds * 0.5)
    focusScore -= faceFeatures.headDownSeconds * 0.5
    focusScore = clampInt(focusScore, 0, 100)
  }

  let fatigueScore = Math.round(elapsed / 60 * 2)
  if (faceFeatures.eyeClosedRatio > 0.15) fatigueScore += 15
  if (faceFeatures.mouthOpen && faceFeatures.mouthOpenCount > 2) fatigueScore += 20
  fatigueScore = clampInt(fatigueScore, 0, 100)

  let distractionLevel = 'NONE'
  if (!faceFeatures.isUserPresent) distractionLevel = 'L3'
  else if (faceFeatures.currentAppType === 'entertainment') distractionLevel = 'L3'
  else if (faceFeatures.gazeAwaySeconds >= 60 || focusScore < 50) distractionLevel = 'L2'
  else if (faceFeatures.gazeAwaySeconds >= 20 || focusScore < 70) distractionLevel = 'L1'

  let emotion = 'calm'
  if (fatigueScore >= 60) emotion = 'tired'
  else if (distractionLevel === 'L3' && !faceFeatures.isUserPresent) emotion = 'anxious'
  else if (distractionLevel === 'L2' || distractionLevel === 'L3') emotion = 'distracted'

  return {
    sessionId: session.sessionId || 'study_001',
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
    distractionCount: session.distractionCount || 0,
    triggerReason: distractionLevel !== 'NONE' ? 'AI 感知触发' : null,
  }
}

/**
 * 生成 Mock 干预事件
 */
function buildMockIntervention(sessionId, state) {
  return mockAI.generateIntervention({
    sessionId,
    focusScore: state.focusScore,
    fatigueScore: state.fatigueScore,
    distractionLevel: state.distractionLevel,
    triggerReason: state.triggerReason,
  })
}

export default router

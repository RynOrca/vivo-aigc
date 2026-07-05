/**
 * Task 3 AI 服务路由
 *
 * POST /api/ai/intervention  — 生成分级干预提醒
 * POST /api/ai/rest-chat    — 生成休息伴聊文案
 * POST /api/ai/oral-review — 生成复盘引导问题
 * POST /api/ai/report       — 生成学习日报
 *
 * 四个接口均支持 Mock 降级：
 *   - AI_MOCK_MODE=true（默认）：直接返回本地模板文案
 *   - AI_MOCK_MODE=false：调用蓝心 AI (vivoClient)，失败时自动降级到 Mock
 */

import { Router } from 'express'
import dotenv from 'dotenv'
import * as mockAI from '../services/mockAI.js'
import * as promptBuilder from '../services/promptBuilder.js'
import * as vivoClient from '../services/vivoClient.js'
import {
  validateIntervention,
  validateRestChat,
  validateOralReview,
  validateReport,
} from '../schemas/validate.js'

dotenv.config()

const router = Router()
const AI_MOCK_MODE = process.env.AI_MOCK_MODE !== 'false' // 默认 true

/**
 * POST /api/ai/intervention
 * Body: { sessionId, focusScore, fatigueScore, distractionLevel, triggerReason }
 * Response: InterventionEvent
 */
router.post('/intervention', async (req, res) => {
  const { valid, error } = validateIntervention(req.body)
  if (!valid) return res.status(400).json({ code: 400, message: error, data: null })

  const { distractionLevel, sessionId, triggerReason } = req.body

  // NONE 等级不触发干预
  if (distractionLevel === 'NONE') {
    return res.json({ code: 0, message: 'ok', data: null })
  }

  try {
    if (AI_MOCK_MODE || !vivoClient.isVivoAvailable()) {
      // Mock 模式
      const event = mockAI.generateIntervention(req.body)
      return res.json({ code: 0, message: 'ok', data: event })
    }

    // 真实蓝心 AI 调用
    const prompt = promptBuilder.buildInterventionPrompt(req.body)
    const aiMessage = await vivoClient.chatCompletion(promptBuilder.SYSTEM_PROMPT, prompt)

    const event = {
      eventId: `evt_${Date.now().toString(36)}`,
      sessionId: sessionId || 'study_001',
      level: distractionLevel,
      type: distractionLevel === 'L1' ? 'TEXT' : distractionLevel === 'L2' ? 'VOICE' : 'POPUP',
      title: `${distractionLevel} 提醒`,
      message: aiMessage,
      action: '回到当前任务',
      triggerReason: triggerReason || '状态变化',
      timestamp: Math.floor(Date.now() / 1000),
    }
    res.json({ code: 0, message: 'ok', data: event })
  } catch (err) {
    // vivo 接口错误时降级到 Mock
    console.warn('[AI] vivo 调用失败，降级到 Mock:', err.message)
    const event = mockAI.generateIntervention(req.body)
    res.json({ code: 0, message: 'ok (mock fallback)', data: event })
  }
})

/**
 * POST /api/ai/rest-chat
 * Body: { sessionId, sessionDuration, fatigueScore, userGoal, recentState }
 * Response: { message, suggestedReplies, question, restDuration }
 */
router.post('/rest-chat', async (req, res) => {
  const { valid, error } = validateRestChat(req.body)
  if (!valid) return res.status(400).json({ code: 400, message: error, data: null })

  try {
    if (AI_MOCK_MODE || !vivoClient.isVivoAvailable()) {
      const data = mockAI.generateRestChat(req.body)
      return res.json({ code: 0, message: 'ok', data })
    }

    // 真实蓝心 AI
    const prompt = promptBuilder.buildRestChatPrompt(req.body)
    const aiMessage = await vivoClient.chatCompletion(promptBuilder.SYSTEM_PROMPT, prompt)
    const data = mockAI.generateRestChat(req.body)
    data.message = aiMessage  // AI 生成替换模板

    return res.json({ code: 0, message: 'ok', data })
  } catch (err) {
    console.warn('[AI] vivo 调用失败，降级到 Mock:', err.message)
    const data = mockAI.generateRestChat(req.body)
    res.json({ code: 0, message: 'ok (mock fallback)', data })
  }
})

/**
 * POST /api/ai/oral-review
 * Body: { sessionId, taskName, focusScore, distractionCount, durationMinutes }
 * Response: { question }
 */
router.post('/oral-review', async (req, res) => {
  const { valid, error } = validateOralReview(req.body)
  if (!valid) return res.status(400).json({ code: 400, message: error, data: null })

  try {
    if (AI_MOCK_MODE || !vivoClient.isVivoAvailable()) {
      const data = mockAI.generateOralReview(req.body)
      return res.json({ code: 0, message: 'ok', data })
    }

    // 真实蓝心 AI
    const prompt = promptBuilder.buildOralReviewPrompt(req.body)
    const aiQuestion = await vivoClient.chatCompletion(promptBuilder.SYSTEM_PROMPT, prompt)

    return res.json({
      code: 0,
      message: 'ok',
      data: { sessionId: req.body.sessionId, question: aiQuestion },
    })
  } catch (err) {
    console.warn('[AI] vivo 调用失败，降级到 Mock:', err.message)
    const data = mockAI.generateOralReview(req.body)
    res.json({ code: 0, message: 'ok (mock fallback)', data })
  }
})

/**
 * POST /api/ai/report
 * Body: { sessionId, totalMinutes, effectiveMinutes, averageFocusScore, maxFatigueScore, distractionCount, oralReview, focusCurve }
 * Response: StudyReport 完整结构
 */
router.post('/report', async (req, res) => {
  const { valid, error } = validateReport(req.body)
  if (!valid) return res.status(400).json({ code: 400, message: error, data: null })

  try {
    if (AI_MOCK_MODE || !vivoClient.isVivoAvailable()) {
      const data = mockAI.generateReport(req.body)
      return res.json({ code: 0, message: 'ok', data })
    }

    // 真实蓝心 AI
    const prompt = promptBuilder.buildReportPrompt(req.body)
    const aiJsonText = await vivoClient.chatCompletion(promptBuilder.SYSTEM_PROMPT, prompt)

    // 解析 AI 返回的 JSON
    let aiData
    try {
      const jsonMatch = aiJsonText.match(/\{[\s\S]*\}/)
      aiData = JSON.parse(jsonMatch ? jsonMatch[0] : aiJsonText)
    } catch {
      // JSON 解析失败降级 Mock
      throw new Error('AI 返回 JSON 解析失败')
    }

    // 合并 Mock 结构 + AI 生成内容
    const base = mockAI.generateReport(req.body)
    const merged = {
      ...base,
      summary: aiData.summary || base.summary,
      advantage: aiData.advantage || base.advantage,
      problem: aiData.problem || base.problem,
      suggestions: aiData.suggestions || base.suggestions,
      encouragement: aiData.encouragement || base.encouragement,
    }

    return res.json({ code: 0, message: 'ok', data: merged })
  } catch (err) {
    console.warn('[AI] vivo 调用失败，降级到 Mock:', err.message)
    const data = mockAI.generateReport(req.body)
    res.json({ code: 0, message: 'ok (mock fallback)', data })
  }
})

export default router

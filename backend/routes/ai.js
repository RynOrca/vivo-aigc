/**
 * Task 3 文本 AI 服务路由
 *
 * POST /api/ai/intervention  — 生成分级干预提醒
 * POST /api/ai/rest-chat    — 生成休息伴聊文案
 * POST /api/ai/oral-review — 生成复盘引导问题
 * POST /api/ai/report       — 生成学习日报（DeepSeek JSON Mode 结构化输出）
 *
 * 四个接口均支持 Mock 降级：
 *   - AI_MOCK_MODE=true（默认）：直接返回本地模板文案
 *   - AI_MOCK_MODE=false：调用 llmClient（按 DEFAULT_MODEL_PROVIDER 选 DeepSeek / vivo）
 *   - 真实接口失败 → 自动降级 Mock
 */

import { Router } from 'express'
import dotenv from 'dotenv'
import * as mockAI from '../services/mockAI.js'
import * as promptBuilder from '../services/promptBuilder.js'
import * as llmClient from '../services/llmClient.js'
import { buildReportPrompt, REPORT_SYSTEM_PROMPT } from '../services/deepseekPrompts.js'
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
    if (AI_MOCK_MODE || !llmClient.isAvailable('text')) {
      // Mock 模式（无 Key 或 AI_MOCK_MODE=true）
      const event = mockAI.generateIntervention(req.body)
      return res.json({ code: 0, message: 'ok', data: event })
    }

    // 真实 LLM 调用（按 DEFAULT_MODEL_PROVIDER 选 DeepSeek / vivo）
    const prompt = promptBuilder.buildInterventionPrompt(req.body)
    const aiMessage = await llmClient.chatCompletion(
      promptBuilder.SYSTEM_PROMPT,
      prompt,
      { provider: process.env.DEFAULT_MODEL_PROVIDER },
    )

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
    // LLM 接口错误时降级到 Mock
    console.warn('[AI] LLM 调用失败，降级到 Mock:', err.message)
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
    if (AI_MOCK_MODE || !llmClient.isAvailable('text')) {
      const data = mockAI.generateRestChat(req.body)
      return res.json({ code: 0, message: 'ok', data })
    }

    // 真实 LLM 调用
    const prompt = promptBuilder.buildRestChatPrompt(req.body)
    const aiMessage = await llmClient.chatCompletion(
      promptBuilder.SYSTEM_PROMPT,
      prompt,
      { provider: process.env.DEFAULT_MODEL_PROVIDER },
    )
    const data = mockAI.generateRestChat(req.body)
    data.message = aiMessage  // AI 生成替换模板

    return res.json({ code: 0, message: 'ok', data })
  } catch (err) {
    console.warn('[AI] LLM 调用失败，降级到 Mock:', err.message)
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
    if (AI_MOCK_MODE || !llmClient.isAvailable('text')) {
      const data = mockAI.generateOralReview(req.body)
      return res.json({ code: 0, message: 'ok', data })
    }

    // 真实 LLM 调用
    const prompt = promptBuilder.buildOralReviewPrompt(req.body)
    const aiQuestion = await llmClient.chatCompletion(
      promptBuilder.SYSTEM_PROMPT,
      prompt,
      { provider: process.env.DEFAULT_MODEL_PROVIDER },
    )

    return res.json({
      code: 0,
      message: 'ok',
      data: { sessionId: req.body.sessionId, question: aiQuestion },
    })
  } catch (err) {
    console.warn('[AI] LLM 调用失败，降级到 Mock:', err.message)
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
    if (AI_MOCK_MODE || !llmClient.isAvailable('text')) {
      const data = mockAI.generateReport(req.body)
      return res.json({ code: 0, message: 'ok', data })
    }

    // 真实 LLM 调用 — 日报接口强制启用 DeepSeek JSON Mode
    const prompt = buildReportPrompt(req.body)
    const provider = process.env.DEFAULT_MODEL_PROVIDER

    // 当前 provider 是 deepseek 时启用 JSON Mode（DeepSeek 原生支持）
    // 其他 provider（如 vivo）走原有正则解析逻辑
    const useJsonMode = provider === 'deepseek'
    const aiJsonText = await llmClient.chatCompletion(
      REPORT_SYSTEM_PROMPT,
      prompt,
      {
        provider,
        response_format: useJsonMode ? { type: 'json_object' } : undefined,
        max_tokens: 1024,
      },
    )

    // 解析 AI 返回的 JSON
    let aiData
    try {
      const jsonMatch = aiJsonText.match(/\{[\s\S]*\}/)
      aiData = JSON.parse(jsonMatch ? jsonMatch[0] : aiJsonText)
    } catch {
      // JSON 解析失败降级 Mock
      throw new Error('AI 返回 JSON 解析失败')
    }

    // 字段 whitelist（防止 AI 输出非预期字段污染 StudyReport）
    const safeAiData = {
      summary: typeof aiData.summary === 'string' ? aiData.summary : null,
      advantage: typeof aiData.advantage === 'string' ? aiData.advantage : null,
      problem: typeof aiData.problem === 'string' ? aiData.problem : null,
      suggestions: Array.isArray(aiData.suggestions) ? aiData.suggestions : null,
      encouragement: typeof aiData.encouragement === 'string' ? aiData.encouragement : null,
    }

    // 合并 Mock 结构 + AI 生成内容（缺失字段由 Mock fallback 补全）
    const base = mockAI.generateReport(req.body)
    const merged = {
      ...base,
      summary: safeAiData.summary || base.summary,
      advantage: safeAiData.advantage || base.advantage,
      problem: safeAiData.problem || base.problem,
      suggestions: safeAiData.suggestions || base.suggestions,
      encouragement: safeAiData.encouragement || base.encouragement,
    }

    return res.json({ code: 0, message: 'ok', data: merged })
  } catch (err) {
    console.warn('[AI] LLM 调用失败，降级到 Mock:', err.message)
    const data = mockAI.generateReport(req.body)
    res.json({ code: 0, message: 'ok (mock fallback)', data })
  }
})

export default router

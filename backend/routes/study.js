/**
 * Task 3 学习会话路由
 *
 * POST /api/study/start   — 创建学习会话，返回 sessionId + 初始 StudyState
 * GET  /api/study/state   — 获取当前 StudyState（委托感知模块）
 * POST /api/study/end     — 结束会话，保存学习记录
 * GET  /api/study/report/:sessionId — 获取已生成的学习日报
 */

import { Router } from 'express'
import dotenv from 'dotenv'
import { generateStudyState } from '../../sensing/mockGenerator.js'
import { validateStartStudy, validateEndStudy } from '../schemas/validate.js'

dotenv.config()

const router = Router()

// ===== 会话内存存储（Demo 用，后续可替换为数据库） =====

const sessions = new Map()

/**
 * POST /api/study/start
 * Body: { userId, taskName, targetMinutes, mockMode }
 * Response: { sessionId, startedAt, initialState }
 */
router.post('/start', (req, res) => {
  const { valid, error } = validateStartStudy(req.body)
  if (!valid) return res.status(400).json({ code: 400, message: error, data: null })

  const { userId = 'demo_user', taskName = '未命名任务', targetMinutes = 45 } = req.body
  const sessionId = `study_${Date.now().toString(36)}`
  const startedAt = Math.floor(Date.now() / 1000)
  const initialState = generateStudyState(0, sessionId)

  sessions.set(sessionId, {
    userId,
    taskName,
    targetMinutes,
    startedAt,
    status: 'active',
    stateHistory: [],
    focusScores: [],
    distractionCount: 0,
  })

  res.json({
    code: 0,
    message: 'ok',
    data: { sessionId, startedAt, initialState, taskName, targetMinutes },
  })
})

/**
 * GET /api/study/state?sessionId=xxx
 * Response: StudyState
 */
router.get('/state', (req, res) => {
  const { sessionId } = req.query
  if (!sessionId) {
    return res.status(400).json({ code: 400, message: 'sessionId 必填', data: null })
  }

  const session = sessions.get(sessionId)
  if (!session) {
    return res.status(404).json({ code: 404, message: '会话不存在', data: null })
  }

  // 计算经过秒数
  const elapsed = Math.floor(Date.now() / 1000) - session.startedAt
  const state = generateStudyState(elapsed, sessionId)

  // 每 5 秒采样一次 focusScore，供日报生成专注曲线
  if (elapsed > 0 && elapsed % 5 === 0) {
    session.focusScores.push(state.focusScore)
  }
  session.distractionCount = state.distractionCount
  session.lastState = state

  res.json({ code: 0, message: 'ok', data: state })
})

/**
 * POST /api/study/end
 * Body: { sessionId, totalMinutes, focusHistory, distractionCount, oralReview }
 * Response: { sessionId, endedAt, summary }
 */
router.post('/end', (req, res) => {
  const { valid, error } = validateEndStudy(req.body)
  if (!valid) return res.status(400).json({ code: 400, message: error, data: null })

  const { sessionId } = req.body
  const session = sessions.get(sessionId)
  if (!session) {
    return res.status(404).json({ code: 404, message: '会话不存在', data: null })
  }

  const endedAt = Math.floor(Date.now() / 1000)
  session.status = 'completed'
  session.endedAt = endedAt
  session.summary = req.body

  res.json({
    code: 0,
    message: 'ok',
    data: {
      sessionId,
      endedAt,
      duration: session.startedAt ? endedAt - session.startedAt : 0,
      message: '学习会话已结束',
    },
  })
})

/**
 * GET /api/study/report/:sessionId
 * Response: 会话的学习数据摘要（供前端日报页参考）
 */
router.get('/report/:sessionId', (req, res) => {
  const session = sessions.get(req.params.sessionId)
  if (!session) {
    return res.status(404).json({ code: 404, message: '会话不存在', data: null })
  }

  res.json({
    code: 0,
    message: 'ok',
    data: {
      sessionId: req.params.sessionId,
      taskName: session.taskName,
      startedAt: session.startedAt,
      endedAt: session.endedAt,
      focusScores: session.focusScores,
      distractionCount: session.distractionCount,
      status: session.status,
    },
  })
})

export default router

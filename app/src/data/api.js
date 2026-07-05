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
    // 网络错误或后端未启动时降级到 Mock
    if (!MOCK_MODE === false) {
      console.warn(`[API] ${path} 请求失败，已降级 Mock:`, err.message)
    }
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
}

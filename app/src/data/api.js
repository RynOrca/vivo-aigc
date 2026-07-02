/**
 * API 服务层 — Mock 与真实接口的统一入口
 *
 * ==== Task 2 / Task 3 集成指南 ====
 *
 * 当前（Mock 模式）：所有函数返回本地 Mock 数据
 * 集成时（真实模式）：将 MOCK_MODE 改为 false，函数自动走 HTTP 请求
 *
 * 用法：
 *   import { getStudyState, requestIntervention, requestRestChat, requestReport } from './api.js'
 *
 * 切换方式：
 *   1. 改下面 MOCK_MODE = false
 *   2. 确认 BASE_URL 指向真实后端地址
 *   3. UI 代码无需任何改动
 */

import { generateStudyState } from './studyMock.js'
import { generateIntervention } from './interventionMock.js'
import { generateRestChat, generateReport } from './reportMock.js'

// ===== 配置 =====
export const MOCK_MODE = true
const BASE_URL = 'http://localhost:8000'

// ===== 内部工具 =====
async function apiCall(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  const json = await res.json()
  if (json.code !== 0) throw new Error(`API error ${json.code}: ${json.message}`)
  return json.data
}

// ===== 公开接口 =====

/**
 * 获取当前学习状态 — Task 2 感知模块
 * Mock: 本地生成   真实: GET /api/study/state?sessionId=xxx
 */
export async function getStudyState(elapsedSeconds, sessionId = 'study_001') {
  if (MOCK_MODE) return generateStudyState(elapsedSeconds)
  return apiCall(`/api/study/state?sessionId=${sessionId}`)
}

/**
 * 请求 AI 分级干预 — Task 3 AI 服务
 * Mock: 本地模板   真实: POST /api/ai/intervention
 */
export async function requestIntervention(sessionId, state) {
  if (MOCK_MODE) return generateIntervention(sessionId, state.distractionLevel)
  return apiCall('/api/ai/intervention', {
    method: 'POST',
    body: JSON.stringify({ sessionId, state }),
  })
}

/**
 * 获取休息伴聊文案 — Task 3 AI 服务
 * Mock: 本地模板   真实: POST /api/ai/rest-chat
 */
export async function requestRestChat(sessionId, data) {
  if (MOCK_MODE) return generateRestChat(data.totalMinutes)
  return apiCall('/api/ai/rest-chat', {
    method: 'POST',
    body: JSON.stringify({ sessionId, ...data }),
  })
}

/**
 * 生成学习日报 — Task 3 AI 服务
 * Mock: 本地计算   真实: POST /api/ai/report
 */
export async function requestReport(sessionId, data) {
  if (MOCK_MODE) return generateReport(data)
  return apiCall('/api/ai/report', {
    method: 'POST',
    body: JSON.stringify({ sessionId, ...data }),
  })
}

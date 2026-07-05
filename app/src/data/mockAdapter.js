/**
 * Mock 适配器 — 统一 Mock 函数入口
 *
 * api.js 通过此文件获取 Mock 数据，避免跨目录 import 导致 Vite 路径问题。
 * 真实 Mock 算法分布在各个 Mock 文件中：
 *   - studyMock.js: generateStudyState（场景循环 + StudyState 字段生成）
 *   - interventionMock.js: generateIntervention（分级干预模板）
 *   - reportMock.js: generateRestChat + generateReport（伴聊 + 日报）
 *
 * 当走真实后端时，api.js 不会调用此文件中的任何函数。
 */

import { generateStudyState } from './studyMock.js'
import { generateIntervention } from './interventionMock.js'
import { generateRestChat, generateReport } from './reportMock.js'

export { generateStudyState, generateIntervention, generateRestChat, generateReport }

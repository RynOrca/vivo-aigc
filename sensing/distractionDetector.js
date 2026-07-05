/**
 * Task 2 分心等级判断模块
 *
 * distractionLevel 判断规则：
 *
 *   L3（严重分心）：
 *     - 用户离座（isUserPresent = false）
 *     - 当前 App = entertainment
 *     - 连续分心 > 120 秒 + focusScore < 40
 *
 *   L2（连续分心）：
 *     - 连续分心 > 60 秒（gazeAwaySeconds >= 60）
 *     - 或 focusScore < 50
 *
 *   L1（轻微分心）：
 *     - 视线偏离超过 20 秒
 *     - 或 focusScore < 70（但 >= 50）
 *
 *   NONE（正常）：
 *     - 以上条件均不满足
 */

export const LEVELS = {
  NONE: 'NONE',
  L1: 'L1',
  L2: 'L2',
  L3: 'L3',
}

/**
 * 根据 StudyState 数据判断 distractionLevel
 * @param {object} state - StudyState 或原始感知数据
 * @returns {string} NONE / L1 / L2 / L3
 */
export function computeDistractionLevel(state) {
  // L3 条件
  if (!state.isUserPresent) return LEVELS.L3
  if (state.currentAppType === 'entertainment') return LEVELS.L3
  if (state.gazeAwaySeconds >= 120 && state.focusScore < 40) return LEVELS.L3

  // L2 条件
  if (state.gazeAwaySeconds >= 60) return LEVELS.L2
  if (state.focusScore < 50) return LEVELS.L2

  // L1 条件
  if (state.gazeAwaySeconds >= 20) return LEVELS.L1
  if (state.focusScore < 70) return LEVELS.L1

  // 默认正常
  return LEVELS.NONE
}

/**
 * 获取干预等级对应的中文描述
 * @param {string} level
 * @returns {string}
 */
export function getLevelDescription(level) {
  const map = {
    NONE: '专注学习中',
    L1: '轻微分心',
    L2: '连续分心',
    L3: '严重分心',
  }
  return map[level] || level
}

export default { computeDistractionLevel, getLevelDescription, LEVELS }

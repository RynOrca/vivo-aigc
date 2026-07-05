/**
 * Task 2 专注分计算模块
 *
 * focusScore 计算规则（范围 0-100）：
 *   - 基础分由当前场景决定（正常专注 82-95，分心时降低）
 *   - 视线偏离越久扣分越多
 *   - 闭眼占比高扣分（疲劳信号）
 *   - 低头持续扣分
 *   - 当前 App 类型影响（study=满分, neutral=-10, entertainment=-40）
 *
 * 有效学习判定：focusScore > 70
 */

/**
 * 根据原始感知数据计算 focusScore
 * @param {object} raw - 感知原始数据
 * @returns {number} 0-100 的专注分
 */
export function computeFocusScore(raw) {
  let score = 100

  // 视线偏离扣分（每 10 秒扣 5 分）
  if (raw.gazeAwaySeconds > 0) {
    score -= Math.min(40, Math.floor(raw.gazeAwaySeconds / 10) * 5)
  }

  // 闭眼占比扣分（闭眼 20% 以上开始扣分）
  if (raw.eyeClosedRatio > 0.15) {
    score -= Math.min(30, Math.floor((raw.eyeClosedRatio - 0.15) * 100) * 2)
  }

  // 低头扣分（超过 5 秒开始扣分）
  if (raw.headDownSeconds > 5) {
    score -= Math.min(20, (raw.headDownSeconds - 5) * 2)
  }

  // App 类型扣分
  const appPenalty = { study: 0, neutral: 10, entertainment: 40 }
  score -= appPenalty[raw.currentAppType] || 0

  // 离座直接归零
  if (!raw.isUserPresent) score = 0

  return Math.max(0, Math.min(100, score))
}

/**
 * 根据 focusScore 判断专注状态标签
 * @param {number} focusScore
 * @returns {string} deep_focus / normal / distracted
 */
export function getFocusLabel(focusScore) {
  if (focusScore >= 80) return 'deep_focus'
  if (focusScore >= 60) return 'normal'
  return 'distracted'
}

export default { computeFocusScore, getFocusLabel }

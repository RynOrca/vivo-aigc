/**
 * Task 2 疲劳指数计算模块
 *
 * fatigueScore 计算规则（范围 0-100）：
 *   - 基础疲劳随学习时长线性增长（每分钟 +0.5）
 *   - 闭眼占比高（>0.2）视为疲劳信号
 *   - 打哈欠次数（mouthOpenCount > 3）加疲劳
 *   - 长时间低头（>15 秒）加疲劳
 *   - 疲劳提醒阈值：>= 60
 */

const FATIGUE_THRESHOLD = 60

/**
 * 根据原始感知数据和学习时长计算 fatigueScore
 * @param {object} raw - 感知原始数据
 * @param {number} elapsedSeconds - 已学习秒数
 * @returns {number} 0-100 的疲劳指数
 */
export function computeFatigueScore(raw, elapsedSeconds) {
  let score = 0

  // 基础疲劳：学习时长线性增长（每分钟 +0.5 分）
  score += (elapsedSeconds / 60) * 0.5

  // 闭眼占比（疲劳信号）
  if (raw.eyeClosedRatio > 0.15) {
    score += Math.min(30, raw.eyeClosedRatio * 60)
  }

  // 打哈欠（张口次数）
  if (raw.mouthOpenCount > 2) {
    score += Math.min(20, (raw.mouthOpenCount - 2) * 5)
  }

  // 长时间低头
  if (raw.headDownSeconds > 10) {
    score += Math.min(15, (raw.headDownSeconds - 10) * 1.5)
  }

  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * 判断是否需要疲劳提醒
 * @param {number} fatigueScore
 * @returns {boolean}
 */
export function isFatigued(fatigueScore) {
  return fatigueScore >= FATIGUE_THRESHOLD
}

/**
 * 获取疲劳状态描述
 * @param {number} fatigueScore
 * @returns {string}
 */
export function getFatigueLabel(fatigueScore) {
  if (fatigueScore < 30) return 'energetic'
  if (fatigueScore < 60) return 'mild_fatigue'
  if (fatigueScore < 80) return 'moderate_fatigue'
  return 'severe_fatigue'
}

export default { computeFatigueScore, isFatigued, getFatigueLabel, FATIGUE_THRESHOLD }

/**
 * Phase 2 Mock 数据 — 模拟感知模块 StudyState 输出
 * 字段定义见 docs/API.md
 */

/**
 * 生成模拟学习状态，随时间推移产生变化
 * @param {number} elapsedSeconds - 已学习秒数
 * @returns {object} StudyState
 */
export function generateStudyState(elapsedSeconds) {
  // 用时间模拟不同阶段：前30秒正常 → 30-60秒轻微分心 → 60-90秒恢复 → ...
  const cycle = elapsedSeconds % 120

  let focusScore, fatigueScore, distractionLevel, emotion

  if (cycle < 30) {
    // 正常专注
    focusScore = 85 + Math.floor(Math.random() * 10)
    fatigueScore = 20 + Math.floor(elapsedSeconds / 60) * 2
    distractionLevel = 'NONE'
    emotion = 'focused'
  } else if (cycle < 60) {
    // 轻微分心
    focusScore = 60 + Math.floor(Math.random() * 10)
    fatigueScore = 30 + Math.floor(elapsedSeconds / 60) * 2
    distractionLevel = 'L1'
    emotion = 'distracted'
  } else if (cycle < 90) {
    // 恢复专注
    focusScore = 75 + Math.floor(Math.random() * 15)
    fatigueScore = 35 + Math.floor(elapsedSeconds / 60) * 2
    distractionLevel = 'NONE'
    emotion = 'calm'
  } else {
    // 疲劳偏高
    focusScore = 55 + Math.floor(Math.random() * 15)
    fatigueScore = 55 + Math.floor(Math.random() * 15)
    distractionLevel = 'L2'
    emotion = 'tired'
  }

  // 限制范围
  focusScore = Math.min(100, Math.max(0, focusScore))
  fatigueScore = Math.min(100, Math.max(0, fatigueScore))

  return {
    sessionId: 'study_001',
    timestamp: Math.floor(Date.now() / 1000),
    elapsedSeconds,
    focusScore,
    fatigueScore,
    distractionLevel,
    emotion,
    currentScene: 'study',
    isUserPresent: true,
    gazeAwaySeconds: distractionLevel === 'L1' ? 25 : distractionLevel === 'L2' ? 65 : 5,
    distractionCount: Math.floor(elapsedSeconds / 45),
  }
}

/**
 * Mock 感知模块 — 模拟 StudyState 输出
 * 字段定义见 docs/API.md §4.1
 *
 * ==== Task 2 集成指南 ====
 * 当 Task 2 感知模块就绪后，替换此文件为真实 API 调用：
 *   const res = await fetch('/api/study/state?sessionId=xxx')
 *   return res.json().data
 *
 * UI 层（StudyPage）只调用 generateStudyState()，不需要改动。
 */

/** 场景映射 — Demo 脚本 Steps 3-7 */
const SCENARIOS = {
  NORMAL: { focusRange: [82, 95], fatigueRange: [20, 40], level: 'NONE', emotion: 'focused', isPresent: true },
  L1_LIGHT: { focusRange: [60, 70], fatigueRange: [30, 45], level: 'L1', emotion: 'distracted', isPresent: true },
  RECOVERED: { focusRange: [75, 90], fatigueRange: [30, 45], level: 'NONE', emotion: 'calm', isPresent: true },
  L2_HEAVY: { focusRange: [40, 55], fatigueRange: [45, 60], level: 'L2', emotion: 'distracted', isPresent: true },
  FATIGUE_ONLY: { focusRange: [65, 75], fatigueRange: [65, 80], level: 'NONE', emotion: 'tired', isPresent: true },
  L3_ABSENT: { focusRange: [15, 30], fatigueRange: [45, 60], level: 'L3', emotion: 'anxious', isPresent: false },
}

const SCENE_SEQUENCE = [
  { scene: 'NORMAL',     until: 30 },
  { scene: 'L1_LIGHT',   until: 60 },
  { scene: 'RECOVERED',  until: 85 },
  { scene: 'L2_HEAVY',   until: 115 },
  { scene: 'RECOVERED',  until: 135 },
  { scene: 'FATIGUE_ONLY', until: 155 },
  { scene: 'L3_ABSENT',  until: 175 },
  { scene: 'RECOVERED',  until: 200 },
]

/**
 * 根据已学习秒数，返回当前应展示的场景
 * @param {number} elapsedSeconds
 * @returns {object} 场景定义
 */
function getCurrentScene(elapsedSeconds) {
  const cycle = elapsedSeconds % 200
  for (const step of SCENE_SEQUENCE) {
    if (cycle < step.until) return SCENARIOS[step.scene]
  }
  return SCENARIOS.NORMAL
}

function randInRange([min, max]) {
  return min + Math.floor(Math.random() * (max - min + 1))
}

/**
 * 生成模拟 StudyState — 供 StudyPage 调用
 * @param {number} elapsedSeconds - 已学习秒数
 * @returns {object} StudyState（字段完全符合 docs/API.md）
 */
export function generateStudyState(elapsedSeconds) {
  const scene = getCurrentScene(elapsedSeconds)

  const focusScore = randInRange(scene.focusRange)
  const fatigueScore = randInRange(scene.fatigueRange)
    + Math.floor(elapsedSeconds / 300) * 3 // 长期趋势：每 5 分钟 +3

  // 分心相关指标
  const isL1 = scene.level === 'L1'
  const isL2 = scene.level === 'L2'
  const isL3 = scene.level === 'L3'

  return {
    // === 核心状态 ===
    sessionId: 'study_001',
    timestamp: Math.floor(Date.now() / 1000),
    elapsedSeconds,
    focusScore: Math.min(100, Math.max(0, focusScore)),
    fatigueScore: Math.min(100, Math.max(0, fatigueScore)),
    distractionLevel: scene.level,
    emotion: scene.emotion,
    currentScene: 'study',
    isUserPresent: scene.isPresent,

    // === 感知原始数据（供 AI 模块分析） ===
    headDownSeconds: isL2 ? 12 : isL3 ? 0 : 3,
    eyeClosedRatio: scene.level === 'FATIGUE_ONLY' ? 0.25 : isL3 ? 0.05 : 0.08,
    gazeAwaySeconds: isL1 ? 25 : isL2 ? 65 : isL3 ? 0 : 5,
    mouthOpenCount: scene.level === 'FATIGUE_ONLY' ? 3 : 1,
    currentAppType: isL3 ? 'entertainment' : 'study',
    distractionCount: Math.floor(elapsedSeconds / 45),
  }
}

/**
 * Task 2 端侧感知模块 — Mock StudyState 生成器
 *
 * 每 5 秒输出一次标准 StudyState，字段完全符合 docs/API.md §4.1
 *
 * 支持 6 种 Mock 场景（200 秒循环，覆盖 Demo 脚本所有步骤）：
 *   - 正常专注 (NORMAL)
 *   - 轻微分心 (L1_LIGHT)
 *   - 连续分心 (L2_HEAVY)
 *   - 疲劳偏高 (FATIGUE_ONLY)
 *   - 离座     (L3_ABSENT)
 *   - 恢复专注 (RECOVERED)
 *
 * 算法与前端 app/src/data/studyMock.js 保持一致，移植为独立 Node 模块。
 */

// ===== 场景定义 =====

const SCENARIOS = {
  NORMAL: {
    focusRange: [82, 95],
    fatigueRange: [20, 40],
    level: 'NONE',
    emotion: 'focused',
    isPresent: true,
    appType: 'study',
    eyeClosed: [0.03, 0.10],
    gazeAway: [0, 10],
    headDown: [0, 5],
    mouthOpen: [0, 1],
  },
  L1_LIGHT: {
    focusRange: [60, 70],
    fatigueRange: [30, 45],
    level: 'L1',
    emotion: 'distracted',
    isPresent: true,
    appType: 'study',
    eyeClosed: [0.05, 0.15],
    gazeAway: [20, 35],
    headDown: [5, 15],
    mouthOpen: [1, 2],
  },
  RECOVERED: {
    focusRange: [75, 90],
    fatigueRange: [30, 45],
    level: 'NONE',
    emotion: 'calm',
    isPresent: true,
    appType: 'study',
    eyeClosed: [0.03, 0.10],
    gazeAway: [0, 8],
    headDown: [0, 5],
    mouthOpen: [0, 1],
  },
  L2_HEAVY: {
    focusRange: [40, 55],
    fatigueRange: [45, 60],
    level: 'L2',
    emotion: 'distracted',
    isPresent: true,
    appType: 'neutral',
    eyeClosed: [0.10, 0.25],
    gazeAway: [55, 80],
    headDown: [10, 25],
    mouthOpen: [1, 3],
  },
  FATIGUE_ONLY: {
    focusRange: [65, 75],
    fatigueRange: [65, 80],
    level: 'NONE',
    emotion: 'tired',
    isPresent: true,
    appType: 'study',
    eyeClosed: [0.20, 0.35],
    gazeAway: [5, 15],
    headDown: [5, 15],
    mouthOpen: [2, 5],
  },
  L3_ABSENT: {
    focusRange: [15, 30],
    fatigueRange: [45, 60],
    level: 'L3',
    emotion: 'anxious',
    isPresent: false,
    appType: 'entertainment',
    eyeClosed: [0.0, 0.05],
    gazeAway: [0, 0],
    headDown: [0, 0],
    mouthOpen: [0, 1],
  },
}

// 场景序列（200 秒循环）—— 与前端 studyMock.js 完全一致
const SCENE_SEQUENCE = [
  { scene: 'NORMAL',       until: 30 },
  { scene: 'L1_LIGHT',     until: 60 },
  { scene: 'RECOVERED',    until: 85 },
  { scene: 'L2_HEAVY',     until: 115 },
  { scene: 'RECOVERED',    until: 135 },
  { scene: 'FATIGUE_ONLY', until: 155 },
  { scene: 'L3_ABSENT',    until: 175 },
  { scene: 'RECOVERED',    until: 200 },
]

// ===== 工具函数 =====

function rand([min, max]) {
  return min + Math.random() * (max - min)
}

function randInt([min, max]) {
  return Math.floor(rand([min, max + 1]))
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

// ===== 场景判定 =====

function getCurrentScene(elapsedSeconds) {
  const cycle = elapsedSeconds % 200
  for (const step of SCENE_SEQUENCE) {
    if (cycle < step.until) return SCENARIOS[step.scene]
  }
  return SCENARIOS.NORMAL
}

// ===== 公开接口 =====

/**
 * 生成模拟 StudyState
 * @param {number} elapsedSeconds - 已学习秒数
 * @param {string} sessionId - 会话 ID（默认 study_001）
 * @returns {object} 标准 StudyState，字段完全符合 docs/API.md §4.1
 */
export function generateStudyState(elapsedSeconds, sessionId = 'study_001') {
  const scene = getCurrentScene(elapsedSeconds)

  const focusRaw = randInt(scene.focusRange)
  const fatigueRaw = randInt(scene.fatigueRange) + Math.floor(elapsedSeconds / 300) * 3

  const isL1 = scene.level === 'L1'
  const isL2 = scene.level === 'L2'
  const isL3 = scene.level === 'L3'
  const isFatigue = scene.level === 'FATIGUE_ONLY'

  return {
    sessionId,
    timestamp: Math.floor(Date.now() / 1000),
    elapsedSeconds,
    focusScore: clamp(focusRaw, 0, 100),
    fatigueScore: clamp(fatigueRaw, 0, 100),
    distractionLevel: scene.level,
    emotion: scene.emotion,
    currentScene: 'study',
    isUserPresent: scene.isPresent,
    headDownSeconds: isL2 ? randInt([12, 25]) : isL3 ? 0 : randInt(scene.headDown),
    eyeClosedRatio: isFatigue ? rand(scene.eyeClosed) : isL3 ? 0.05 : parseFloat(rand(scene.eyeClosed).toFixed(2)),
    gazeAwaySeconds: isL1 ? randInt([20, 35]) : isL2 ? randInt([55, 80]) : isL3 ? 0 : randInt(scene.gazeAway),
    mouthOpenCount: isFatigue ? randInt([3, 5]) : randInt(scene.mouthOpen),
    currentAppType: scene.appType,
    distractionCount: Math.floor(elapsedSeconds / 45),
  }
}

/**
 * 根据 StudyState 反向判断触发的 DistractionLevel（供 AI 模块参考）
 * @param {object} state
 * @returns {string} NONE / L1 / L2 / L3
 */
export function computeDistractionLevel(state) {
  if (!state.isUserPresent) return 'L3'
  if (state.currentAppType === 'entertainment') return 'L3'
  if (state.gazeAwaySeconds >= 60) return 'L2'
  if (state.gazeAwaySeconds >= 20) return 'L1'
  if (state.focusScore < 50) return 'L2'
  if (state.focusScore < 70) return 'L1'
  return 'NONE'
}

export default { generateStudyState, computeDistractionLevel }

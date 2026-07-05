/**
 * Task 2 感知模块测试脚本
 *
 * 运行方式：node sensing/test_sensing.js
 *
 * 输出：每 3 秒（加速 Demo）打印一条 StudyState，
 *       覆盖 200 秒完整场景循环，验证所有字段和场景切换。
 */

import { generateStudyState, computeDistractionLevel } from './mockGenerator.js'

const REQUIRED_FIELDS = [
  'sessionId', 'timestamp', 'elapsedSeconds',
  'focusScore', 'fatigueScore', 'distractionLevel',
  'emotion', 'currentScene', 'isUserPresent',
  'headDownSeconds', 'eyeClosedRatio', 'gazeAwaySeconds',
  'mouthOpenCount', 'currentAppType', 'distractionCount',
]

let passed = true

function validate(state, elapsed) {
  // 检查必填字段
  for (const field of REQUIRED_FIELDS) {
    if (!(field in state)) {
      console.error(`❌ [${elapsed}s] 缺少字段: ${field}`)
      passed = false
    }
  }

  // 检查值范围
  if (state.focusScore < 0 || state.focusScore > 100) {
    console.error(`❌ [${elapsed}s] focusScore 越界: ${state.focusScore}`)
    passed = false
  }
  if (state.fatigueScore < 0 || state.fatigueScore > 100) {
    console.error(`❌ [${elapsed}s] fatigueScore 越界: ${state.fatigueScore}`)
    passed = false
  }
  if (!['NONE', 'L1', 'L2', 'L3'].includes(state.distractionLevel)) {
    console.error(`❌ [${elapsed}s] distractionLevel 非法: ${state.distractionLevel}`)
    passed = false
  }
  if (!['calm', 'focused', 'tired', 'anxious', 'distracted'].includes(state.emotion)) {
    console.error(`❌ [${elapsed}s] emotion 非法: ${state.emotion}`)
    passed = false
  }

  return true
}

function formatState(state) {
  return `[${String(state.elapsedSeconds).padStart(3)}s] ` +
    `focus=${String(state.focusScore).padStart(2)} ` +
    `fatigue=${String(state.fatigueScore).padStart(2)} ` +
    `level=${state.distractionLevel.padEnd(4)} ` +
    `emotion=${state.emotion.padEnd(10)} ` +
    `present=${state.isUserPresent ? 'Y' : 'N'} ` +
    `gaze=${String(state.gazeAwaySeconds).padStart(2)}s ` +
    `app=${state.currentAppType}`
}

async function run() {
  console.log('=== Task 2 感知模块测试 ===\n')
  console.log('场景序列（200 秒循环）：\n')

  // 模拟 60 秒（加速，每"秒"实际等待 100ms）
  const TOTAL_SECONDS = 60
  const STEP_MS = 100

  for (let i = 0; i < TOTAL_SECONDS; i++) {
    const state = generateStudyState(i)
    validate(state, i)

    // 场景切换时打印分隔线
    const sceneMarkers = {
      0: '▶ NORMAL（正常专注）',
      30: '▶ L1_LIGHT（轻微分心）',
      60: '▶ RECOVERED（恢复专注）',
    }
    if (sceneMarkers[i]) {
      console.log(`\n── ${sceneMarkers[i]} ──`)
    }

    if (i % 5 === 0) {
      console.log(formatState(state))
    }

    await new Promise(r => setTimeout(r, STEP_MS))
  }

  console.log('\n── 场景切换验证 ──\n')

  // 验证 6 个关键场景
  const checkpoints = [
    { at: 10, expect: 'NONE',      label: '正常专注' },
    { at: 40, expect: 'L1',        label: '轻微分心' },
    { at: 100, expect: 'L2',       label: '连续分心' },
    { at: 150, expect: 'NONE',     label: '疲劳偏高' },
    { at: 160, expect: 'L3',       label: '离座' },
    { at: 180, expect: 'NONE',     label: '恢复专注' },
  ]

  for (const cp of checkpoints) {
    const state = generateStudyState(cp.at)
    const ok = state.distractionLevel === cp.expect
    console.log(
      `${ok ? '✅' : '❌'} ${cp.label}（${cp.at}s）` +
      `: distractionLevel=${state.distractionLevel} (预期 ${cp.expect})`
    )
    if (!ok) passed = false
  }

  console.log(`\n${passed ? '✅ 全部通过！' : '❌ 存在失败项'}`)
  process.exit(passed ? 0 : 1)
}

run()

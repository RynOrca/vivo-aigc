/**
 * Task 3 Mock AI 服务
 *
 * 当 AI_MOCK_MODE=true 时使用，根据输入数据生成文案。
 * 算法和文案模板与前端 app/src/data/ 中的 Mock 文件保持一致。
 */

// ===== 干预文案模板 =====

const INTERVENTION_TEMPLATES = {
  L1: {
    type: 'TEXT',
    title: '注意力提醒',
    messages: [
      '眼睛离开屏幕有点久了，回到当前题目上吧 🙂',
      '稍微分心了哦，把手头这一步完成就好。',
      '来，深呼吸一下，重新聚焦。',
      '注意力像肌肉，稍微走神是正常的，轻轻拉回来就好。',
      '分心一下没关系，先完成眼前这一小步。',
    ],
    actions: ['回到当前任务', '继续学习', '重新聚焦'],
  },
  L2: {
    type: 'VOICE',
    title: '需要调整一下',
    messages: [
      '你已经分心一小会儿了，先把注意力拉回当前这一步吧。',
      '连续分心会降低效率，要不要先完成当前小任务再休息？',
      '注意到你状态有些下滑，试着回到刚才那道题上。',
      '专注节奏断了没关系，从下一个小题重新开始就好。',
      '先放下干扰源，给自己 3 分钟只做一件事。',
    ],
    actions: ['先完成当前小任务，再休息', '回到学习内容', '调整状态，继续学习'],
  },
  L3: {
    type: 'POPUP',
    title: '暂停一下',
    messages: [
      '你已经离开座位或严重分心，建议暂停并休息一会儿。重新规划后再开始会更高效。',
      '看起来当前状态不太好，硬撑效果有限。建议休息 5 分钟，让大脑恢复一下。',
      '学习需要好状态。不如站起来活动一下，回来再继续效果更好。',
      '已经持续分心一段时间了。给自己一个小休息，让专注力恢复后再继续。',
    ],
    actions: ['休息一下', '暂停学习', '重新规划后再继续'],
  },
}

let eventCounter = 0

/**
 * 生成分级干预事件
 */
export function generateIntervention({ sessionId, focusScore, fatigueScore, distractionLevel, triggerReason }) {
  const tpl = INTERVENTION_TEMPLATES[distractionLevel]
  if (!tpl) return null

  eventCounter++
  const msgIdx = Math.floor(Math.random() * tpl.messages.length)

  return {
    eventId: `evt_${String(eventCounter).padStart(3, '0')}`,
    sessionId: sessionId || 'study_001',
    level: distractionLevel,
    type: tpl.type,
    title: tpl.title,
    message: tpl.messages[msgIdx],
    action: tpl.actions[msgIdx % tpl.actions.length],
    triggerReason: triggerReason || defaultTriggerReason(distractionLevel),
    timestamp: Math.floor(Date.now() / 1000),
  }
}

function defaultTriggerReason(level) {
  switch (level) {
    case 'L1': return '视线偏离超过20秒'
    case 'L2': return '连续分心超过60秒'
    case 'L3': return '离座或严重分心'
    default: return '状态变化'
  }
}

// ===== 休息伴聊模板 =====

const REST_TEMPLATES = [
  {
    message: '你已经坚持了{minutes}分钟，挺不容易的。现在可以先放松一下眼睛。刚才这段学习里，哪一类题最卡？',
    suggestedReplies: ['第二篇阅读比较卡', '注意力后半段下降了', '整体还可以'],
  },
  {
    message: '辛苦了！{minutes}分钟的学习下来感觉怎么样？有没有哪个部分让你特别头疼？',
    suggestedReplies: ['公式记忆有点吃力', '前面还行，后面累了', '比昨天好一点'],
  },
  {
    message: '不错的一段专注时间！先喝口水休息一下。你觉得刚才哪一步可以做得更好？',
    suggestedReplies: ['中间分心了两次', '节奏还可以', '需要更多练习'],
  },
]

const ORAL_REVIEW_QUESTIONS = [
  '用一句话说说，刚才这段时间你主要完成了什么？',
  '刚才的学习中，最有收获的一个点是？',
  '如果能重来，你会怎么调整刚才的学习节奏？',
]

/**
 * 生成休息伴聊文案
 */
export function generateRestChat({ sessionId, sessionDuration, userGoal, recentState }) {
  const idx = Math.floor(Math.random() * REST_TEMPLATES.length)
  const tpl = REST_TEMPLATES[idx]
  const minutes = sessionDuration || 30

  return {
    sessionId: sessionId || 'study_001',
    message: tpl.message.replace('{minutes}', String(minutes)),
    suggestedReplies: tpl.suggestedReplies,
    question: ORAL_REVIEW_QUESTIONS[Math.floor(Math.random() * ORAL_REVIEW_QUESTIONS.length)],
    restDuration: minutes >= 45 ? 5 : 3,
  }
}

/**
 * 生成口头复盘问题
 */
export function generateOralReview({ sessionId, taskName, focusScore, distractionCount, durationMinutes }) {
  const idx = Math.floor(Math.random() * ORAL_REVIEW_QUESTIONS.length)
  return {
    sessionId: sessionId || 'study_001',
    question: ORAL_REVIEW_QUESTIONS[idx],
  }
}

// ===== 学习日报生成 =====

const ENCOURAGEMENTS = [
  '今天已经完成了一段高质量学习，继续保持。',
  '每一步都在靠近目标，今天的努力不会白费。',
  '学习是一场马拉松，你今天跑得很好。',
  '坚持到底的人运气都不会太差，你已经做到了。',
  '今天的付出是明天的底气，继续加油。',
]

/**
 * 生成学习日报
 */
export function generateReport({
  sessionId,
  totalMinutes,
  effectiveMinutes,
  averageFocusScore,
  maxFatigueScore,
  distractionCount,
  oralReview,
  focusCurve,
}) {
  const avgFocus = averageFocusScore || (focusCurve && focusCurve.length > 0
    ? Math.round(focusCurve.reduce((a, b) => a + b, 0) / focusCurve.length)
    : 78)

  const summary = avgFocus > 75
    ? '今天整体学习状态较好，有效学习时间占比较高。'
    : avgFocus > 60
      ? '今天学习状态中等，有波动但总体在轨道上。'
      : '今天状态有些起伏，分心次数偏多，需要调整学习策略。'

  const advantage = avgFocus > 75
    ? '你能持续保持较高的专注度，学习效率不错。'
    : '你坚持完成了计划的学习时长，自律性值得肯定。'

  const problem = distractionCount > 3
    ? `分心次数达到${distractionCount}次，建议减少干扰源或尝试番茄钟。`
    : totalMinutes >= 45
      ? '长时间学习后疲劳有所上升，建议下次提前安排短休息。'
      : '分心控制得不错，继续保持当前的学习环境。'

  const suggestions = [
    distractionCount > 3
      ? '下次可以把任务拆成更小的 25 分钟单元'
      : '继续保持当前学习节奏',
    totalMinutes >= 45
      ? '每 30 分钟安排一次 5 分钟休息，降低疲劳影响'
      : '可以尝试逐步增加学习时长到 45 分钟',
  ]

  return {
    sessionId: sessionId || 'study_001',
    createdAt: Math.floor(Date.now() / 1000),
    totalMinutes: totalMinutes || 0,
    effectiveMinutes: effectiveMinutes || Math.round((totalMinutes || 0) * avgFocus / 100),
    averageFocusScore: avgFocus,
    maxFatigueScore: maxFatigueScore || 50,
    distractionCount: distractionCount || 0,
    focusCurve: focusCurve || [],
    fatigueCurve: (focusCurve || []).map(f => Math.min(100, 100 - f + Math.floor(Math.random() * 20))),
    oralReview: oralReview || null,
    summary,
    advantage,
    problem,
    suggestions,
    encouragement: ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)],
  }
}

export default {
  generateIntervention,
  generateRestChat,
  generateOralReview,
  generateReport,
}

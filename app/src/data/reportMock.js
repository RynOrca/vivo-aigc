/**
 * Phase 4 Mock 数据 — AI 伴聊文案 + 学习日报生成
 * 字段定义见 docs/API.md
 */

const restMessages = [
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

const oralReviewQuestions = [
  '用一句话说说，刚才这段时间你主要完成了什么？',
  '刚才的学习中，最有收获的一个点是？',
  '如果能重来，你会怎么调整刚才的学习节奏？',
]

export function generateRestChat(totalMinutes) {
  const idx = Math.floor(Math.random() * restMessages.length)
  const tpl = restMessages[idx]
  return {
    message: tpl.message.replace('{minutes}', String(totalMinutes)),
    suggestedReplies: tpl.suggestedReplies,
    question: oralReviewQuestions[Math.floor(Math.random() * oralReviewQuestions.length)],
    restDuration: totalMinutes >= 45 ? 5 : 3, // 休息分钟数
  }
}

/**
 * 根据学习数据生成日报
 */
export function generateReport({ totalMinutes, focusHistory, distractionCount, oralReview }) {
  const avgFocus = focusHistory.length > 0
    ? Math.round(focusHistory.reduce((a, b) => a + b, 0) / focusHistory.length)
    : 78

  const maxFatigue = 30 + Math.floor(totalMinutes / 2)
  const effectiveMinutes = Math.round(totalMinutes * avgFocus / 100)

  // 专注曲线采样（每 5 分钟取一个点）
  const focusCurve = focusHistory.length > 0
    ? focusHistory
    : Array.from({ length: Math.max(3, Math.ceil(totalMinutes / 5)) }, () =>
        60 + Math.floor(Math.random() * 35)
      )

  const fatigueCurve = focusCurve.map((f) =>
    Math.min(100, 100 - f + Math.floor(Math.random() * 20))
  )

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
    : '分心控制得不错，继续保持当前的学习环境。'

  const suggestions = [
    distractionCount > 3
      ? '下次可以把任务拆成更小的 25 分钟单元'
      : '继续保持当前学习节奏',
    totalMinutes >= 45
      ? '每 30 分钟安排一次 5 分钟休息，降低疲劳影响'
      : '可以尝试逐步增加学习时长到 45 分钟',
  ]

  const encouragements = [
    '今天已经完成了一段高质量学习，继续保持。',
    '每一步都在靠近目标，今天的努力不会白费。',
    '学习是一场马拉松，你今天跑得很好。',
  ]

  return {
    sessionId: 'study_001',
    createdAt: Math.floor(Date.now() / 1000),
    totalMinutes,
    effectiveMinutes,
    averageFocusScore: avgFocus,
    maxFatigueScore: Math.min(100, maxFatigue),
    distractionCount,
    focusCurve,
    fatigueCurve,
    oralReview,
    summary,
    advantage,
    problem,
    suggestions,
    encouragement: encouragements[Math.floor(Math.random() * encouragements.length)],
  }
}

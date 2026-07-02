/**
 * Phase 3 Mock 数据 — AI 干预事件生成
 * 字段定义见 docs/API.md InterventionEvent
 */

const templates = {
  L1: {
    type: 'TEXT',
    title: '注意力提醒',
    messages: [
      '眼睛离开屏幕有点久了，回到当前题目上吧 🙂',
      '稍微分心了哦，把手头这一步完成就好。',
      '来，深呼吸一下，重新聚焦。',
    ],
    actions: [
      '回到当前任务',
      '继续学习',
      '重新聚焦',
    ],
  },
  L2: {
    type: 'VOICE',
    title: '需要调整一下',
    messages: [
      '你已经分心一小会儿了，先把注意力拉回当前这一步吧。',
      '连续分心会降低效率，要不要先完成当前小任务再休息？',
      '注意到你状态有些下滑，试着回到刚才那道题上。',
    ],
    actions: [
      '先完成当前小任务，再休息',
      '回到学习内容',
      '调整状态，继续学习',
    ],
  },
  L3: {
    type: 'POPUP',
    title: '暂停一下',
    messages: [
      '你已经离开座位或严重分心，建议暂停并休息一会儿。重新规划后再开始会更高效。',
      '看起来当前状态不太好，硬撑效果有限。建议休息 5 分钟，让大脑恢复一下。',
    ],
    actions: [
      '休息一下',
      '暂停学习',
    ],
  },
}

let eventCounter = 0

/**
 * 根据分心等级生成干预事件
 * @param {string} sessionId
 * @param {string} level - L1 / L2 / L3
 * @returns {object} InterventionEvent
 */
export function generateIntervention(sessionId, level) {
  const tpl = templates[level]
  if (!tpl) return null

  eventCounter++
  const msgIdx = Math.floor(Math.random() * tpl.messages.length)

  return {
    eventId: `evt_${String(eventCounter).padStart(3, '0')}`,
    sessionId,
    level,
    type: tpl.type,
    title: tpl.title,
    message: tpl.messages[msgIdx],
    action: tpl.actions[msgIdx % tpl.actions.length],
    triggerReason: level === 'L1'
      ? '视线偏离超过20秒'
      : level === 'L2'
        ? '连续分心超过60秒'
        : '离座或严重分心',
    timestamp: Math.floor(Date.now() / 1000),
  }
}

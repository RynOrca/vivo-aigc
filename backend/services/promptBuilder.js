/**
 * Task 3 Prompt 构造模块
 *
 * 将所有 Prompt 模板集中管理，方便后续调优和版本管理。
 * 对接蓝心 AI 时，这些 prompt 通过 vivoClient.js 发送到官方接口。
 */

// ===== 系统角色设定 =====

export const SYSTEM_PROMPT = `你是一名专业的学习陪伴导师，擅长用温和、鼓励的语气引导用户复盘学习过程。
你的职责是：
1. 帮助学生识别学习中的问题，而不是批评
2. 给出具体、可执行的改进建议
3. 关注学生的情绪状态，提供情感支持
4. 用简短有力的语言表达（每条建议不超过 50 字）

回答风格：温和、不说教、不制造焦虑、有陪伴感。`

// ===== 干预 Prompt =====

export function buildInterventionPrompt({ distractionLevel, focusScore, fatigueScore, triggerReason, elapsedSeconds }) {
  return `用户正在学习，已经专注了 ${Math.floor(elapsedSeconds / 60)} 分钟。
当前状态：
- 专注分：${focusScore}/100
- 疲劳指数：${fatigueScore}/100
- 分心等级：${distractionLevel}
- 触发原因：${triggerReason}

请根据分心等级生成一条提醒：
- L1（轻微分心）：温和提醒，不超过 30 字，不打断学习节奏
- L2（连续分心）：明确建议，不超过 50 字，引导用户回到任务
- L3（严重分心）：建议暂停并重新规划，不超过 60 字

只输出提醒文案，不要任何前缀或解释。`
}

// ===== 休息伴聊 Prompt =====

export function buildRestChatPrompt({ sessionDuration, fatigueScore, userGoal, recentState }) {
  return `用户刚刚结束了一段学习：
- 学习时长：${sessionDuration} 分钟
- 疲劳指数：${fatigueScore}/100
- 学习目标：${userGoal || '未指定'}
- 最近状态：${recentState}

请生成一句 AI 关怀语（不超过 80 字），像朋友一样关心用户的状态，
并自然地引导用户回顾刚才的学习内容。不要直接问"累不累"，要更自然。

只输出对话文案，不要任何前缀。`
}

// ===== 口头复盘 Prompt =====

export function buildOralReviewPrompt({ taskName, focusScore, distractionCount, durationMinutes }) {
  return `用户完成了 ${durationMinutes} 分钟的「${taskName || '学习'}」：
- 平均专注分：${focusScore}/100
- 分心次数：${distractionCount} 次

请生成一句低压力的复盘引导问题（不超过 40 字），
让用户用一句话就能回答，不给用户答题压力。

只输出问题文案，不要任何前缀。`
}

// ===== 学习日报 Prompt =====

export function buildReportPrompt({ totalMinutes, effectiveMinutes, averageFocusScore, maxFatigueScore, distractionCount, oralReview }) {
  return `用户本次学习数据：
- 总时长：${totalMinutes} 分钟
- 有效学习时长：${effectiveMinutes} 分钟
- 平均专注分：${averageFocusScore}/100
- 最高疲劳指数：${maxFatigueScore}/100
- 分心次数：${distractionCount}
- 用户复盘：「${oralReview || '未提供'}」

请生成一份学习日报，包含以下内容（使用 JSON 格式输出）：
{
  "summary": "一句话总结本次学习状态（30 字以内）",
  "advantage": "做得好的地方（30 字以内）",
  "problem": "可优化的问题（30 字以内）",
  "suggestions": ["两条可执行建议（每条不超过 30 字）"],
  "encouragement": "一句鼓励语（20 字以内）"
}

只输出合法 JSON，不要任何解释文字。`
}

export default {
  SYSTEM_PROMPT,
  buildInterventionPrompt,
  buildRestChatPrompt,
  buildOralReviewPrompt,
  buildReportPrompt,
}

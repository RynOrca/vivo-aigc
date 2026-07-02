/**
 * Phase 1 Mock 数据 — Dashboard 首页
 * 字段定义见 docs/API.md
 */

export const dashboardData = {
  userName: '小明',
  currentDate: new Date().toLocaleDateString('zh-CN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
  todayStudyMinutes: 0,
  todayEffectiveMinutes: 0,
  aiEncouragement: '准备好开始今天的学习了吗？我会一直陪着你 💪',
}

/**
 * Task 3 请求体字段校验
 *
 * 轻量级校验，不引入额外依赖。
 * 返回 { valid: boolean, error?: string }
 */

export function validateIntervention(body) {
  if (!body.sessionId) return { valid: false, error: 'sessionId 必填' }
  if (!body.distractionLevel) return { valid: false, error: 'distractionLevel 必填' }
  if (!['NONE', 'L1', 'L2', 'L3'].includes(body.distractionLevel)) {
    return { valid: false, error: 'distractionLevel 必须为 NONE/L1/L2/L3' }
  }
  return { valid: true }
}

export function validateRestChat(body) {
  if (!body.sessionId) return { valid: false, error: 'sessionId 必填' }
  return { valid: true }
}

export function validateOralReview(body) {
  if (!body.sessionId) return { valid: false, error: 'sessionId 必填' }
  return { valid: true }
}

export function validateReport(body) {
  if (!body.sessionId) return { valid: false, error: 'sessionId 必填' }
  if (typeof body.totalMinutes !== 'number' || body.totalMinutes < 0) {
    return { valid: false, error: 'totalMinutes 必须为非负数' }
  }
  return { valid: true }
}

export function validateStartStudy(body) {
  if (!body.userId) return { valid: false, error: 'userId 必填' }
  return { valid: true }
}

export function validateEndStudy(body) {
  if (!body.sessionId) return { valid: false, error: 'sessionId 必填' }
  return { valid: true }
}

export default {
  validateIntervention,
  validateRestChat,
  validateOralReview,
  validateReport,
  validateStartStudy,
  validateEndStudy,
}

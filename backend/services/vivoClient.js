/**
 * Task 3 vivo AIGC (蓝心 AI) 客户端
 *
 * 接入文档：https://aigc.vivo.com.cn/#/document/index?id=1677
 *
 * 当 AI_MOCK_MODE=false 时，所有 AI 调用转发到蓝心官方接口。
 * vivo 接口不可用时自动降级到 Mock，不阻塞 Demo 主流程。
 *
 * 注意：VIVO_API_KEY 必须通过 .env 或环境变量传入，绝不硬编码。
 */

import dotenv from 'dotenv'
dotenv.config()

const VIVO_BASE_URL = process.env.VIVO_BASE_URL || 'https://api-ai.vivo.com.cn'
const VIVO_API_KEY = process.env.VIVO_API_KEY || ''
const VIVO_MODEL = process.env.VIVO_MODEL || 'blue-lm-v-3b'

/**
 * 调用蓝心 AI 对话接口
 *
 * @param {string} systemPrompt - 系统提示词
 * @param {string} userMessage - 用户消息
 * @returns {Promise<string>} AI 回复文本
 *
 * vivo AIGC 接口按 OpenAI 兼容格式调用：
 *   POST {VIVO_BASE_URL}/v1/chat/completions
 *   Header: Authorization: Bearer {VIVO_API_KEY}
 *   Body: { model, messages: [{role, content}], stream: false, max_tokens }
 */
export async function chatCompletion(systemPrompt, userMessage) {
  if (!VIVO_API_KEY) {
    throw new Error('VIVO_API_KEY 未配置，请在 .env 文件中设置')
  }

  const url = `${VIVO_BASE_URL.replace(/\/+$/, '')}/v1/chat/completions`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VIVO_API_KEY}`,
    },
    body: JSON.stringify({
      model: VIVO_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      stream: false,
      max_tokens: 512,
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`蓝心 AI 接口 HTTP ${response.status}: ${errText.slice(0, 200)}`)
  }

  const data = await response.json()

  // OpenAI 兼容响应格式
  const content = data?.choices?.[0]?.message?.content
  if (!content) {
    throw new Error(`蓝心 AI 响应格式异常: ${JSON.stringify(data).slice(0, 200)}`)
  }

  return content.trim()
}

/**
 * 检测 vivo Key 是否已配置
 */
export function isVivoAvailable() {
  return Boolean(VIVO_API_KEY)
}

export default { chatCompletion, isVivoAvailable, VIVO_BASE_URL, VIVO_MODEL }

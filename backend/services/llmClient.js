/**
 * Task 3 多 Provider 统一 LLM 客户端
 *
 * 为 3 个 Provider（deepseek / vivo / qewn）+ 2 种能力（文本 / 识别）提供统一入口
 *
 * 文本模型：
 *   - deepseek-chat（主力，DeepSeek 免费额度，指令遵循强，支持 JSON Mode）
 *   - vivo blue-lm-v-3b（备选，蓝心 AIGC）
 *
 * 识图模型：
 *   - qwen-vl-plus（阿里云百炼，人脸识别 / 视线检测 / 头部角度）
 *
 * 所有 API 调用走 OpenAI 兼容协议 POST /v1/chat/completions
 *
 * 注意：
 *   - DEEPSEEK_API_KEY / VIVO_API_KEY / QEWN_API_KEY 均从 .env 读取，不硬编码
 *   - vivoClient.js 保留不变；llmClient.vivoChat 内部复用同样逻辑
 */

import dotenv from 'dotenv'
dotenv.config()

// ===== 环境变量 =====

const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat'

const VIVO_BASE_URL = process.env.VIVO_BASE_URL || 'https://api-ai.vivo.com.cn'
const VIVO_API_KEY = process.env.VIVO_API_KEY || ''
const VIVO_MODEL = process.env.VIVO_MODEL || 'blue-lm-v-3b'

const QEWN_BASE_URL = process.env.QEWN_BASE_URL || 'https://llm-dm4c0m7ddxaxtw51.cn-beijing.maas.aliyuncs.com/compatible-mode/v1'
const QEWN_API_KEY = process.env.QEWN_API_KEY || ''
const QEWN_MODEL = process.env.QEWN_MODEL || 'qwen-vl-plus'

// ===== 内部工具 =====

async function openaiFetch(baseUrl, apiKey, body, { model, maxTokens = 1024 } = {}) {
  // 去掉末尾 /v1 防止重复拼接（阿里云 MAAS 等厂商的 baseUrl 已自带 /v1）
  const base = baseUrl.replace(/\/+$/, '').replace(/\/v1\/?$/, '')
  const url = `${base}/v1/chat/completions`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, ...body, stream: false, max_tokens: maxTokens }),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`LLM 接口 HTTP ${response.status}: ${errText.slice(0, 300)}`)
  }

  const data = await response.json()
  // 推理模型（deepseek-reasoner 等）可能把结果放在 reasoning_content 而非 content
  let content = data?.choices?.[0]?.message?.content
  if (!content || content.trim() === '') {
    content = data?.choices?.[0]?.message?.reasoning_content
  }
  if (!content) {
    throw new Error(`LLM 响应格式异常: ${JSON.stringify(data).slice(0, 200)}`)
  }
  return content.trim()
}

// ===== Provider：DeepSeek 文本聊天 =====

async function deepseekChat(systemPrompt, userMessage, options = {}) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY 未配置，请在 .env 文件中设置')
  }

  const body = {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  }

  // 如果调用方请求 JSON 结构化输出，启用 DeepSeek 的 response_format
  if (options.response_format) {
    body.response_format = options.response_format
  }

  return openaiFetch(DEEPSEEK_BASE_URL, DEEPSEEK_API_KEY, body, {
    model: DEEPSEEK_MODEL,
    maxTokens: options.max_tokens || 1024,
  })
}

// ===== Provider：蓝心 AI vivo（保留原方案）=====

async function vivoChat(systemPrompt, userMessage, options = {}) {
  if (!VIVO_API_KEY) {
    throw new Error('VIVO_API_KEY 未配置，请在 .env 文件中设置')
  }

  const body = {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  }

  return openaiFetch(VIVO_BASE_URL, VIVO_API_KEY, body, {
    model: VIVO_MODEL,
    maxTokens: options.max_tokens || 512,
  })
}

// ===== Provider：Qwen-VL 识图 =====

async function qewnVision(userMessage, imageUrlOrBase64, options = {}) {
  if (!QEWN_API_KEY) {
    throw new Error('QEWN_API_KEY 未配置，请在 .env 文件中设置')
  }

  // 多模态消息格式（OpenAI vision 协议）
  const body = {
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageUrlOrBase64 },
          },
          {
            type: 'text',
            text: userMessage,
          },
        ],
      },
    ],
  }

  return openaiFetch(QEWN_BASE_URL, QEWN_API_KEY, body, {
    model: QEWN_MODEL,
    maxTokens: options.max_tokens || 1024,
  })
}

// ===== 公开接口 =====

/**
 * 文本聊天（供 intervention / rest-chat / oral-review / report 4 个接口使用）
 *
 * @param {string} systemPrompt - 系统提示词
 * @param {string} userMessage - 用户消息
 * @param {object} [options]
 * @param {string} [options.provider] - 强制指定 provider（覆盖环境变量）
 * @param {object} [options.response_format] - DeepSeek JSON Mode 参数，如 { type: 'json_object' }
 * @param {number} [options.max_tokens] - 最大输出 token 数
 * @returns {Promise<string>} AI 回复文本
 */
export async function chatCompletion(systemPrompt, userMessage, options = {}) {
  const provider = options.provider || process.env.DEFAULT_MODEL_PROVIDER || 'mock'

  if (process.env.AI_MOCK_MODE === 'true') {
    throw new Error('AI_MOCK_MODE=true 时不应调用 chatCompletion，应先走 Mock 分支')
  }

  switch (provider) {
    case 'deepseek':
      return deepseekChat(systemPrompt, userMessage, options)
    case 'vivo':
      return vivoChat(systemPrompt, userMessage, options)
    case 'mock':
      throw new Error('provider=mock 时不应调用 chatCompletion')
    default:
      throw new Error(`未知的 LLM Provider: ${provider}`)
  }
}

/**
 * 识图（供 analyze-face 接口使用）
 *
 * @param {string} prompt - 提示词
 * @param {string} imageUrlOrBase64 - 图片 URL 或 base64 编码
 * @param {object} [options]
 * @returns {Promise<string>} VL 模型输出文本（包含 JSON）
 */
export async function visionCompletion(prompt, imageUrlOrBase64, options = {}) {
  if (process.env.AI_MOCK_MODE === 'true') {
    throw new Error('AI_MOCK_MODE=true 时不应调用 visionCompletion')
  }

  // 当前仅 Qwen-VL 支持识图；后续可在 vivo 接入 VL 模型时增加分支
  return qewnVision(prompt, imageUrlOrBase64, options)
}

/**
 * 检测指定类型的 LLM 是否可用（Key 是否配置）
 *
 * @param {'text' | 'vision'} kind
 * @returns {boolean}
 */
export function isAvailable(kind = 'text') {
  if (kind === 'text') {
    return Boolean(DEEPSEEK_API_KEY) || Boolean(VIVO_API_KEY)
  }
  if (kind === 'vision') {
    return Boolean(QEWN_API_KEY)
  }
  return false
}

/**
 * 返回当前配置快照（供 /api/health 接口展示）
 *
 * @returns {object}
 */
export function getProviderStatus() {
  return {
    defaultProvider: process.env.DEFAULT_MODEL_PROVIDER || 'mock',
    aiMockMode: process.env.AI_MOCK_MODE === 'true' || process.env.AI_MOCK_MODE === undefined,
    deepseek: {
      available: Boolean(DEEPSEEK_API_KEY),
      model: DEEPSEEK_MODEL,
      baseUrl: DEEPSEEK_BASE_URL,
    },
    vivo: {
      available: Boolean(VIVO_API_KEY),
      model: VIVO_MODEL,
      baseUrl: VIVO_BASE_URL,
    },
    qewn: {
      available: Boolean(QEWN_API_KEY),
      model: QEWN_MODEL,
      baseUrl: QEWN_BASE_URL,
    },
  }
}

export default {
  chatCompletion,
  visionCompletion,
  isAvailable,
  getProviderStatus,
}

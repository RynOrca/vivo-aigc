/**
 * Task 3 蓝心AI学习伴侣 AI 后端服务
 *
 * 启动方式：node backend/main.js（需先 npm install express cors dotenv）
 * 默认端口：8000
 *
 * 接口文档：docs/API.md §5
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import studyRoutes from './routes/study.js'
import aiRoutes from './routes/ai.js'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 8000

// ===== 中间件 =====

app.use(cors())                                   // 允许前端跨域
app.use(express.json())                           // 解析 JSON body

// 请求日志
app.use((req, _res, next) => {
  const t = new Date().toISOString().slice(11, 19)
  console.log(`[${t}] ${req.method} ${req.url}`)
  next()
})

// ===== 健康检查 =====

app.get('/api/health', (_req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      service: 'smart-study-companion-backend',
      version: '0.1.0',
      aiMockMode: process.env.AI_MOCK_MODE !== 'false',
      timestamp: Math.floor(Date.now() / 1000),
    },
  })
})

// ===== 路由注册 =====

app.use('/api/study', studyRoutes)
app.use('/api/ai', aiRoutes)

// ===== 兜底 404 =====

app.use((_req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在', data: null })
})

// ===== 全局错误处理 =====

app.use((err, _req, res, _next) => {
  console.error('[Error]', err.message)
  res.status(500).json({ code: 500, message: err.message || '服务器内部错误', data: null })
})

// ===== 启动 =====

app.listen(PORT, () => {
  console.log('')
  console.log('═══════════════════════════════════════════')
  console.log('  蓝心AI学习伴侣 — AI 后端服务')
  console.log(`  监听地址：http://localhost:${PORT}`)
  console.log(`  AI 模式：${process.env.AI_MOCK_MODE === 'false' ? '蓝心 AI' : 'Mock (本地模板)'}`)
  console.log('═══════════════════════════════════════════')
  console.log('')
  console.log('  可用接口：')
  console.log('    GET  /api/health           健康检查')
  console.log('    POST /api/study/start      开始学习')
  console.log('    GET  /api/study/state      获取状态')
  console.log('    POST /api/study/end        结束学习')
  console.log('    GET  /api/study/report/:id 获取日报')
  console.log('    POST /api/ai/intervention  分级干预')
  console.log('    POST /api/ai/rest-chat     休息伴聊')
  console.log('    POST /api/ai/oral-review   复盘问题')
  console.log('    POST /api/ai/report        学习日报')
  console.log('')
})

export default app

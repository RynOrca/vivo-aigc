# 环境搭建指南

> 本文件列清复赛 Demo 运行所需的所有环境和步骤，评委可直接按此文搭建。

## 前置要求

| 工具 | 版本 | 下载方式 |
|---|---|---|
| Node.js | ≥ 18.x（推荐 LTS 20.x / 22.x） | https://nodejs.org |
| npm | ≥ 9.x | 随 Node.js 自带 |
| 浏览器 | Chrome / Edge / Safari 最新版 | 现代浏览器均可 |

## 一键安装

```bash
# 1. 安装根目录依赖（如有）
npm install

# 2. 安装前端依赖
cd app
npm install

# 3. 安装后端依赖
cd ../backend
npm install
```

## 启动顺序

### 方式 A：完整模式（前端 + 真实后端）

需要 **两个终端** 同时运行：

```bash
# 终端 1：启动 AI 后端（端口 8000）
cd backend
npm start
# 看到 "监听地址：http://localhost:8000" 即成功
```

```bash
# 终端 2：启动前端（端口 5173）
cd app
npm run dev
# 浏览器访问输出的 Local URL（如 http://localhost:5173）
```

### 方式 B：Mock 模式（仅前端，无需后端）

```bash
cd app
npm run dev
# 浏览器访问即可，默认 MOCK_MODE=true，本地 Mock 数据演示
```

Demo 默认 **Mock 模式**，即使不启动后端也能完整演示全部功能。

## 切换真实后端 / Mock

进入 App → **设置页** → **数据源模式** Toggle：
- 开启（绿色）= 本地 Mock，无需任何后端服务
- 关闭（珊瑚色）= 真实后端，需先启动 `npm start`

## 多模型接入（Phase 9）

后端支持 3 个 Provider，通过 `.env` 的 `DEFAULT_MODEL_PROVIDER` 切换：

| Provider | 用途 | 模型 | Key 申请 |
|---|---|---|---|
| `deepseek`（默认） | 文本 4 接口 + 日报 JSON Mode | `deepseek-chat` | https://platform.deepseek.com （注册送 500 万 Token） |
| `vivo`（备选） | 蓝心 AI 原方案 | `blue-lm-v-3b` | https://aigc.vivo.com.cn |
| `qewn` | 识图（面部感知） | `qwen-vl-plus` | https://llm-dm4c0m7ddxaxtw51.cn-beijing.maas.aliyuncs.com |

### 方式 A：Mock 模式（默认，评委首选）

```bash
cd app && npm run dev
# 无需任何 Key，6 大页面 + 6 场景演示完整闭环
```

### 方式 B：接入真实 DeepSeek（推荐）

```bash
cd backend
cp .env.example .env
# 默认已配好 DEEPSEEK_API_KEY（公开测试 Key），只需把 AI_MOCK_MODE 改成 false
# AI_MOCK_MODE=false
# DEFAULT_MODEL_PROVIDER=deepseek
npm start
```

### 方式 C：接入蓝心 AI 备选方案

```bash
cd backend
cp .env.example .env
# 取消 VIVO_* 字段注释，并设置：
# AI_MOCK_MODE=false
# DEFAULT_MODEL_PROVIDER=vivo
npm start
```

蓝心 AI 接入文档：https://aigc.vivo.com.cn/#/document/index?id=1677

### 方式 D：全真实 AI 感知管线（face analyze-face）

```bash
# 在 .env 中确保 DEEPSEEK_API_KEY 和 QEWN_API_KEY 都已填入
# AI_MOCK_MODE=false
cd backend && npm start

# 用 curl 测试：先创建学习会话，再 POST 一张真实人脸照片 URL 给 /api/ai/analyze-face
```

这一步会走 Qwen-VL 识别人脸 → DeepSeek 校准专注分数 → 生成干预事件 完整管线。

## 目录结构速览

```text
.
├── app/                # 前端 React App（Vite）
│   └── npm run dev     # 前端启动命令
├── backend/            # 后端 AI 服务（Express）
│   └── npm start       # 后端启动命令（端口 8000）
├── sensing/            # 感知算法（独立运行 / 被后端调用）
│   └── node test_sensing.js  # 验证感知模块
└── docs/               # 项目文档
    ├── PRD.md          # 产品需求
    ├── API.md          # 接口定义
    ├── TASKS.md        # 任务分工
    └── DEMO_SCRIPT.md  # 演示脚本
```

## 常见问题

| 问题 | 解决方案 |
|---|---|
| 端口被占用 | 修改 `backend/.env` 的 `PORT` 值；前端端口由 Vite 自动换 |
| 蓝心 AI 报错 | vivo 接口会自动降级到 Mock，不影响演示 |
| 前端白屏 | 检查控制台 → 如报 "Failed to fetch" 则后端未启动，回到 Mock 模式即可 |
| sensing import 失败 | 前端 Mock 不依赖 sensing 目录（跨目录 import 由 mockAdapter.js 解决） |

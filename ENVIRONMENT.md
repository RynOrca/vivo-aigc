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

## 复赛后端（蓝心 AI）

后端默认走本地 Mock 文案（稳定性优先）。如需使用真实的蓝心 AI：

```bash
cd backend
cp .env.example .env
# 编辑 .env，设置 AI_MOCK_MODE=false
# 并确认 VIVO_API_KEY 已填入
```

蓝心 AI 接入文档：https://aigc.vivo.com.cn/#/document/index?id=1677

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

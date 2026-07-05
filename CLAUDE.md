# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

蓝心 AI 学习伴侣（Smart Study Companion）——面向备考/自习场景的 AI 学习陪伴 Demo。

MVP 主流程：`开始学习 → 实时检测 → 分心/疲劳干预 → AI 伴聊 → 学习日报`

当前阶段：前端 (`app/`) 已完成 Phase 1–7（可演示），后端 (`backend/`) 和感知模块 (`sensing/`) 仅为骨架。

## 开发命令

无根级 `package.json`，前端是独立项目，所有命令在 `app/` 目录下执行：

```bash
cd app
npm install          # 首次安装依赖
npm run dev          # 启动 Vite 开发服务器（默认 http://localhost:5173）
npm run build        # 生产构建
npm run preview      # 预览构建产物
```

**识图能力**（底层模型不支持原生识图，使用 vision.js）：

```bash
node vision.js "<图片路径>" "用中文描述这张图片"
node vision.js --url "<图片链接>" "用中文描述这张图片"
```

## 模块结构

| 目录 | 状态 | 职责 |
|---|---|---|
| `app/` | ✅ 可运行 | 前端 React App（Vite 7 + React 19） |
| `sensing/` | 📄 仅 README | 端侧感知 / 状态计算（Task 2 负责） |
| `backend/` | 📄 仅 README | 后端 + AI 服务（Task 3 负责） |
| `docs/` | ✅ 完整 | PRD、API 定义、任务分工、Demo 脚本 |

## 前端架构

### 页面路由

`App.jsx` 用 `useState` 管理页面切换（非 React Router），6 个页面：

```
dashboard → study → rest → report → dashboard
              ↕
           stats / settings
```

页面切换通过 `page-enter` CSS 动画（fade + slide up 12px）实现过渡。

### 状态管理

- **跨页面持久化**：`AppContext.jsx`（React Context + useReducer）——今日累计学习数据、历史统计、当前会话结果
- **页面私有状态**：组件内 `useState`——计时器、弹窗、输入框等

### 数据流

```
Mock 数据源（默认）                真实后端（集成后）
┌──────────────────┐             ┌──────────────────┐
│ studyMock.js     ──→ StudyState (每 3 秒轮询)
│ interventionMock.js → InterventionEvent（分心等级变化 + 15 秒冷却）
│ reportMock.js    ──→ RestChat + StudyReport
└──────────────────┘             └──────────────────┘
        ↓                                    ↓
   app/src/data/api.js  ←── MOCK_MODE 控制切换 ──→  HTTP API (localhost:8000)
```

**Mock ↔ 真实切换**：`app/src/data/api.js` 中 `MOCK_MODE = true`，改为 `false` 即走 HTTP，UI 代码无需改动。

### 核心数据契约（跨模块唯一接口）

字段定义详见 `docs/API.md`：

- **`StudyState`**：感知模块每 5 秒输出（前端当前每 3 秒轮询 Mock）
- **`InterventionEvent`**：AI 服务生成的分级干预（L1 Toast / L2 弹窗 / 全屏强提醒）
- **`StudyReport`**：学习结束后的 AI 日报

### 关键约定

- 枚举值使用大写英文（`NONE/L1/L2/L3`、`study/rest/report`），展示文案由前端映射为中文
- 时间戳使用 Unix 秒级；时长字段使用秒或分钟，字段名中明确单位
- `effectiveMinutes` 计算：`focusScore > 70` 的时间段计入有效学习
- Tailwind CSS 通过 CDN 加载（`index.html`），非 PostCSS 插件——不要添加 `@tailwind` 指令或 PostCSS 配置
- 视觉令牌（颜色/圆角/阴影）提取自 `前端参考.jsx`，保持与模板一致

### 组件清单

```
components/
  PhoneFrame.jsx        # 375×812 手机模拟框容器
  DashboardHeader.jsx   # 珊瑚粉头部（复用模板样式）
  ArcProgress.jsx       # SVG 圆弧进度条
  InterventionModal.jsx # L1 Toast / L2 弹窗 / L3 全屏强提醒

pages/
  Dashboard.jsx         # 首页：今日学习数据 + AI 鼓励语 + 开始专注
  StudyPage.jsx         # 专注学习：计时器 + 实时状态 + 自拍模式 + 干预弹窗
  RestChat.jsx          # 休息伴聊：AI 关怀语 + 复盘输入
  StudyReport.jsx       # 学习日报：四格数据 + AI 总结 + 建议
  StatsPage.jsx         # 学习统计：三卡片 + 折线趋势图
  SettingsPage.jsx      # 设置：目标时长/提醒强度/Mock 开关

data/
  api.js                # Mock/真实统一入口（MOCK_MODE 开关）
  AppContext.jsx        # 全局状态（useReducer + Context）
  mockData.js           # Dashboard 静态数据
  studyMock.js          # StudyState 生成器（200 秒循环场景序列）
  interventionMock.js   # InterventionEvent 模板生成器
  reportMock.js         # RestChat + StudyReport 生成器
```

## 集成顺序（新增后端/感知时）

1. 前端用静态 Mock JSON 跑通页面 ✅ 已完成
2. 前端接 `sensing` 模块的 Mock `StudyState`
3. 前端接 `backend` 模块的 Mock `InterventionEvent`
4. 前端接 `backend` 模块的 Mock `StudyReport`
5. `docs/DEMO_SCRIPT.md` 完整演示一次

## 隐私约束

Demo 阶段只传递抽象状态数据。不传递原始人脸图像。`sensing` 模块输出 `StudyState` 后原始帧即用即毁。

## 参考文档

- `docs/PRD.md` — 产品需求、用户主流程、页面清单、验收标准
- `docs/API.md` — 所有接口、数据结构、枚举、Mock 场景、计算规则
- `docs/TASKS.md` — 四人分工、每日检查清单、集成验收顺序
- `docs/DEMO_SCRIPT.md` — Demo 演示流程和讲解话术
- `AGENTS.md` — 项目总览（模块结构、启动方式、数据契约、集成顺序）
- `CHANGELOG.md` — 开发进度和版本记录

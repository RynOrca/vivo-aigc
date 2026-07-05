# AGENTS.md — 蓝心AI学习伴侣 / Smart Study Companion

## 项目概述

AI 学习陪伴 Demo。MVP 主流程：开始学习 → 实时检测 → 分心/疲劳干预 → AI 伴聊 → 学习日报。

当前阶段：前端已完成 Phase 1–7（可演示），后端 (`backend/`) 和感知模块 (`sensing/`) 仅为骨架。

## 模块结构

| 目录 | 状态 | 职责 |
|---|---|---|
| `app/` | ✅ 可运行 | 前端 React App（Vite 7 + React 19） |
| `sensing/` | 📄 仅 README | 端侧感知 / 状态计算（Task 2 负责） |
| `backend/` | 📄 仅 README | 后端 + AI 服务（Task 3 负责） |
| `docs/` | ✅ 完整 | PRD、API 定义、任务分工、Demo 脚本 |

## 启动方式

```bash
cd app
npm install   # 首次
npm run dev   # Vite 开发服务器
```

无根级 `package.json`。前端是独立项目。Tailwind CSS 通过 CDN 加载（`index.html`），非 PostCSS 插件。

## 核心数据契约

三个模块通过三类数据结构集成（跨模块唯一契约）：

- **`StudyState`**：感知模块每 5 秒输出一次学习状态
- **`InterventionEvent`**：AI 服务生成的分级干预事件
- **`StudyReport`**：学习结束后的 AI 日报

字段定义见 `docs/API.md`。UI 展示规则（L1/L2/L3 对应 Toast/弹窗/强提醒）见 `docs/PRD.md` 第 7 节。

## Mock ↔ 真实切换

`app/src/data/api.js` 中 `MOCK_MODE = true` 控制数据源：
- `true`（默认）：所有函数返回本地 Mock 数据
- `false`：走 HTTP 请求到 `BASE_URL`（默认 `http://localhost:8000`）

切换真实后端只需改这一个常量，UI 代码无需任何改动。

## 前端状态管理

- **跨页面持久化**：`AppContext.jsx`（React Context + useReducer），位于 `completeSession` 写入今日累计数据
- **页面私有状态**：组件内 `useState`，不跨路由保留

## 关键约定

- 枚举值使用大写英文（`NONE/L1/L2/L3`/`study/rest/report`），展示文案由前端映射为中文
- 时间戳使用 Unix 秒级；时长字段使用秒或分钟，字段名中明确单位
- `effectiveMinutes` 计算：`focusScore > 70` 的时间段计入有效学习
- 有效学习专注分 = 会话期间每 5 秒采样的 `focusScore`

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
- `CLAUDE.md` — 识图能力配置
- `CHANGELOG.md` — 开发进度和版本记录

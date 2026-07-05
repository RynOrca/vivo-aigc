# Task 1 — 前端 App

蓝心AI学习伴侣 前端应用，基于 Vite 7 + React 19 + Tailwind CSS。

---

## 快速开始

```bash
cd app
npm install
npm run dev        # 开发模式 → http://localhost:5174
npm run build      # 生产构建 → dist/
npm run preview    # 预览生产构建
```

无需任何环境变量或 API Key 即可运行。默认使用 **Mock 模式**。

---

## 项目架构

```
app/
├── index.html                  # 入口 HTML，Tailwind CDN
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx                # React 挂载 + AppProvider 包裹
    ├── App.jsx                 # 路由分发 + 页面切换动画
    ├── index.css               # 全局样式 + @keyframes 动画
    │
    ├── components/             # 公共组件
    │   ├── PhoneFrame.jsx      # 375×812 手机模拟框
    │   ├── DashboardHeader.jsx # 首页头部（珊瑚粉）
    │   ├── ArcProgress.jsx     # SVG 圆弧进度条
    │   └── InterventionModal.jsx # 分级干预弹窗（L1/L2/L3）
    │
    ├── pages/                  # 页面组件
    │   ├── Dashboard.jsx       # 首页
    │   ├── StudyPage.jsx       # 专注学习页 + 自拍模式
    │   ├── RestChat.jsx        # 休息伴聊页
    │   ├── StudyReport.jsx     # 学习日报页
    │   ├── StatsPage.jsx       # 历史统计页
    │   └── SettingsPage.jsx    # 设置页
    │
    └── data/                   # 数据层
        ├── api.js              # ⭐ 统一服务层（Mock/真实切换）
        ├── AppContext.jsx       # 全局状态（跨页面共享统计）
        ├── mockData.js         # 静态信息（用户名等）
        ├── studyMock.js        # StudyState Mock 生成器（7 种场景）
        ├── interventionMock.js # InterventionEvent Mock 生成器
        └── reportMock.js       # RestChat + StudyReport Mock 生成器
```

---

## 数据流架构

```
┌─────────────────────────────────────────────────────────┐
│                      运行时数据流                         │
│                                                         │
│  Task 2 (感知)              Task 3 (AI)                 │
│       │                         │                       │
│       ▼                         ▼                       │
│  StudyState              InterventionEvent              │
│  (每 3 秒)               StudyReport                    │
│       │                         │                       │
│       └─────────┬───────────────┘                       │
│                 ▼                                       │
│          api.js 服务层                                   │
│      (MOCK_MODE=true ←→ false)                          │
│                 │                                       │
│     ┌───────────┼───────────┐                           │
│     ▼           ▼           ▼                           │
│  StudyPage   RestChat   StudyReport                     │
│                 │                                       │
│                 ▼                                       │
│          AppContext (全局状态)                            │
│         今日/累计学习统计                                  │
│                 │                                       │
│     ┌───────────┴───────────┐                           │
│     ▼                       ▼                           │
│  Dashboard               StatsPage                      │
│  (今日数据)              (历史趋势)                       │
└─────────────────────────────────────────────────────────┘
```

**关键点：** 前端只消费标准数据结构，数据从哪来（Mock 还是真实接口）由 `api.js` 控制，页面代码不感知。

---

## 集成指南（给汇总人员）

### 第一步：确认后端就绪

Task 2 和 Task 3 必须提供以下接口：

| 接口 | 方法 | 模块 | 返回 | 对应前端调用 |
|---|---|---|---|---|
| `/api/study/state?sessionId=` | GET | Task 2 | `StudyState` | `getStudyState()` |
| `/api/ai/intervention` | POST | Task 3 | `InterventionEvent` | `requestIntervention()` |
| `/api/ai/rest-chat` | POST | Task 3 | `{message, suggestedReplies}` | `requestRestChat()` |
| `/api/ai/report` | POST | Task 3 | `StudyReport` | `requestReport()` |

所有响应必须包裹在 `{code: 0, message: "ok", data: {...}}` 中。完整接口定义见 `docs/API.md`。

### 第二步：切换为真实模式

编辑 `app/src/data/api.js`：

```js
// 改这两行即可
export const MOCK_MODE = false          // ← 改为 false
const BASE_URL = 'http://localhost:8000' // ← 改为 Task 3 后端地址
```

前端无需任何其他改动。如果接口返回 `code !== 0`，页面会抛出错误（后续可加全局错误处理）。

### 第三步：验证

运行前端 + Task 2 + Task 3，确认：

1. ✅ 首页 `npm run dev` 正常启动
2. ✅ 点击「开始专注」→ 计时器启动
3. ✅ 专注页能接收真实 StudyState（非 Mock 数据）
4. ✅ 分心等级变化 → 触发真实 AI 干预弹窗（非 Mock 文案）
5. ✅ 结束学习 → 休息伴聊用真实 AI 文案
6. ✅ 学习日报用真实 AI 生成
7. ✅ 首页/统计页数据更新

### 当前 Mock 模式直接可用

即使 Task 2/3 未完成，前端也能独立演示完整闭环：

```
首页 → 开始专注 → 计时 + 状态模拟 → L1/L2/L3 弹窗
→ 结束学习 → AI 伴聊 + 复盘 → 学习日报 → 回首页（数据更新）
```

---

## 核心数据结构（前端入参）

以下三个结构体是前端和后端的**唯一契约**。前端不关心数据来源，只按此结构消费。

### StudyState（来自 Task 2）

```ts
interface StudyState {
  sessionId: string        // 会话 ID
  timestamp: number        // Unix 秒级时间戳
  elapsedSeconds: number   // 已学习秒数
  focusScore: number       // 专注分 0-100
  fatigueScore: number     // 疲劳指数 0-100
  distractionLevel: string // "NONE" | "L1" | "L2" | "L3"
  emotion: string          // "calm" | "focused" | "tired" | "anxious" | "distracted"
  currentScene: string     // "study" | "rest" | "report"
  isUserPresent: boolean   // 用户是否在座
  headDownSeconds: number  // 低头持续秒数
  eyeClosedRatio: number   // 闭眼占比 0-1
  gazeAwaySeconds: number  // 视线偏离秒数
  mouthOpenCount: number   // 打哈欠次数
  currentAppType: string   // "study" | "neutral" | "entertainment"
  distractionCount: number // 累计分心次数
}
```

### InterventionEvent（来自 Task 3）

```ts
interface InterventionEvent {
  eventId: string      // 事件 ID
  sessionId: string    // 会话 ID
  level: string        // "L1" | "L2" | "L3"
  type: string         // "TEXT" | "VOICE" | "POPUP" | "HAPTIC"
  title: string        // 提醒标题
  message: string      // AI 提醒文本（建议 ≤80 字）
  action: string       // 推荐动作
  triggerReason: string // 触发原因
  timestamp: number    // Unix 秒级时间戳
}
```

### StudyReport（来自 Task 3）

```ts
interface StudyReport {
  sessionId: string
  createdAt: number
  totalMinutes: number
  effectiveMinutes: number
  averageFocusScore: number
  maxFatigueScore: number
  distractionCount: number
  focusCurve: number[]
  fatigueCurve: number[]
  oralReview: string | null
  summary: string
  advantage: string
  problem: string
  suggestions: string[]
  encouragement: string
}
```

---

## 页面清单

| 页面 | 文件 | 核心功能 | 数据来源 |
|---|---|---|---|
| 首页 | `Dashboard.jsx` | 今日学习时长/有效时长、AI鼓励语、开始专注、统计/设置入口 | `AppContext` |
| 专注学习 | `StudyPage.jsx` | 计时器、专注分圆弧、疲劳/分心、暂停、自拍模式、L1/L2/L3弹窗 | `getStudyState()` + `requestIntervention()` |
| 休息伴聊 | `RestChat.jsx` | 休息倒计时、AI关怀语、快速回复、复盘输入 | `requestRestChat()` |
| 学习日报 | `StudyReport.jsx` | 四格数据、AI总结、优点/问题、建议、鼓励语 | `requestReport()` |
| 统计 | `StatsPage.jsx` | 学习次数/总时长/连续天数、折线趋势图 | `AppContext` |
| 设置 | `SettingsPage.jsx` | 学习目标滑块、提醒强度、Mock开关、版本 | 本地 state |

### 页面路由

```
Dashboard ──开始专注──▶ StudyPage
    │                      │ 结束学习
    ├── 统计 ──▶ StatsPage  ▼
    │           RestChat（休息+复盘）
    │                │ 完成复盘
    │                ▼
    │           StudyReport（日报）
    │                │ 回到首页
    ◀────────────────┘
    │
    └── 设置 ──▶ SettingsPage
```

---

## 状态管理

使用 `AppContext`（React Context + useReducer）管理跨页面共享数据：

| 字段 | 说明 | 消费页面 |
|---|---|---|
| `todayStudyMinutes` | 今日累计学习分钟 | Dashboard |
| `todayEffectiveMinutes` | 今日有效学习分钟 | Dashboard |
| `totalSessions` | 历史总学习次数 | StatsPage |
| `totalMinutes` | 历史总学习分钟 | StatsPage |
| `averageFocusScore` | 历史平均专注分 | StatsPage |
| `streakDays` | 连续学习天数 | StatsPage |
| `completeSession(data)` | 完成一次学习后调用 | App.jsx → Dashboard/StatsPage 自动更新 |

---

## 动画

所有动画定义在 `index.css`：

| 动画 | 类名 | 效果 |
|---|---|---|
| 页面切换 | `page-enter` | fade + slide up 12px |
| L1 Toast | `animate-slide-down` | 从顶部滑入 |
| L2/L3 弹窗 | `animate-scale-in` | 缩放淡入 |
| 圆弧进度 | Tailwind `transition-all duration-500` | 圆点平滑移动 |
| 数字跳动 | `useCountUp` hook | 600ms 计数动画 |

---

## 自拍模式

专注学习页支持一键切换自拍模式，向用户展示 AI 检测过程：

- 调用 `navigator.mediaDevices.getUserMedia({facingMode: 'user'})` 打开前置摄像头
- 摄像头画面作为全屏背景（镜像翻转）
- 头部收窄，仅保留计时器
- 疲劳/分心数据变为左右浮动毛玻璃小窗
- 干预弹窗叠加在摄像头画面上
- 退出自拍或结束学习时自动释放摄像头

---

## 技术栈

| 技术 | 版本 | 用途 |
|---|---|---|
| Vite | 7.x | 构建工具 |
| React | 19.x | UI 框架 |
| Tailwind CSS | CDN | 样式（零配置） |

# CHANGELOG

## [未标记] — 2026-07-05

### Phase 8: 三模块联调 + 真实后端集成
- **Git**: `dc05483` (backend) → `76afcb3` (sensing) → `Step3 commit` (前端集成)
- **Task 2 感知模块**（`sensing/`）：
  - `mockGenerator.js` — 200 秒场景循环，输出标准 StudyState
  - `focusDetector.js` — focusScore 计算（视线偏离 + 闭眼 + 低头 + App 类型）
  - `fatigueDetector.js` — fatigueScore 计算（时长增长 + 疲劳信号）
  - `distractionDetector.js` — distractionLevel 四级判断（NONE/L1/L2/L3）
  - `test_sensing.js` — 独立测试脚本，6 场景验证通过 ✅
- **Task 3 AI 后端**（`backend/`）：
  - Express 服务暴露 7 个标准接口（端口 8000）
  - `routes/study.js` — 学习会话 CRUD
  - `routes/ai.js` — 4 个 AI 接口（intervention / rest-chat / oral-review / report）
  - `services/mockAI.js` — Mock 文案模板，与前端一致
  - `services/vivoClient.js` — 蓝心 AI 客户端（AI_MOCK_MODE=false 启用，Key 从 .env 读取）
  - `services/promptBuilder.js` — Prompt 集中管理（5 个 builder）
  - `schemas/validate.js` — 请求体字段校验
  - `.env.example` — 环境变量模板（**Key 不硬编码**）
  - Mock/真实自动切换 + vivo 失败降级 ✅
  - 所有 7 个接口已验证通过 ✅
- **前端集成**（`app/src/`）：
  - `data/api.js` 重构：MOCK_MODE 改为运行时变量，支持 setMockMode() 切换
  - `data/mockAdapter.js` 新增：统一 Mock 导入入口（解决 Vite 跨目录 import 问题）
  - `pages/StudyPage.jsx` — 通过 api.js 获取数据，解耦直接 Mock import
  - `pages/RestChat.jsx` — 通过 requestRestChat 获取伴聊文案
  - `pages/StudyReport.jsx` — 通过 requestReport 生成日报
  - `pages/SettingsPage.jsx` — Mock Toggle 真正生效（实时切换数据源）
  - 真实后端 + Mock 双模式切换验证通过 ✅
- **工程化**：
  - `ENVIRONMENT.md` — 环境搭建指南（供评委参考）
  - `README.md` — 更新启动方式章节
  - `CHANGELOG.md` — 记录 Phase 8

## [未标记] — 2026-07-02

### Phase 1: 项目骨架 + 首页 Dashboard
- **Git**: 初始提交
- 搭建 Vite 7 + React 19 前端项目 (`app/`)
- Tailwind CSS CDN 集成
- 提取 `前端参考.jsx` 视觉令牌，创建公共组件：
  - `PhoneFrame` — 375×812 手机模拟框
  - `DashboardHeader` — 珊瑚粉头部（复用模板样式）
- 首页 Dashboard：
  - 学习时长 / 有效学习统计卡片
  - AI 鼓励语卡片
  - 「开始专注」按钮（金绿渐变底部区域）
- Mock 数据层 (`mockData.js`)
- 调整布局：中间模块上移，避免与底部区域重叠

### Phase 2: 专注学习页
- **Git**: `(commit 2)`
- 专注学习页 `StudyPage`：计时器 + 实时状态监控
- `ArcProgress` 圆弧进度条组件（从模板提取 SVG 弧形进度）
- `studyMock` 模拟 StudyState 数据生成器（120 秒循环场景）
- Dashboard ↔ StudyPage 页面导航
- 计时器每秒更新，状态每 3 秒刷新

### Phase 3: 分级干预弹窗 L1/L2/L3
- **Git**: `(commit 3)`
- `InterventionModal` 组件：
  - L1: 顶部 Toast 轻提示，3 秒自动消失
  - L2: 中央卡片弹窗，需点击确认
  - L3: 全屏强提醒，必须点击确认
- `interventionMock`：AI 干预文案模板生成器
- 分心等级变化自动触发弹窗 + 15 秒冷却机制

### Phase 4: 休息伴聊 + 学习日报
- **Git**: `(commit 4)`
- `RestChat` 休息伴聊页：AI 关怀语 + 快速回复按钮 + 复盘问题 + 文本输入
- `StudyReport` 学习日报页：四格数据（学习时长/有效学习/平均专注分/分心次数）
- AI 总结 + 🎯 优点分析 + 🔧 问题诊断 + 💡 下次建议 + 🌟 鼓励语
- `reportMock`：AI 伴聊文案模板 + 日报生成器
- 完整闭环：Dashboard → 专注 → 休息伴聊 → 日报 → 回首页
- StudyPage 专注分采样（每 5 秒），供日报生成专注曲线
- **Fix**: RestChat 文案每秒随机变化 → useRef 只在挂载时生成一次

### Phase 5: 学习统计 + 设置页
- **Git**: `(commit 5)`
- `StatsPage` 学习统计页：完全复用 ScreenTwo 模板
  - 三卡片（学习次数/总时长/连续天数）
  - 平均专注分 64px 大数字 + SVG 折线趋势图
  - 5 日 X 轴标签 + 数据波动标签
- `SettingsPage` 设置页：
  - 每日学习时长滑块（15-120min）
  - 提醒强度选择（温和/标准/强提醒）
  - Mock 模式开关 Toggle
  - 版本信息 + 隐私说明
- Dashboard 新增「学习统计」「设置」快捷入口

### Phase 6: 数据持久化 + 动画 + API 合规
- **Git**: `(commit 6)`
- `AppContext` 全局状态层（useReducer + Context）：跨页面共享学习统计数据
- Dashboard/StatsPage 数据联动：完成学习 → 回首页 → 数据实时更新
- 数字跳动动画（`useCountUp` hook）：Dashboard 和 StatsPage 数字平滑递增
- 页面切换动画：`pageEnter` (fade + slide up 12px)
- 干预弹窗动画统一到 CSS class（`slide-down` / `scale-in`）
- InterventionModal 移除 render 时 DOM 注入（改用 index.css）
- **API 合规验证**：StudyState / InterventionEvent / StudyReport 全部字段匹配 `docs/API.md` ✅

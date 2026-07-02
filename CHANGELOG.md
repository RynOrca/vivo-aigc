# CHANGELOG

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

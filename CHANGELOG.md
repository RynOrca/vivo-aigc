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

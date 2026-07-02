# 蓝心AI学习伴侣四人并行开发任务

## 1. 总体目标

四个人并行开发一个可演示 MVP。优先保证主流程闭环完整：

```text
开始学习 → 实时检测 → 分心 / 疲劳干预 → AI 伴聊 → 学习日报
```

优先级：

1. Mock 闭环跑通。
2. 前端页面完整且美观。
3. AI 文案自然、温和、有陪伴感。
4. 接入 vivo AIGC 官方接口。
5. 接入真实摄像头 / MediaPipe / 端侧模型增强。

## 2. 任务总览

| 任务 | 负责人 | 角色 | 核心职责 | 核心交付 |
|---|---|---|---|---|
| Task 0 | A | 产品经理 / 组长 / 集成负责人 | 需求拆解、接口定义、进度管理、集成验收、答辩材料 | `docs/PRD.md`、`docs/API.md`、`docs/TASKS.md`、`docs/DEMO_SCRIPT.md`、`README.md` |
| Task 1 | B | UI / 前端开发 | App 页面、交互流程、状态展示、弹窗、日报页面 | 可运行前端 Demo |
| Task 2 | C | 端侧感知 / 算法开发 | Mock 状态生成、专注分计算、疲劳指数计算、分心等级判断 | `sensing` 模块 |
| Task 3 | D | 后端 / AI 接口开发 | vivo AIGC 封装、AI 干预、伴聊、复盘、日报生成 | `backend` AI 服务 |

数据流：

```text
Task 2 感知模块
  → 输出 StudyState
Task 3 AI 服务模块
  → 输入 StudyState，输出 InterventionEvent / StudyReport
Task 1 前端 App
  → 展示 StudyState / InterventionEvent / StudyReport
Task 0 集成
  → 统一接口、验收、演示、答辩
```

## 3. Task 0：项目统筹与集成

### 3.1 负责人

A：产品经理 / 组长 / 集成负责人

### 3.2 职责

1. 将策划书拆成可开发 MVP。
2. 统一三类核心数据结构：`StudyState`、`InterventionEvent`、`StudyReport`。
3. 制定 API、任务分工、验收标准和 Demo 脚本。
4. 每日检查前端、感知、AI 三个模块是否符合接口。
5. 组织集成测试，确保演示流程无断点。

### 3.3 输入

- 项目策划书。
- 四人同步开发任务安排。
- 三个开发模块的实际进度和接口反馈。

### 3.4 输出

| 输出 | 文件 |
|---|---|
| 产品需求文档 | `docs/PRD.md` |
| 接口文档 | `docs/API.md` |
| 任务分工 | `docs/TASKS.md` |
| Demo 演示脚本 | `docs/DEMO_SCRIPT.md` |
| 项目说明 | `README.md` |

### 3.5 验收标准

| 验收项 | 标准 |
|---|---|
| PRD | 能明确说明项目做什么、不做什么 |
| API | 三个开发者能按文档独立开发 |
| TASKS | 每个任务有负责人、职责、输入、输出、验收标准 |
| Demo 脚本 | 能按固定流程演示完整闭环 |
| 集成检查 | 前端、感知、AI 都符合接口 |

## 4. Task 1：前端 App 与交互开发

### 4.1 负责人

B：UI / 前端开发

### 4.2 职责

1. 完成移动端 App Demo 页面。
2. 支持 Mock JSON，无后端时也能演示。
3. 根据 `StudyState` 展示实时学习状态。
4. 根据 `InterventionEvent` 展示 L1 / L2 / L3 干预。
5. 根据 `StudyReport` 展示学习日报。

### 4.3 输入

- `StudyState`
- `InterventionEvent`
- `StudyReport`
- API 文档中的 Mock 示例

### 4.4 输出

| 输出 | 说明 |
|---|---|
| 首页 Dashboard | 今日学习、AI 鼓励、开始按钮 |
| 专注学习页 | 计时、专注分、疲劳指数、分心次数 |
| 干预弹窗 | L1 Toast、L2 中弹窗、L3 强弹窗 |
| 休息伴聊页 | AI 伴聊、复盘输入 |
| 日报页 | 数据卡片、曲线、AI 总结和建议 |
| 设置页 | 目标、提醒强度、隐私说明、Mock 开关 |

### 4.5 验收标准

| 验收项 | 标准 |
|---|---|
| 首页 | 能点击开始专注 |
| 专注页 | 能显示实时 `StudyState` |
| 状态变化 | `focusScore`、`fatigueScore`、`distractionLevel` 改变时 UI 跟随变化 |
| 干预弹窗 | L1 / L2 / L3 展示方式不同 |
| 伴聊页 | 能展示 AI 伴聊文本和复盘问题 |
| 日报页 | 能展示 `StudyReport` 所有核心字段 |
| Mock 模式 | 后端不可用时仍可完整演示 |
| 视觉风格 | 极简、低饱和蓝白、温柔陪伴感 |

## 5. Task 2：端侧感知与状态计算模块

### 5.1 负责人

C：端侧感知 / 算法开发

### 5.2 职责

1. 实现 Mock 状态生成器。
2. 实现专注分 `focusScore` 计算。
3. 实现疲劳指数 `fatigueScore` 计算。
4. 实现分心等级 `distractionLevel` 判断。
5. 每 5 秒输出一次标准 `StudyState`。
6. 提供至少 5 种 Mock 场景。

### 5.3 输入

```json
{
  "gazeAwaySeconds": 25,
  "headDownSeconds": 10,
  "eyeClosedRatio": 0.18,
  "mouthOpenCount": 1,
  "isUserPresent": true,
  "currentAppType": "study"
}
```

### 5.4 输出

标准 `StudyState`，字段见 [API.md](./API.md)。

### 5.5 规则

| 规则 | 标准 |
|---|---|
| 有效学习 | `focusScore > 70` |
| L1 | 视线偏离超过 20 秒，或专注分低于 70 |
| L2 | 连续分心超过 60 秒，或专注分低于 50 |
| L3 | 离座、切娱乐 App、长时间无响应 |
| 疲劳提醒 | `fatigueScore >= 60` |

### 5.6 Mock 场景

| 场景 | 必须输出 |
|---|---|
| 正常专注 | `focusScore 80-95`，`fatigueScore 20-40` |
| 轻微分心 | `focusScore 60-70`，`distractionLevel L1` |
| 严重分心 | `focusScore 40-55`，`distractionLevel L2` |
| 疲劳偏高 | `fatigueScore 60-80` |
| 离座 | `isUserPresent false`，`distractionLevel L3` |
| 恢复专注 | `focusScore 80+`，`distractionLevel NONE` |

### 5.7 验收标准

| 验收项 | 标准 |
|---|---|
| Mock 生成器 | 能模拟至少 5 种学习状态 |
| 专注分 | 输出 0-100 |
| 疲劳指数 | 输出 0-100 |
| 分心等级 | 输出 `NONE/L1/L2/L3` |
| 定时输出 | 每 5 秒更新一次 |
| 接口兼容 | 输出字段完全符合 `StudyState` |
| 可解释性 | 能说明每个分数如何计算 |

## 6. Task 3：后端与 AI 服务模块

### 6.1 负责人

D：后端 / AI 接口开发

### 6.2 职责

1. 封装 vivo AIGC / 蓝心大模型接口。
2. 对前端暴露项目自己的标准 API。
3. 生成 L1 / L2 / L3 干预文案。
4. 生成休息期伴聊文本。
5. 生成口头复盘问题。
6. 生成结构化学习日报。
7. 支持 `AI_MOCK_MODE=true` 降级。

### 6.3 输入

- `StudyState`
- 学习目标、时长、复盘文本
- API 文档中的 AI 请求结构

### 6.4 输出

- `InterventionEvent`
- 休息伴聊消息
- 口头复盘问题
- `StudyReport`

### 6.5 接口

| 接口 | 说明 |
|---|---|
| `POST /api/ai/intervention` | 生成分级干预 |
| `POST /api/ai/rest-chat` | 生成休息期伴聊 |
| `POST /api/ai/oral-review` | 生成复盘问题 |
| `POST /api/ai/report` | 生成学习日报 |

### 6.6 验收标准

| 验收项 | 标准 |
|---|---|
| vivo 接口封装 | 前端不直接接触官方 API |
| 干预接口 | 能根据 L1 / L2 / L3 生成不同文案 |
| 伴聊接口 | 文案自然、温和、不说教 |
| 复盘接口 | 能生成一句低压力复盘问题 |
| 日报接口 | 返回结构化 JSON |
| Mock 模式 | vivo 接口不可用时仍能演示 |
| 安全性 | Key 不写死在代码里，不提交真实 `.env` |

## 7. 每日接口检查清单

| 检查项 | 负责人 | 标准 |
|---|---|---|
| 前端是否按接口读取数据 | A + B | 必须符合 `StudyState`、`InterventionEvent`、`StudyReport` |
| 感知模块是否输出标准 JSON | A + C | 字段不能缺，枚举不能错 |
| AI 模块是否返回标准 JSON | A + D | 不能直接暴露 vivo 原始响应 |
| Mock 数据是否能驱动完整流程 | A + 全员 | 必须能独立演示 |
| Demo 是否存在断点 | A + 全员 | 主流程不允许中断 |
| 文档是否同步更新 | A | 接口变更当天更新 |

## 8. 集成验收顺序

1. 前端用静态 Mock JSON 跑通页面。
2. 前端接 Task 2 的 Mock `StudyState`。
3. 前端接 Task 3 的 Mock `InterventionEvent`。
4. 前端接 Task 3 的 Mock `StudyReport`。
5. Task 0 按 Demo 脚本完整演示一次。
6. 如果真实 vivo AIGC 可用，再替换 AI Mock；替换失败不影响 Demo。
7. 如果真实摄像头可用，再替换感知 Mock；替换失败不影响 Demo。


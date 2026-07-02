# 《蓝心AI学习伴侣》四任务整合 Goal 版本

> 项目名称：蓝心AI学习伴侣（Smart Study Companion）  
> 适用场景：四个人 / 四个 Codex Agent 并行开发  
> 核心目标：完成一个可演示的 MVP Demo，跑通 **开始学习 → 实时状态监测 → 分级干预 → AI 伴聊 → 学习日报** 的完整闭环。  
> 开发原则：**先 Mock 跑通闭环，再逐步接入 vivo AIGC、真实感知和系统生态能力。**

---

## 1. 总体 Goal

可以在总控 Codex 或集成 Agent 中使用以下 `/goal`：

```text
/goal 完成“蓝心AI学习伴侣 Smart Study Companion”的 MVP Demo 开发与集成。

最终目标：
实现一个可演示的 AI 学习陪伴应用，完整跑通：
开始学习 → 实时状态监测 → 分心/疲劳判断 → L1/L2/L3 分级干预 → AI 休息伴聊 → 口头/文字复盘 → 学习日报生成。

成功标准：
1. 项目具有清晰目录结构：app、backend、sensing、docs、demo；
2. docs 中包含 PRD.md、API.md、TASKS.md、DEMO_SCRIPT.md；
3. 前端至少包含：首页、专注学习页、L1/L2/L3 分级干预弹窗、休息伴聊页、学习日报页、设置页；
4. sensing 模块能生成标准 StudyState，并支持正常专注、轻微分心、严重分心、疲劳偏高、离座、恢复专注等 Mock 场景；
5. backend 提供 AI 服务接口：
   - POST /api/ai/intervention
   - POST /api/ai/rest-chat
   - POST /api/ai/oral-review
   - POST /api/ai/report
6. AI 服务支持 AI_MOCK_MODE=true，在 vivo AIGC 官方接口不可用时返回本地模板；
7. 前端能读取 StudyState，并根据 focusScore、fatigueScore、distractionLevel 改变页面状态；
8. 前端能展示 AI 干预、AI 伴聊和学习日报；
9. README.md 中说明项目结构、启动方式、Mock 优先原则和后续增强方向；
10. 运行项目或最小测试脚本后，主流程不报错。

开发约束：
1. 不要删除已有策划书、文档和素材，除非明确确认；
2. 不要把 API Key、Secret、Token 写死在代码里，必须放入 .env；
3. vivo 官方接口没调通时，不要阻塞主流程，必须保留 Mock 降级；
4. 优先保证 Demo 闭环跑通，再做真实摄像头、MediaPipe、vivo 接口接入；
5. 每完成一个阶段都要运行测试、构建或最小验证；
6. 如果遇到缺少账号、API Key、系统权限、产品决策不明确等问题，暂停并向我报告。
```

启动执行指令：

```text
请根据当前 goal 开始执行。先扫描项目目录，判断已有代码和文档状态，然后按以下顺序推进：
1. 建立 docs 文档和统一接口；
2. 建立 Mock 数据和 Mock AI 返回；
3. 完成前端主页面；
4. 完成 sensing 状态输出；
5. 完成 backend AI 服务；
6. 进行前端、感知、AI 服务集成；
7. 运行最小验证，修复错误，直到主流程可演示。
能自己修复的问题请自行修复；只有遇到账号、API Key、外部权限或产品决策问题时才询问我。
```

---

## 2. 四个任务之间的关系

四个任务不是完全线性，而是 **Task 0 先定义规则，Task 1/2/3 并行开发，最后 Task 0 组织集成**。

```text
Task 0：项目统筹与集成
    ↓ 先定义 PRD、API、TASKS、DEMO_SCRIPT
    ↓
Task 1：前端 App 与交互开发       Task 2：感知与状态计算       Task 3：AI 后端与 vivo AIGC 封装
    ↓                                  ↓                          ↓
    使用 Mock 数据开发页面              输出 StudyState             输出 AI 干预/伴聊/日报
    ↓                                  ↓                          ↓
    └─────────────── 三模块联调与集成 ───────────────┘
                              ↓
                      完整 Demo 演示与答辩材料
```

运行时真实数据流：

```text
用户点击开始学习
↓
Task 2 输出 StudyState
↓
Task 1 展示学习状态
↓
Task 1 根据状态调用 Task 3
↓
Task 3 返回 InterventionEvent / StudyReport
↓
Task 1 展示干预、伴聊、日报
↓
Task 0 验收主流程并准备演示
```

---

## 3. 统一项目目录结构

建议项目结构如下：

```text
smart-study-companion/
├── app/                    # Task 1：前端 App
│   ├── pages/
│   ├── components/
│   ├── api/
│   └── mock/
├── backend/                # Task 3：后端与 AI 服务
│   ├── main.py
│   ├── routes/
│   ├── services/
│   │   ├── vivo_client.py
│   │   ├── prompt_builder.py
│   │   └── mock_ai.py
│   ├── schemas/
│   ├── .env.example
│   └── README.md
├── sensing/                # Task 2：感知与状态计算
│   ├── mock_generator.py
│   ├── focus_detector.py
│   ├── fatigue_detector.py
│   └── README.md
├── docs/                   # Task 0：项目文档
│   ├── PRD.md
│   ├── API.md
│   ├── TASKS.md
│   └── DEMO_SCRIPT.md
├── demo/                   # 演示材料
│   ├── screenshots/
│   ├── video/
│   └── script.md
└── README.md
```

---

## 4. 统一数据结构

所有任务必须遵守以下三个核心数据结构。

---

### 4.1 StudyState：学习状态数据

由 Task 2 输出，Task 1 和 Task 3 使用。

```json
{
  "sessionId": "study_001",
  "timestamp": 1710000000,
  "elapsedSeconds": 1200,
  "focusScore": 82,
  "fatigueScore": 35,
  "distractionLevel": "NONE",
  "emotion": "calm",
  "currentScene": "study",
  "isUserPresent": true,
  "headDownSeconds": 5,
  "eyeClosedRatio": 0.12,
  "distractionCount": 1
}
```

字段要求：

| 字段 | 类型 | 说明 |
|---|---|---|
| sessionId | string | 当前学习会话 ID |
| timestamp | number | 当前时间戳 |
| elapsedSeconds | number | 已学习秒数 |
| focusScore | number | 专注分，0-100 |
| fatigueScore | number | 疲劳指数，0-100 |
| distractionLevel | string | NONE / L1 / L2 / L3 |
| emotion | string | calm / tired / anxious / distracted |
| currentScene | string | study / rest / report |
| isUserPresent | boolean | 用户是否在座 |
| headDownSeconds | number | 低头持续时间 |
| eyeClosedRatio | number | 闭眼占比 |
| distractionCount | number | 分心次数 |

---

### 4.2 InterventionEvent：干预事件数据

由 Task 3 输出，Task 1 展示。

```json
{
  "sessionId": "study_001",
  "level": "L2",
  "type": "VOICE",
  "title": "注意力提醒",
  "message": "你已经分心一小会儿了，先把注意力拉回当前这一步吧。",
  "action": "先完成当前小任务，再休息一下。",
  "triggerReason": "连续分心超过60秒",
  "timestamp": 1710000000
}
```

字段要求：

| 字段 | 类型 | 说明 |
|---|---|---|
| sessionId | string | 当前学习会话 ID |
| level | string | L1 / L2 / L3 |
| type | string | TEXT / VOICE / POPUP |
| title | string | 干预标题 |
| message | string | AI 生成提醒 |
| action | string | 建议动作 |
| triggerReason | string | 触发原因 |
| timestamp | number | 触发时间 |

---

### 4.3 StudyReport：学习日报数据

由 Task 3 输出，Task 1 展示。

```json
{
  "sessionId": "study_001",
  "totalMinutes": 45,
  "effectiveMinutes": 38,
  "averageFocusScore": 78,
  "maxFatigueScore": 66,
  "distractionCount": 4,
  "focusCurve": [80, 82, 78, 65, 72, 85],
  "summary": "今天整体学习状态较好，有效学习时间占比较高。",
  "advantage": "前半段学习状态稳定，能较快进入专注状态。",
  "problem": "后半段疲劳指数上升，说明需要更早安排休息。",
  "suggestions": [
    "下次可以在第30分钟主动休息5分钟",
    "开始学习前先写下一个具体小目标"
  ],
  "encouragement": "今天已经完成了一段高质量学习，继续保持。"
}
```

---

## 5. 统一接口路径

| 接口 | 方法 | 主要负责人 | 调用方 | 作用 |
|---|---|---|---|---|
| `/api/study/start` | POST | Task 3 / 集成 | Task 1 | 创建学习会话 |
| `/api/study/state` | GET | Task 2 / Task 3 | Task 1 | 获取当前学习状态 |
| `/api/study/end` | POST | Task 3 / 集成 | Task 1 | 结束学习会话 |
| `/api/ai/intervention` | POST | Task 3 | Task 1 | 生成 L1/L2/L3 干预提醒 |
| `/api/ai/rest-chat` | POST | Task 3 | Task 1 | 生成休息伴聊文本 |
| `/api/ai/oral-review` | POST | Task 3 | Task 1 | 生成口头复盘问题 |
| `/api/ai/report` | POST | Task 3 | Task 1 | 生成学习日报 |
| `/api/study/report/{sessionId}` | GET | Task 3 | Task 1 | 获取已有日报 |

---

## 6. Task 0 Goal：项目统筹与集成

### 6.1 Task 0 定位

Task 0 是项目的总控任务。它不负责写大量业务代码，而是负责：

```text
1. 定 MVP 范围；
2. 定统一接口；
3. 定任务边界；
4. 定验收标准；
5. 组织联调；
6. 整理演示材料；
7. 保证最终 Demo 能稳定跑通。
```

---

### 6.2 Task 0 可直接使用的 `/goal`

```text
/goal 完成“蓝心AI学习伴侣”项目的 Task 0：项目统筹、接口定义、集成验收与演示准备。

最终目标：
让前端、感知、AI 后端三个方向可以并行开发，并最终集成出一个可演示的 MVP Demo。

成功标准：
1. 创建或更新 docs/PRD.md，明确项目定位、目标用户、痛点、MVP 功能、非 MVP 功能、用户主流程；
2. 创建或更新 docs/API.md，定义 StudyState、InterventionEvent、StudyReport 三个核心数据结构，以及所有接口路径、请求参数、响应参数；
3. 创建或更新 docs/TASKS.md，明确 Task 0、Task 1、Task 2、Task 3 的职责、输入、输出、依赖关系和验收标准；
4. 创建或更新 docs/DEMO_SCRIPT.md，写出 Demo 演示流程：开始学习 → 实时状态监测 → L1/L2/L3 干预 → AI 伴聊 → 学习日报；
5. 创建或更新 README.md，说明项目目录结构、启动方式、Mock 优先原则和后续增强方向；
6. 检查 Task 1、Task 2、Task 3 是否遵守统一接口；
7. 组织至少一次完整集成验证；
8. 输出最终 Demo 验收清单。

开发约束：
1. 不实现复杂功能代码，只建立文档、规则和项目骨架；
2. 不允许其他任务自行修改核心数据结构，除非同步更新 docs/API.md；
3. 所有文档使用中文；
4. 优先保证 Mock 闭环可演示；
5. 如果遇到接口冲突，优先维护统一数据结构和 Demo 主流程。
```

---

### 6.3 Task 0 启动指令

```text
请根据当前 Task 0 goal 开始执行。先检查当前项目目录，如果没有 docs 目录就创建。然后依次生成或更新 PRD.md、API.md、TASKS.md、DEMO_SCRIPT.md 和 README.md。重点是让前端、感知、AI 后端三个人可以并行开工，并且最终能集成成一个可演示 Demo。
```

---

### 6.4 Task 0 交付物

```text
docs/PRD.md
docs/API.md
docs/TASKS.md
docs/DEMO_SCRIPT.md
README.md
demo/script.md
最终验收清单
```

---

### 6.5 Task 0 验收标准

| 验收项 | 标准 |
|---|---|
| MVP 范围 | 明确第一版做什么、不做什么 |
| API 文档 | 三个核心数据结构完整 |
| 任务分工 | 四个任务职责清晰 |
| 集成路径 | 明确 Task 1/2/3 如何联调 |
| Demo 脚本 | 可以直接用于录屏或答辩 |
| 验收清单 | 能检查完整主流程 |

---

## 7. Task 1 Goal：前端 App 与交互开发

### 7.1 Task 1 定位

Task 1 负责用户能看到和操作的部分，包括页面、交互、状态展示和 Demo 视觉效果。

Task 1 不应该等待真实后端和真实摄像头，应先基于 Mock JSON 开发页面。

---

### 7.2 Task 1 可直接使用的 `/goal`

```text
/goal 完成“蓝心AI学习伴侣”的 Task 1：前端 App 与交互开发。

最终目标：
开发一个可演示的移动端前端 Demo，能够展示首页、专注学习、分级干预、休息伴聊和学习日报的完整用户体验。

成功标准：
1. 前端项目可以正常启动；
2. 至少包含以下页面：
   - 首页 Dashboard
   - 专注学习页
   - L1/L2/L3 分级干预弹窗
   - 休息期 AI 伴聊页
   - 学习日报页
   - 设置页
3. 前端能读取 Mock StudyState；
4. 前端能根据 focusScore、fatigueScore、distractionLevel 动态改变 UI；
5. 当 distractionLevel = L1 时，展示轻提示；
6. 当 distractionLevel = L2 时，展示中等干预弹窗；
7. 当 distractionLevel = L3 时，展示强提醒弹窗；
8. 前端能展示 InterventionEvent 中的 AI 提醒文本；
9. 前端能展示 StudyReport 中的学习日报内容；
10. 即使没有真实后端，也能通过本地 Mock 数据完整演示主流程。

开发约束：
1. 不要等待真实 sensing 和真实 backend，先用 Mock JSON 开发；
2. 不要自行改变 StudyState、InterventionEvent、StudyReport 字段；
3. UI 风格保持极简、低饱和蓝白、圆角卡片、柔和陪伴感；
4. 不要在前端写死 API Key；
5. 优先保证主流程可演示，再做复杂动效。
```

---

### 7.3 Task 1 启动指令

```text
请根据当前 Task 1 goal 开始执行。先检查 app 目录和现有前端技术栈，如果没有前端项目，则创建一个最小可运行前端。先使用 Mock StudyState、Mock InterventionEvent 和 Mock StudyReport 完成页面与交互。完成后运行启动或构建命令，确认前端不报错。
```

---

### 7.4 Task 1 页面要求

| 页面 | 必须展示内容 |
|---|---|
| 首页 Dashboard | 今日学习时长、有效学习时长、AI 鼓励语、开始专注按钮 |
| 专注学习页 | 计时器、专注分、疲劳指数、分心次数、结束学习按钮 |
| 分级干预弹窗 | L1 轻提示、L2 中弹窗、L3 强弹窗 |
| 休息伴聊页 | 休息倒计时、AI 伴聊文本、复盘输入 |
| 学习日报页 | 学习时长、有效时长、平均专注分、分心次数、AI 总结、建议 |
| 设置页 | 学习目标、提醒强度、隐私说明、Mock 模式开关 |

---

### 7.5 Task 1 验收标准

| 验收项 | 标准 |
|---|---|
| 页面完整 | 6 个页面或核心区域存在 |
| Mock 可演示 | 不依赖真实接口也能跑 |
| 状态联动 | StudyState 改变时 UI 改变 |
| 分级干预 | L1/L2/L3 展示不同样式 |
| 日报展示 | StudyReport 能完整显示 |
| 构建验证 | 前端启动或构建不报错 |

---

## 8. Task 2 Goal：端侧感知与状态计算

### 8.1 Task 2 定位

Task 2 负责输出学习状态数据，即 StudyState。第一版优先做 Mock 状态生成器和规则计算，不要一开始卡在真实摄像头和 MediaPipe。

---

### 8.2 Task 2 可直接使用的 `/goal`

```text
/goal 完成“蓝心AI学习伴侣”的 Task 2：端侧感知与状态计算模块。

最终目标：
实现一个能够持续输出标准 StudyState 的学习状态模块，为前端展示和 AI 干预提供数据基础。

成功标准：
1. sensing 模块可以独立运行；
2. 每 5 秒输出一次标准 StudyState；
3. 支持至少 6 种 Mock 场景：
   - 正常专注
   - 轻微分心
   - 严重分心
   - 疲劳偏高
   - 离座
   - 恢复专注
4. 能计算 focusScore，范围 0-100；
5. 能计算 fatigueScore，范围 0-100；
6. 能判断 distractionLevel，取值为 NONE / L1 / L2 / L3；
7. 输出字段必须与 docs/API.md 中的 StudyState 完全一致；
8. 提供最小测试脚本或运行示例，证明模块能输出数据。

规则要求：
1. focusScore > 70 视为有效学习；
2. 视线偏离超过 20 秒触发 L1；
3. 连续分心超过 60 秒触发 L2；
4. 离座或切换娱乐 App 触发 L3；
5. fatigueScore > 60 触发疲劳提醒。

开发约束：
1. 第一版不要强制接入真实摄像头；
2. 不要因为 CameraX、MediaPipe 或权限问题阻塞 Mock 输出；
3. 不要修改 StudyState 字段结构；
4. 先保证 Mock 状态稳定，再尝试真实感知增强；
5. 所有计算规则需要写清楚，方便答辩解释。
```

---

### 8.3 Task 2 启动指令

```text
请根据当前 Task 2 goal 开始执行。先检查 sensing 目录，如果没有则创建。实现 Mock 状态生成器、focusScore 计算、fatigueScore 计算和 distractionLevel 判断。提供一个可运行脚本，能够循环输出正常专注、轻微分心、严重分心、疲劳偏高、离座、恢复专注等 StudyState。完成后运行测试或脚本验证输出格式。
```

---

### 8.4 Task 2 推荐文件

```text
sensing/
├── mock_generator.py
├── focus_detector.py
├── fatigue_detector.py
├── distraction_detector.py
├── test_sensing.py
└── README.md
```

---

### 8.5 Task 2 验收标准

| 验收项 | 标准 |
|---|---|
| Mock 输出 | 至少 6 种场景 |
| 定时更新 | 每 5 秒输出一次 |
| 专注分 | 0-100 |
| 疲劳指数 | 0-100 |
| 分心等级 | NONE/L1/L2/L3 |
| 字段一致 | 完全符合 StudyState |
| 可运行 | 有脚本或测试证明能跑 |

---

## 9. Task 3 Goal：AI 后端与 vivo AIGC 封装

### 9.1 Task 3 定位

Task 3 负责把 vivo AIGC / 蓝心大模型能力封装为项目自己的 AI 业务接口。第一版必须支持 Mock 降级，不能因为 vivo 官方接口未调通而阻塞 Demo。

---

### 9.2 Task 3 可直接使用的 `/goal`

```text
/goal 完成“蓝心AI学习伴侣”的 Task 3：AI 后端与 vivo AIGC 接口封装。

最终目标：
实现一个后端 AI 服务，为前端提供分级干预、休息伴聊、口头复盘和学习日报生成能力，并预留 vivo AIGC 官方接口接入。

成功标准：
1. backend 项目可以正常启动；
2. 实现以下接口：
   - POST /api/ai/intervention
   - POST /api/ai/rest-chat
   - POST /api/ai/oral-review
   - POST /api/ai/report
3. /api/ai/intervention 能根据 focusScore、fatigueScore、distractionLevel 生成 L1/L2/L3 不同提醒；
4. /api/ai/rest-chat 能生成休息期拟人化伴聊文本；
5. /api/ai/oral-review 能生成口头复盘引导问题；
6. /api/ai/report 能生成结构化 StudyReport；
7. 支持 AI_MOCK_MODE=true，vivo 接口不可用时返回本地模板；
8. 预留 vivo_client.py，用于后续接入 vivo 官方 AIGC 接口；
9. Prompt 构造逻辑放在 prompt_builder.py；
10. Mock 降级逻辑放在 mock_ai.py；
11. API Key、Secret、Token 不写死在代码里，必须放在 .env；
12. 提供 .env.example 和接口测试样例。

开发约束：
1. 不要让前端直接调用 vivo 官方接口；
2. 不要把 vivo 原始响应直接暴露给前端；
3. 不要因为 vivo 鉴权或网络问题阻塞 Mock Demo；
4. 所有接口统一返回 JSON；
5. 如果缺少 vivo API Key 或账号权限，保留 Mock 并向用户报告。
```

---

### 9.3 Task 3 启动指令

```text
请根据当前 Task 3 goal 开始执行。先检查 backend 目录，如果没有则创建一个最小可运行后端。实现 /api/ai/intervention、/api/ai/rest-chat、/api/ai/oral-review、/api/ai/report 四个接口。先支持 AI_MOCK_MODE=true，并预留 vivo_client.py、prompt_builder.py、mock_ai.py。完成后运行后端启动命令或接口测试，确认返回 JSON 正常。
```

---

### 9.4 Task 3 推荐文件

```text
backend/
├── main.py
├── routes/
│   └── ai.py
├── services/
│   ├── vivo_client.py
│   ├── prompt_builder.py
│   ├── mock_ai.py
│   └── report_service.py
├── schemas/
│   ├── ai_request.py
│   └── ai_response.py
├── tests/
│   └── test_ai_routes.py
├── .env.example
└── README.md
```

---

### 9.5 Task 3 接口要求

#### `/api/ai/intervention`

请求：

```json
{
  "sessionId": "study_001",
  "focusScore": 55,
  "fatigueScore": 48,
  "distractionLevel": "L2",
  "triggerReason": "连续分心超过60秒"
}
```

响应：

```json
{
  "sessionId": "study_001",
  "level": "L2",
  "type": "VOICE",
  "title": "注意力提醒",
  "message": "你已经分心一小会儿了，先把注意力拉回当前这一步吧。",
  "action": "先完成当前小任务，再休息一下。",
  "triggerReason": "连续分心超过60秒",
  "timestamp": 1710000000
}
```

#### `/api/ai/rest-chat`

请求：

```json
{
  "sessionId": "study_001",
  "sessionDuration": 45,
  "fatigueScore": 68,
  "userGoal": "考研英语阅读",
  "recentState": "疲劳偏高"
}
```

响应：

```json
{
  "message": "你已经坚持了45分钟，挺不容易的。现在可以先放松一下眼睛。刚才这段英语阅读里，哪一类题最卡？"
}
```

#### `/api/ai/oral-review`

请求：

```json
{
  "sessionId": "study_001",
  "taskName": "英语阅读",
  "focusScore": 78,
  "distractionCount": 3,
  "durationMinutes": 45
}
```

响应：

```json
{
  "question": "用一句话说说，刚才这45分钟你主要完成了什么？"
}
```

#### `/api/ai/report`

请求：

```json
{
  "sessionId": "study_001",
  "totalMinutes": 45,
  "effectiveMinutes": 38,
  "averageFocusScore": 78,
  "maxFatigueScore": 66,
  "distractionCount": 4,
  "oralReview": "我完成了两篇英语阅读，但第二篇错得比较多。"
}
```

响应：

```json
{
  "sessionId": "study_001",
  "totalMinutes": 45,
  "effectiveMinutes": 38,
  "averageFocusScore": 78,
  "maxFatigueScore": 66,
  "distractionCount": 4,
  "focusCurve": [80, 82, 78, 65, 72, 85],
  "summary": "今天整体学习状态较好，有效学习时间占比较高。",
  "advantage": "你能持续完成英语阅读任务，并且主动复盘了薄弱部分。",
  "problem": "后半段可能出现疲劳，第二篇阅读正确率受到影响。",
  "suggestions": [
    "下次可以把两篇阅读拆成两个25分钟任务",
    "第二篇阅读前安排3-5分钟休息，降低疲劳影响"
  ],
  "encouragement": "今天这段学习是有效的，继续保持这种复盘习惯。"
}
```

---

### 9.6 Task 3 验收标准

| 验收项 | 标准 |
|---|---|
| 后端可启动 | main.py 或服务入口能运行 |
| AI 接口 | 四个接口都能返回 JSON |
| Mock 模式 | AI_MOCK_MODE=true 可用 |
| vivo 预留 | 存在 vivo_client.py |
| Prompt 管理 | 存在 prompt_builder.py |
| 密钥安全 | .env.example 存在，不硬编码密钥 |
| 日报结构 | 返回 StudyReport 格式 |
| 接口测试 | 有 curl、pytest 或最小测试样例 |

---

## 10. 四任务协作顺序

### 第 0 步：Task 0 先启动

Task 0 必须先完成：

```text
1. docs/PRD.md
2. docs/API.md
3. docs/TASKS.md
4. docs/DEMO_SCRIPT.md
5. README.md
```

Task 0 定义完成前，其他任务不要自行发明字段和接口。

---

### 第 1 步：Task 1/2/3 并行做 Mock

三个任务同步启动：

```text
Task 1：使用 Mock JSON 做页面
Task 2：输出 Mock StudyState
Task 3：输出 Mock AI 响应
```

目标是先建立独立可运行模块。

---

### 第 2 步：Task 1 + Task 2 联调

目标：

```text
Task 2 输出 StudyState
↓
Task 1 显示 focusScore、fatigueScore、distractionLevel
```

验收：

```text
切换 Mock 场景后，前端状态能变化。
```

---

### 第 3 步：Task 1 + Task 3 联调

目标：

```text
Task 1 调用 /api/ai/intervention
↓
Task 3 返回 InterventionEvent
↓
Task 1 展示 L1/L2/L3 干预
```

验收：

```text
L1、L2、L3 三种提醒都能展示；
休息伴聊页能显示 AI 文案；
日报页能显示 StudyReport。
```

---

### 第 4 步：Task 1 + Task 2 + Task 3 总集成

完整链路：

```text
开始学习
↓
Task 2 输出 StudyState
↓
Task 1 展示状态
↓
Task 1 根据状态调用 Task 3
↓
Task 3 返回干预 / 伴聊 / 日报
↓
Task 1 展示完整流程
```

---

### 第 5 步：增强能力接入

在 Mock 闭环稳定后，再做：

```text
1. Task 3 尝试接入 vivo AIGC 官方接口；
2. Task 2 尝试接入真实摄像头 / MediaPipe；
3. Task 1 增加悬浮窗或原子组件模拟；
4. Task 0 更新答辩材料和技术架构说明。
```

---

## 11. 每日开发计划

### Day 1：项目规则与骨架

| 任务 | 工作内容 | 完成标准 |
|---|---|---|
| Task 0 | 生成 PRD/API/TASKS/DEMO_SCRIPT/README | 其他三人能按文档开工 |
| Task 1 | 搭建前端项目，首页和专注页静态 UI | 页面能启动 |
| Task 2 | 搭建 sensing 目录，Mock StudyState 初版 | 能输出一条状态 |
| Task 3 | 搭建 backend，AI 接口空壳 | 接口能返回 Mock JSON |

---

### Day 2：核心模块独立可用

| 任务 | 工作内容 | 完成标准 |
|---|---|---|
| Task 0 | 检查接口一致性 | 字段没有冲突 |
| Task 1 | 完成分级干预弹窗 | L1/L2/L3 样式不同 |
| Task 2 | 完成 focusScore/fatigueScore/distractionLevel 计算 | 至少 6 种状态 |
| Task 3 | 完成 intervention/rest-chat 接口 | 能返回 AI 文案 |

---

### Day 3：闭环初步跑通

| 任务 | 工作内容 | 完成标准 |
|---|---|---|
| Task 0 | 编写 Demo 主流程脚本 | 可用于录屏 |
| Task 1 | 完成休息伴聊页和日报页 | 能展示 StudyReport |
| Task 2 | 稳定 Mock 状态循环输出 | 每 5 秒更新 |
| Task 3 | 完成 oral-review/report 接口 | 能生成日报 |

---

### Day 4：第一次完整集成

| 任务 | 工作内容 | 完成标准 |
|---|---|---|
| Task 0 | 组织联调 | 记录问题清单 |
| Task 1 | 对接 sensing 和 backend | 主流程能点通 |
| Task 2 | 输出联调用 Mock 场景 | 状态可控 |
| Task 3 | 稳定 API 返回格式 | 前端可直接渲染 |

---

### Day 5：稳定演示与增强

| 任务 | 工作内容 | 完成标准 |
|---|---|---|
| Task 0 | 整理答辩话术 | 能讲清楚创新点 |
| Task 1 | 美化 UI，增加动效 | 页面更像成品 |
| Task 2 | 尝试真实摄像头 / MediaPipe | 不成功也不阻塞 |
| Task 3 | 尝试 vivo 官方接口 | 不成功保留 Mock |

---

### Day 6：录屏与材料

| 任务 | 工作内容 | 完成标准 |
|---|---|---|
| Task 0 | 准备演示稿、验收清单 | 材料齐全 |
| Task 1 | 截图、录制前端演示 | 页面素材齐全 |
| Task 2 | 输出算法说明 | 可解释状态计算 |
| Task 3 | 输出大模型应用说明 | 可解释 AI 接入 |

---

### Day 7：最终验收

| 检查项 | 标准 |
|---|---|
| Demo | 能连续演示 3 次不崩 |
| 页面 | 无明显错字、错位 |
| 数据 | 字段格式一致 |
| AI | Mock 和真实模式都能说明 |
| 文档 | PRD、API、TASKS、DEMO_SCRIPT、README 齐全 |
| 答辩 | 每个人知道自己负责什么 |
| 视频 | 展示完整闭环 |

---

## 12. 最终 Demo 脚本

### Step 1：首页

展示：

```text
今日学习时长
有效学习时长
AI 鼓励语
开始专注按钮
```

讲解：

```text
这是蓝心AI学习伴侣的首页，用户可以看到今日学习状态和 AI 鼓励语，并通过“开始专注”进入学习模式。
```

---

### Step 2：开始专注

展示：

```text
点击开始专注
进入专注学习页
计时器开始运行
```

讲解：

```text
用户开始学习后，系统进入专注模式，实时记录学习时长，并持续更新专注分和疲劳指数。
```

---

### Step 3：正常专注

Mock 数据：

```json
{
  "focusScore": 85,
  "fatigueScore": 30,
  "distractionLevel": "NONE"
}
```

讲解：

```text
当专注分高于 70 时，系统认为当前处于有效学习状态。
```

---

### Step 4：轻微分心 L1

Mock 数据：

```json
{
  "focusScore": 65,
  "fatigueScore": 35,
  "distractionLevel": "L1"
}
```

讲解：

```text
当系统检测到轻微分心时，会触发 L1 轻提醒，不打断用户学习节奏。
```

---

### Step 5：连续分心 L2

Mock 数据：

```json
{
  "focusScore": 48,
  "fatigueScore": 45,
  "distractionLevel": "L2"
}
```

讲解：

```text
当用户连续分心时，AI 会生成更明确但温和的提醒，引导用户回到当前任务。
```

---

### Step 6：严重分心或离座 L3

Mock 数据：

```json
{
  "focusScore": 25,
  "fatigueScore": 50,
  "distractionLevel": "L3",
  "isUserPresent": false
}
```

讲解：

```text
当系统判断用户已经离座或严重分心时，会触发 L3 强提醒，建议用户暂停并重新规划学习。
```

---

### Step 7：疲劳偏高

Mock 数据：

```json
{
  "focusScore": 70,
  "fatigueScore": 72,
  "distractionLevel": "NONE"
}
```

讲解：

```text
当疲劳指数升高时，系统不鼓励用户硬撑，而是建议进行短休息。
```

---

### Step 8：AI 休息伴聊

展示：

```text
AI 主动关怀语
休息倒计时
复盘问题
用户输入复盘
```

讲解：

```text
休息阶段，AI 不只是提供倒计时，而是像学习搭子一样主动发起轻松对话，并引导用户完成低压力复盘。
```

---

### Step 9：生成学习日报

展示：

```text
总学习时长
有效学习时长
平均专注分
最高疲劳指数
分心次数
AI 总结
下次建议
鼓励语
```

讲解：

```text
学习结束后，系统根据学习状态数据和用户复盘生成 AI 学习日报，完成识别、干预、复盘的完整闭环。
```

---

### Step 10：总结创新点

讲解：

```text
本项目不是传统计时器，而是将端侧状态感知与大模型生成能力结合起来，实现主动督学、情感陪伴、习惯养成和隐私优先的 AI 学习伴侣。
```

---

## 13. 总体验收清单

| 模块 | 验收项 | 是否完成 |
|---|---|---|
| Task 0 | PRD.md 完成 | ☐ |
| Task 0 | API.md 完成 | ☐ |
| Task 0 | TASKS.md 完成 | ☐ |
| Task 0 | DEMO_SCRIPT.md 完成 | ☐ |
| Task 0 | README.md 完成 | ☐ |
| Task 1 | 首页完成 | ☐ |
| Task 1 | 专注学习页完成 | ☐ |
| Task 1 | L1/L2/L3 干预弹窗完成 | ☐ |
| Task 1 | 休息伴聊页完成 | ☐ |
| Task 1 | 学习日报页完成 | ☐ |
| Task 2 | Mock StudyState 输出完成 | ☐ |
| Task 2 | 6 种 Mock 场景完成 | ☐ |
| Task 2 | focusScore 计算完成 | ☐ |
| Task 2 | fatigueScore 计算完成 | ☐ |
| Task 2 | distractionLevel 判断完成 | ☐ |
| Task 3 | /api/ai/intervention 完成 | ☐ |
| Task 3 | /api/ai/rest-chat 完成 | ☐ |
| Task 3 | /api/ai/oral-review 完成 | ☐ |
| Task 3 | /api/ai/report 完成 | ☐ |
| Task 3 | AI_MOCK_MODE=true 完成 | ☐ |
| 集成 | Task 1 + Task 2 联调完成 | ☐ |
| 集成 | Task 1 + Task 3 联调完成 | ☐ |
| 集成 | 三模块完整闭环完成 | ☐ |
| 演示 | Demo 视频录制完成 | ☐ |
| 演示 | 答辩讲稿完成 | ☐ |

---

## 14. 四个 Goal 的使用建议

如果使用四个 Codex Agent，可以分别复制对应 goal。

推荐顺序：

```text
1. 先给 Task 0 Agent 输入 Task 0 goal；
2. Task 0 生成 docs/API.md 后，再启动 Task 1、Task 2、Task 3；
3. Task 1、Task 2、Task 3 都以 docs/API.md 为唯一接口标准；
4. 每天由 Task 0 检查三方输出是否符合 API；
5. Mock 闭环跑通后，再让 Task 2 尝试真实感知，让 Task 3 尝试 vivo 接口。
```

最重要的规则：

```text
任何 Agent 都不要自行修改 StudyState、InterventionEvent、StudyReport。
如果确实需要改字段，必须先更新 docs/API.md，再同步给其他任务。
```

---

## 15. 最终原则

```text
先完成可演示闭环，再追求真实能力。
先统一接口，再并行开发。
先 Mock 可控，再接入 vivo AIGC 和真实感知。
先保证稳定演示，再添加复杂功能。
```

一句话总结：

```text
四个任务的整合目标是：用统一接口把前端、感知、AI 后端和项目统筹串起来，形成一个稳定可演示的 AI 学习陪伴 MVP。
```

# 蓝心AI学习伴侣 API 文档

## 1. 接口原则

1. Mock 优先：所有接口必须在无真实摄像头、无 vivo AIGC Key 的情况下返回可演示数据。
2. 前端只调用项目接口，不直接调用 vivo 官方接口，不直接读取感知模块内部数据。
3. 三个核心结构 `StudyState`、`InterventionEvent`、`StudyReport` 是跨模块唯一契约。
4. 所有时间戳使用 Unix 秒级时间戳；所有时长字段使用秒或分钟，并在字段名中明确。
5. 所有枚举值使用大写英文，展示文案由前端或 AI 服务转换为中文。

## 2. 通用响应格式

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| code | number | 是 | `0` 表示成功，非 0 表示错误 |
| message | string | 是 | 错误或成功说明 |
| data | object | 是 | 业务数据 |

## 3. 枚举定义

### 3.1 DistractionLevel

| 值 | 说明 |
|---|---|
| NONE | 正常学习，无明显分心 |
| L1 | 轻微分心，轻提示 |
| L2 | 连续分心，中提醒 |
| L3 | 严重分心、离座或切娱乐 App，强提醒 |

### 3.2 Emotion

| 值 | 说明 |
|---|---|
| calm | 平稳 |
| focused | 专注 |
| tired | 疲劳 |
| anxious | 焦虑 |
| distracted | 分心 |

### 3.3 CurrentScene

| 值 | 说明 |
|---|---|
| study | 学习中 |
| rest | 休息 / 伴聊 |
| report | 日报 |

### 3.4 InterventionType

| 值 | 说明 |
|---|---|
| TEXT | 文字提醒 |
| VOICE | 语音提醒 |
| POPUP | 弹窗提醒 |
| HAPTIC | 触觉提醒，MVP 可不实现 |

## 4. 核心数据结构

### 4.1 StudyState

由 Task 2 感知模块输出，供前端和 AI 服务使用。

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
  "gazeAwaySeconds": 8,
  "mouthOpenCount": 1,
  "currentAppType": "study",
  "distractionCount": 1
}
```

| 字段 | 类型 | 必填 | 范围 / 枚举 | 说明 |
|---|---|---|---|---|
| sessionId | string | 是 | - | 当前学习会话 ID |
| timestamp | number | 是 | - | 当前时间戳 |
| elapsedSeconds | number | 是 | `>= 0` | 已学习秒数 |
| focusScore | number | 是 | `0-100` | 专注分 |
| fatigueScore | number | 是 | `0-100` | 疲劳指数 |
| distractionLevel | string | 是 | `NONE/L1/L2/L3` | 分心等级 |
| emotion | string | 是 | 见 Emotion | 情绪 / 状态标签 |
| currentScene | string | 是 | `study/rest/report` | 当前场景 |
| isUserPresent | boolean | 是 | - | 用户是否在座 |
| headDownSeconds | number | 是 | `>= 0` | 低头持续秒数 |
| eyeClosedRatio | number | 是 | `0-1` | 闭眼占比 |
| gazeAwaySeconds | number | 是 | `>= 0` | 视线偏离秒数 |
| mouthOpenCount | number | 是 | `>= 0` | 打哈欠 / 张口次数 |
| currentAppType | string | 是 | `study/neutral/entertainment` | 当前前台应用类型 |
| distractionCount | number | 是 | `>= 0` | 当前会话累计分心次数 |

### 4.2 InterventionEvent

由 Task 3 AI 服务模块生成，供前端展示。

```json
{
  "eventId": "evt_001",
  "sessionId": "study_001",
  "level": "L2",
  "type": "VOICE",
  "title": "注意力提醒",
  "message": "你已经分心一小会儿了，先把注意力拉回当前这一步吧。",
  "action": "完成当前小任务后再休息",
  "triggerReason": "连续分心超过60秒",
  "timestamp": 1710000000
}
```

| 字段 | 类型 | 必填 | 范围 / 枚举 | 说明 |
|---|---|---|---|---|
| eventId | string | 是 | - | 干预事件 ID |
| sessionId | string | 是 | - | 当前学习会话 ID |
| level | string | 是 | `L1/L2/L3` | 干预等级 |
| type | string | 是 | `TEXT/VOICE/POPUP/HAPTIC` | 展示方式 |
| title | string | 是 | - | 提醒标题 |
| message | string | 是 | `<= 80` 字建议 | AI 提醒文本 |
| action | string | 是 | - | 推荐动作 |
| triggerReason | string | 是 | - | 触发原因 |
| timestamp | number | 是 | - | 触发时间 |

### 4.3 StudyReport

由 Task 3 AI 服务模块生成，供前端日报页展示。

```json
{
  "sessionId": "study_001",
  "createdAt": 1710003600,
  "totalMinutes": 45,
  "effectiveMinutes": 38,
  "averageFocusScore": 78,
  "maxFatigueScore": 66,
  "distractionCount": 4,
  "focusCurve": [80, 82, 78, 65, 72, 85],
  "fatigueCurve": [20, 24, 28, 45, 60, 66],
  "oralReview": "我完成了两篇英语阅读，但第二篇错得比较多。",
  "summary": "今天整体专注状态不错，有效学习时间占比较高。",
  "advantage": "前半段学习状态稳定，能较快进入专注状态。",
  "problem": "后半段疲劳指数上升，说明需要更早安排休息。",
  "suggestions": [
    "下次可以在第30分钟主动休息5分钟",
    "开始学习前先写下一个具体小目标"
  ],
  "encouragement": "今天已经完成了一段高质量学习，继续保持。"
}
```

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| sessionId | string | 是 | 当前学习会话 ID |
| createdAt | number | 是 | 日报生成时间 |
| totalMinutes | number | 是 | 总学习分钟数 |
| effectiveMinutes | number | 是 | 有效学习分钟数，专注分大于 70 的时间 |
| averageFocusScore | number | 是 | 平均专注分 |
| maxFatigueScore | number | 是 | 最高疲劳指数 |
| distractionCount | number | 是 | 分心次数 |
| focusCurve | number[] | 是 | 专注曲线采样 |
| fatigueCurve | number[] | 否 | 疲劳曲线采样 |
| oralReview | string | 否 | 用户复盘内容 |
| summary | string | 是 | AI 总结 |
| advantage | string | 是 | 做得好的地方 |
| problem | string | 是 | 可优化问题 |
| suggestions | string[] | 是 | 两条可执行建议 |
| encouragement | string | 是 | 鼓励语 |

## 5. 学习会话接口

### 5.1 开始学习

```http
POST /api/study/start
```

请求：

```json
{
  "userId": "demo_user",
  "taskName": "考研英语阅读",
  "targetMinutes": 45,
  "mockMode": true
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "sessionId": "study_001",
    "startedAt": 1710000000,
    "initialState": {
      "sessionId": "study_001",
      "timestamp": 1710000000,
      "elapsedSeconds": 0,
      "focusScore": 90,
      "fatigueScore": 20,
      "distractionLevel": "NONE",
      "emotion": "focused",
      "currentScene": "study",
      "isUserPresent": true,
      "headDownSeconds": 0,
      "eyeClosedRatio": 0.05,
      "gazeAwaySeconds": 0,
      "mouthOpenCount": 0,
      "currentAppType": "study",
      "distractionCount": 0
    }
  }
}
```

### 5.2 获取当前学习状态

```http
GET /api/study/state?sessionId=study_001
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "sessionId": "study_001",
    "timestamp": 1710000300,
    "elapsedSeconds": 300,
    "focusScore": 76,
    "fatigueScore": 42,
    "distractionLevel": "L1",
    "emotion": "distracted",
    "currentScene": "study",
    "isUserPresent": true,
    "headDownSeconds": 12,
    "eyeClosedRatio": 0.18,
    "gazeAwaySeconds": 25,
    "mouthOpenCount": 1,
    "currentAppType": "study",
    "distractionCount": 2
  }
}
```

### 5.3 上报学习状态

供 Task 2 感知模块向后端或前端状态层推送数据。

```http
POST /api/study/state
```

请求：`StudyState`

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "accepted": true
  }
}
```

### 5.4 结束学习

```http
POST /api/study/end
```

请求：

```json
{
  "sessionId": "study_001",
  "endedAt": 1710002700,
  "oralReview": "我完成了两篇英语阅读，但第二篇错得比较多。"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "sessionId": "study_001",
    "totalMinutes": 45,
    "shouldGenerateReport": true
  }
}
```

### 5.5 获取学习日报

```http
GET /api/study/report/{sessionId}
```

响应：`StudyReport`

## 6. AI 服务接口

### 6.1 生成分级干预

```http
POST /api/ai/intervention
```

请求：

```json
{
  "sessionId": "study_001",
  "state": {
    "focusScore": 55,
    "fatigueScore": 48,
    "distractionLevel": "L2",
    "gazeAwaySeconds": 65,
    "isUserPresent": true,
    "currentAppType": "study"
  },
  "triggerReason": "连续分心超过60秒"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "eventId": "evt_001",
    "sessionId": "study_001",
    "level": "L2",
    "type": "VOICE",
    "title": "注意力提醒",
    "message": "你已经分心一小会儿了，先把注意力拉回当前这一步吧。",
    "action": "先完成当前小任务，再休息一下。",
    "triggerReason": "连续分心超过60秒",
    "timestamp": 1710000000
  }
}
```

展示规则：

| level | 推荐 type | 前端展示 |
|---|---|---|
| L1 | TEXT | 顶部轻提示 / Toast |
| L2 | VOICE | 中等弹窗 + 语音按钮 |
| L3 | POPUP | 强弹窗 + 确认按钮 |

### 6.2 生成休息期伴聊

```http
POST /api/ai/rest-chat
```

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
  "code": 0,
  "message": "ok",
  "data": {
    "message": "你已经坚持了45分钟，挺不容易的。现在可以先放松一下眼睛。刚才这段英语阅读里，哪一类题最卡？",
    "suggestedReplies": [
      "第二篇阅读比较卡",
      "注意力后半段下降了",
      "整体还可以"
    ]
  }
}
```

### 6.3 生成口头复盘问题

```http
POST /api/ai/oral-review
```

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
  "code": 0,
  "message": "ok",
  "data": {
    "question": "用一句话说说，刚才这45分钟你主要完成了什么？"
  }
}
```

### 6.4 生成学习日报

```http
POST /api/ai/report
```

请求：

```json
{
  "sessionId": "study_001",
  "totalMinutes": 45,
  "effectiveMinutes": 38,
  "averageFocusScore": 78,
  "maxFatigueScore": 66,
  "distractionCount": 4,
  "focusCurve": [80, 82, 78, 65, 72, 85],
  "fatigueCurve": [20, 24, 28, 45, 60, 66],
  "oralReview": "我完成了两篇英语阅读，但第二篇错得比较多。"
}
```

响应：

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "sessionId": "study_001",
    "createdAt": 1710003600,
    "totalMinutes": 45,
    "effectiveMinutes": 38,
    "averageFocusScore": 78,
    "maxFatigueScore": 66,
    "distractionCount": 4,
    "focusCurve": [80, 82, 78, 65, 72, 85],
    "fatigueCurve": [20, 24, 28, 45, 60, 66],
    "oralReview": "我完成了两篇英语阅读，但第二篇错得比较多。",
    "summary": "今天整体学习状态较好，有效学习时间占比较高。",
    "advantage": "你能持续完成英语阅读任务，并且主动复盘了薄弱部分。",
    "problem": "后半段可能出现疲劳，第二篇阅读正确率受到影响。",
    "suggestions": [
      "下次可以把两篇阅读拆成两个25分钟任务",
      "第二篇阅读前安排3-5分钟休息，降低疲劳影响"
    ],
    "encouragement": "今天这段学习是有效的，继续保持这种复盘习惯。"
  }
}
```

## 7. 感知模块接口

### 7.1 Mock 输入结构

Task 2 可用如下输入生成 `StudyState`：

```json
{
  "sessionId": "study_001",
  "elapsedSeconds": 300,
  "gazeAwaySeconds": 25,
  "headDownSeconds": 10,
  "eyeClosedRatio": 0.18,
  "mouthOpenCount": 1,
  "isUserPresent": true,
  "currentAppType": "study"
}
```

### 7.2 输出频率

```text
每 5 秒输出一次 StudyState。
```

### 7.3 计算规则

专注分：

```text
focusScore = 100
             - gazePenalty
             - headDownPenalty
             - appSwitchPenalty
             - absencePenalty
             - fatiguePenalty
```

疲劳指数：

```text
fatigueScore = eyeClosedRatio * 60
             + mouthOpenCount * 8
             + headDownPenalty
             + longStudyPenalty
```

分心等级：

| 等级 | 条件 |
|---|---|
| NONE | 状态正常 |
| L1 | 视线偏离超过 20 秒，或专注分低于 70 |
| L2 | 连续分心超过 60 秒，或专注分低于 50 |
| L3 | 离座、切娱乐 App、长时间无响应 |

## 8. Mock 场景

| 场景 | 关键字段 |
|---|---|
| normal_focus | `focusScore: 85-95`，`fatigueScore: 20-40`，`distractionLevel: NONE` |
| light_distraction | `focusScore: 60-70`，`distractionLevel: L1` |
| heavy_distraction | `focusScore: 40-55`，`distractionLevel: L2` |
| fatigue_high | `fatigueScore: 60-80`，`emotion: tired` |
| absent | `isUserPresent: false`，`distractionLevel: L3` |
| recovered | `focusScore: 80+`，`fatigueScore` 回落，`distractionLevel: NONE` |

## 9. 错误码

| code | message | 说明 |
|---|---|---|
| 0 | ok | 成功 |
| 40001 | invalid_request | 请求参数缺失或类型错误 |
| 40002 | invalid_session | sessionId 不存在 |
| 40003 | invalid_state | StudyState 字段不完整或枚举非法 |
| 50001 | ai_service_error | AI 服务调用失败 |
| 50002 | sensing_service_error | 感知模块异常 |
| 50003 | mock_fallback_used | 真实服务失败，已使用 Mock 兜底 |

## 10. 模块符合性检查

| 模块 | 必须符合 | 检查方式 |
|---|---|---|
| 前端 Task 1 | 只依赖 `StudyState`、`InterventionEvent`、`StudyReport` 展示，不写死内部算法 | 使用 API 示例 JSON 可完整跑通页面 |
| 感知 Task 2 | 输出字段完整，枚举合法，数值范围合法，每 5 秒更新 | 用 JSON Schema 或单元测试校验 |
| AI Task 3 | 返回标准 JSON，不暴露 vivo 原始响应，Mock 模式可用 | 断网或无 Key 时仍能返回干预、伴聊、日报 |
| 集成 Task 0 | 三个模块使用同一个 `sessionId`，主流程无断点 | 按 Demo 脚本连续演示 |


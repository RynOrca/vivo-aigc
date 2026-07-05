# Task 2 端侧感知与状态计算模块

## 职责

每 5 秒输出一次标准 `StudyState`，字段完全符合 `docs/API.md` §4.1。

第一版采用 **Mock 状态生成器**，支持 6 种学习场景的循环输出。真实摄像头 / MediaPipe 接入作为后续增强，不阻塞 Demo。

## 文件结构

```text
sensing/
├── mockGenerator.js        # 核心：循环生成 Mock StudyState
├── focusDetector.js        # focusScore 计算规则
├── fatigueDetector.js      # fatigueScore 计算规则
├── distractionDetector.js  # distractionLevel 判断规则
├── test_sensing.js         # 运行验证脚本
└── README.md
```

## 运行方式

```bash
node sensing/test_sensing.js
```

## 6 种 Mock 场景

| 场景 | 时间段 | focusScore | fatigueScore | distractionLevel | 说明 |
|---|---|---|---|---|---|
| 正常专注 (NORMAL) | 0-30s | 82-95 | 20-40 | NONE | 高效学习 |
| 轻微分心 (L1) | 30-60s | 60-70 | 30-45 | L1 | 视线偏离 20s+ |
| 恢复专注 (RECOVERED) | 60-85s | 75-90 | 30-45 | NONE | 调整回来 |
| 连续分心 (L2) | 85-115s | 40-55 | 45-60 | L2 | 视线偏离 60s+ |
| 恢复专注 (RECOVERED) | 115-135s | 75-90 | 30-45 | NONE | 再次恢复 |
| 疲劳偏高 (FATIGUE) | 135-155s | 65-75 | 65-80 | NONE | fatigueScore > 60 |
| 离座 (L3) | 155-175s | 15-30 | 45-60 | L3 | isUserPresent=false |
| 恢复专注 (RECOVERED) | 175-200s | 75-90 | 30-45 | NONE | 回到座位 |

循环周期：200 秒（前端计时器会持续对 200 取模）。

## 计算规则

| 指标 | 规则 |
|---|---|
| focusScore | 场景基准 + 随机扰动 ±3，clamp 0-100 |
| fatigueScore | 场景基准学习时长增长（每 5 分钟 +3）+ 随机扰动 |
| distractionLevel | 场景定义（基于视线偏离时长 + App 类型 + 在座状态） |
| effectiveMinutes | totalMinutes × avgFocus / 100 |

## 集成方式

前端通过 `app/src/data/api.js` 调用：

```js
import { generateStudyState } from '../sensing/mockGenerator.js'
const state = generateStudyState(elapsedSeconds)  // → StudyState
```

后端 `GET /api/study/state` 接口委托此模块生成状态。

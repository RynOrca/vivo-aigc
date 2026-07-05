# Task 3 AI 后端服务

## 职责

为前端提供 8 个标准接口，封装：
- **学习会话 CRUD**（3 个）— `study.js`
- **文本 AI 服务**（4 个）— `ai.js`（干预 / 伴聊 / 复盘 / 日报）
- **AI 面部感知**（1 个）— `face.js`（Qwen-VL 读面部 → DeepSeek 数值校准 → 干预）

多 Provider 架构：默认走本地 Mock 模板，可按需启用 DeepSeek / vivo 蓝心 AI / Qwen-VL 识图。

## 文件结构

```text
backend/
├── main.js                         # Express 入口，端口 8000
├── package.json                    # 依赖：express cors dotenv
├── routes/
│   ├── study.js                    # 学习会话 CRUD（start/state/end/report）
│   ├── ai.js                       # 文本 AI 4 接口（自动 Mock/vivo/DeepSeek 切换）
│   └── face.js                     # 面部感知接口 /api/ai/analyze-face
├── services/
│   ├── llmClient.js                # 多 Provider 统一客户端（DeepSeek / vivo / Qwen-VL）
│   ├── mockAI.js                   # Mock 文案模板
│   ├── faceAnalyzer.js             # Qwen-VL 面部粗分类特征提取
│   ├── deepseekPrompts.js          # DeepSeek 专用 Prompt（数值校准 + 日报 JSON Mode）
│   ├── vivoClient.js               # 蓝心 AI 客户端（保留原方案作为备选）
│   └── promptBuilder.js            # 文本 intervention/rest-chat/oral-review Prompt
├── schemas/
│   └── validate.js                 # 请求体校验
├── .env.example                    # 环境变量模板
├── test_api.sh                     # 一键测试脚本（原 7 接口）
├── test_ai_providers.sh            # Phase 9 新增：DeepSeek + Qwen-VL 真调用测试
└── README.md
```

## 启动方式

```bash
cd backend
npm install          # 首次安装 express cors dotenv
cp .env.example .env # 编辑 .env 配置 Key（可选）
npm start            # 或 node main.js
```

服务启动后访问：`http://localhost:8000`

## 配置说明

复制 `.env.example` 为 `.env`：

```ini
# 默认值（评委直接跑，无需 Key）
AI_MOCK_MODE=true
DEFAULT_MODEL_PROVIDER=deepseek

# 接入真实 LLM（取消注释并填入 Key 后，再设 AI_MOCK_MODE=false）
# DEEPSEEK_API_KEY=sk-...
# QEWN_API_KEY=sk-...

# 蓝心 AI 备选方案（注释状态）
# VIVO_API_KEY=sk-xuanji-...
```

**复赛提交时**：
- `AI_MOCK_MODE=true` → 直接可运行，无需任何 Key → **评委首选**
- `AI_MOCK_MODE=false` + `DEEPSEEK_API_KEY` 已填 → 走 DeepSeek 真实生成
- `DEFAULT_MODEL_PROVIDER=vivo` + `VIVO_API_KEY` 已填 → 切回蓝心 AI

## 模型选择（Phase 9 新增）

| Provider | 类型 | 用途 | 模型 |
|---|---|---|---|
| `deepseek`（默认） | 文本 | 干预/伴聊/复盘/日报 文案 + 日报 JSON Mode | `deepseek-chat` |
| `vivo`（备选） | 文本 | 蓝心 AI 原方案 | `blue-lm-v-3b` |
| `qewn` | 识图 | 面部特征读取 | `qwen-vl-plus` |

`chatCompletion()` 内部按 `DEFAULT_MODEL_PROVIDER` 自动路由；`visionCompletion()` 固定走 Qwen-VL。

### 切换示例

```bash
# 默认（DeepSeek）
AI_MOCK_MODE=false DEFAULT_MODEL_PROVIDER=deepseek npm start

# 切回 vivo 备选
AI_MOCK_MODE=false DEFAULT_MODEL_PROVIDER=vivo npm start
```

### Vue AIGC AppKey 申请

- **DeepSeek**：https://platform.deepseek.com （注册送 500 万 Token）
- **蓝心 AI**：https://aigc.vivo.com.cn （申请蓝心大模型 AppKey）
- **Qwen-VL（阿里云百炼）**：https://llm-dm4c0m7ddxaxtw51.cn-beijing.maas.aliyuncs.com

## 接口一览

| 方法 | 路径 | 说明 |
|---|---|---|
| GET  | `/api/health` | 健康检查（含 Provider 状态） |
| POST | `/api/study/start` | 创建学习会话 |
| GET  | `/api/study/state` | 获取当前 StudyState |
| POST | `/api/study/end` | 结束学习会话 |
| GET  | `/api/study/report/:id` | 获取已有日报 |
| POST | `/api/ai/intervention` | L1/L2/L3 分级干预 |
| POST | `/api/ai/rest-chat` | 休息伴聊文案 |
| POST | `/api/ai/oral-review` | 口头复盘问题 |
| POST | `/api/ai/report` | 学习日报生成（DeepSeek JSON Mode） |
| POST | `/api/ai/analyze-face` | 面部感知管线（Qwen-VL → DeepSeek） |

字段定义详见 `docs/API.md` §5。

## AI 感知管线（Phase 9 核心）

这是区别于传统学习 App 的**核心创新点**：

```
前置摄像头拍照（前端目前尚未集成，由后端独立 endpoint 暴露）
    ↓
Qwen-VL（识图模型）分析面部照片 → 输出粗分类字段：
    eyeClosedRatio（闭眼占比）/ gazeDirection（视线方向）/
    gazeAwaySeconds（视线偏离秒）/ headYawDeg / headPitchDeg /
    mouthOpen（打哈欠）/ isUserPresent（是否在座）
    ↓
DeepSeek（文本模型）接收上面粗分类字段 + 学习上下文
    → 数值校准 → 算出 focusScore / fatigueScore / distractionLevel / emotion
    ↓
如果 distractionLevel != NONE → 生成分级干预事件返回
    ↓
返回完整包：{ faceFeatures, studyState, intervention }
```

### 请求示例

```bash
# 1. 先创建学习会话
curl -X POST http://localhost:8000/api/study/start \
  -H 'Content-Type: application/json' \
  -d '{"userId":"u1","taskName":"考研英语","targetMinutes":45}'

# 2. 调用 analyze-face（把 sessionId 换成上面返回的）
curl -X POST http://localhost:8000/api/ai/analyze-face \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"study_xxx","image":{"url":"https://照片URL"}}'

# 也可用 base64 上传（适合前端 WebRTC 摄像头拍照）
curl -X POST http://localhost:8000/api/ai/analyze-face \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"study_xxx","image":{"base64":"<base64>"}}'
```

### 响应示例

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "sessionId": "study_xxx",
    "timestamp": 1710000000,
    "faceFeatures": {
      "isUserPresent": true,
      "faceCount": 1,
      "eyeClosedRatio": 0.11,
      "gazeDirection": "center",
      "gazeAwaySeconds": 7,
      "headYawDeg": 1.2,
      "headPitchDeg": -0.3,
      "mouthOpen": false,
      "mouthOpenCount": 0,
      "currentAppType": "study"
    },
    "studyState": {
      "focusScore": 78,
      "fatigueScore": 15,
      "distractionLevel": "NONE",
      "emotion": "calm"
    },
    "intervention": null
  }
}
```

## 接口测试

```bash
# 先启动后端
cd backend && npm start

# 另开终端，冒烟 Mock 模式主流程（7 原接口）
bash backend/test_api.sh

# Phase 9 新：DeepSeek + Qwen-VL 真调用测试（需要 .env 配好 Key）
bash backend/test_ai_providers.sh
```

## Provider 切换 / Mock 降级机制

```
请求到达 ai.js 路由
    ↓
AI_MOCK_MODE=true? ──是──→ mockAI.js 直接返回模板文案
    ↓ 否
llmClient.isAvailable('text')（DeepSeek 或 vivo Key 已填）?
    └── 否 ──→ 降级 Mock（记录 warn）
    ↓ 是
按 DEFAULT_MODEL_PROVIDER 选 DeepSeek / vivo
    ↓ 失败
自动降级 Mock（记录 warn）
```

**任何情况下主流程不会因外部 LLM 接口问题中断。**

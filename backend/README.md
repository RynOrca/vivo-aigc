# Task 3 AI 后端服务

## 职责

为前端提供 7 个标准接口，封装 AI 干预、休息伴聊、复盘引导和学习日报生成能力。

第一版支持 `AI_MOCK_MODE=true`（默认）本地 Mock 降级，预留蓝心 AI (vivo AIGC) 接入位。

## 文件结构

```text
backend/
├── main.js                  # Express 入口，端口 8000
├── package.json             # 依赖：express cors dotenv
├── routes/
│   ├── study.js             # 学习会话 CRUD（start/state/end/report）
│   └── ai.js                # AI 服务 4 接口（自动 Mock/vivo 切换）
├── services/
│   ├── mockAI.js            # Mock 文案模板
│   ├── vivoClient.js        # 蓝心 AI 客户端（待 Key 生效后启用）
│   └── promptBuilder.js     # Prompt 集中管理
├── schemas/
│   └── validate.js          # 请求体校验
├── .env.example             # 环境变量模板
├── test_api.sh              # 一键测试脚本
└── README.md
```

## 启动方式

```bash
cd backend
npm install          # 首次安装 express cors dotenv
cp .env.example .env # 编辑 .env 配置 vivo Key（可选）
npm start            # 或 node main.js
```

服务启动后访问：`http://localhost:8000`

## 配置说明

复制 `.env.example` 为 `.env`：

```env
AI_MOCK_MODE=true                                # Mock 模式（默认，无需 vivo Key）
VIVO_API_KEY=sk-xuanji-xxx                       # 申请：https://aigc.vivo.com.cn
VIVO_API_SECRET=
VIVO_BASE_URL=https://api-ai.vivo.com.cn
VIVO_MODEL=blue-lm-v-3b
```

**复赛提交时**：
- `AI_MOCK_MODE=true` → 直接可运行，无需任何 Key
- `AI_MOCK_MODE=false` 且 `VIVO_API_KEY` 已填 → 走蓝心 AI 生成真实文案

## 接口一览

| 方法 | 路径 | 说明 |
|---|---|---|
| GET  | `/api/health` | 健康检查 |
| POST | `/api/study/start` | 创建学习会话 |
| GET  | `/api/study/state` | 获取当前 StudyState |
| POST | `/api/study/end` | 结束学习会话 |
| GET  | `/api/study/report/:id` | 获取已有日报 |
| POST | `/api/ai/intervention` | L1/L2/L3 分级干预 |
| POST | `/api/ai/rest-chat` | 休息伴聊文案 |
| POST | `/api/ai/oral-review` | 口头复盘问题 |
| POST | `/api/ai/report` | 学习日报生成 |

字段定义详见 `docs/API.md` §5。

## 接口测试

```bash
# 先启动后端
node backend/main.js

# 另开终端，运行测试
bash backend/test_api.sh
```

测试覆盖全部 4 个 AI 接口 + 3 个 Study 接口。

## Mock / vivo 切换机制

```
请求到达 ai.js 路由
    ↓
AI_MOCK_MODE=true? ──是──→ mockAI.js 直接返回模板文案
    ↓ 否
vivoClient.isVivoAvailable()? ──否──→ 降级 Mock
    ↓ 是
调用蓝心 AI (vivo AIGC)
    ↓ 失败
自动降级 Mock（记录 warn 日志）
```

**任何情况下主流程不会因 vivo 接口问题中断。**

## 蓝心 AI 接入说明

接入文档：https://aigc.vivo.com.cn/#/document/index?id=1677

`vivoClient.js` 按 OpenAI 兼容格式调用：

```
POST {VIVO_BASE_URL}/v1/chat/completions
Authorization: Bearer {VIVO_API_KEY}
Body: { model, messages: [{role, content}], stream: false }
```

如需调整接口路径或认证方式，修改 `vivoClient.js` 即可，不影响业务逻辑。

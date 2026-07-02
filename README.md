# 蓝心AI学习伴侣 Smart Study Companion

面向备考、高强度学习、自习和远程学习场景的 AI 学习陪伴 Demo。

MVP 主流程：

```text
开始学习 → 实时检测 → 分心 / 疲劳干预 → AI 伴聊 → 学习日报
```

## 项目原则

1. Mock 优先：先跑通完整演示闭环，再替换真实摄像头和 vivo AIGC 接口。
2. 接口优先：前端、感知、AI 三个模块只通过标准数据结构集成。
3. 小步集成：每天至少验证一次主流程是否仍可演示。
4. 不做复杂功能代码：当前 Task 0 只建立文档、规则和项目骨架。
5. 隐私优先：Demo 阶段只传递抽象状态数据，不传递原始人脸图像。

## 目录结构

```text
.
├── app/                    # Task 1：前端 App 与交互
├── backend/                # Task 3：后端与 AI 服务
├── sensing/                # Task 2：端侧感知与状态计算
├── docs/                   # Task 0：PRD、API、任务分工、Demo 脚本
│   ├── PRD.md
│   ├── API.md
│   ├── TASKS.md
│   └── DEMO_SCRIPT.md
├── demo/                   # 演示脚本、录屏素材、截图
└── README.md
```

## 文档入口

| 文件 | 说明 |
|---|---|
| [docs/PRD.md](docs/PRD.md) | 产品定位、用户、痛点、MVP 范围、主流程、每日计划、验收标准 |
| [docs/API.md](docs/API.md) | `StudyState`、`InterventionEvent`、`StudyReport` 和所有接口 |
| [docs/TASKS.md](docs/TASKS.md) | 四人分工、输入输出、验收标准、每日检查清单 |
| [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | Demo 演示流程和讲解话术 |

## 启动方式

当前 Task 0 阶段还没有实现复杂功能代码，因此暂不提供统一启动命令。

后续建议：

```text
app/      前端开发者提供启动命令，例如 npm install && npm run dev
backend/  后端开发者提供启动命令，例如 python main.py
sensing/  感知开发者提供 Mock 运行命令，例如 python mock_generator.py
```

集成前，三个模块都必须支持 Mock 模式，并能使用 [docs/API.md](docs/API.md) 中的示例 JSON 单独调试。

## Mock 优先原则

MVP 不等待真实能力接入，先保证演示完整：

| 能力 | MVP 做法 | 后续增强 |
|---|---|---|
| 学习状态识别 | Mock + 规则计算 `StudyState` | CameraX / MediaPipe / 端侧视觉模型 |
| AI 干预 | Mock Prompt 模板返回 `InterventionEvent` | vivo AIGC / 蓝心大模型 |
| AI 伴聊 | Mock 文案 | 蓝心小 V / 语音生成 |
| 学习日报 | Mock 或本地模板生成 `StudyReport` | 大模型总结 + 趋势分析 |
| 原子组件 / 触觉反馈 | 文档说明或静态演示 | OriginOS 原子组件 / V-Touch |

## 核心接口结构

必须统一使用三类核心数据结构：

- `StudyState`：感知模块每 5 秒输出的学习状态。
- `InterventionEvent`：AI 服务生成的分级干预事件。
- `StudyReport`：学习结束后的 AI 日报。

字段定义见 [docs/API.md](docs/API.md)。

## 四人并行开发方式

| 任务 | 目录 | 先做什么 |
|---|---|---|
| Task 0 项目统筹 | `docs/`、`demo/` | 维护 PRD、API、任务、Demo 脚本和验收 |
| Task 1 前端 | `app/` | 用 API 示例 JSON 先完成页面和交互 |
| Task 2 感知 | `sensing/` | 先输出 Mock `StudyState` |
| Task 3 AI / 后端 | `backend/` | 先输出 Mock `InterventionEvent` 和 `StudyReport` |

每日集成检查：

1. 前端是否能读取标准 `StudyState`。
2. 感知模块是否输出完整 JSON。
3. AI 模块是否返回标准 JSON。
4. Mock 数据是否能驱动完整主流程。
5. Demo 是否能无断点跑通。
6. 文档是否与代码保持一致。

## Task 0 当前交付

- 已建立项目骨架。
- 已定义 MVP 范围。
- 已定义核心数据结构和接口。
- 已制定四人任务分工。
- 已制定每日开发计划和验收标准。
- 已编写 Demo 演示脚本。


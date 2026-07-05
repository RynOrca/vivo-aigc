# 环境搭建指南

> 从零搭建蓝心 AI 学习伴侣开发/运行环境。评委 & 开发者均可按此文操作。

---

## 一、前置环境

| 工具 | 最低版本 | 推荐版本 | 下载 |
|---|---|---|---|
| **Node.js** | ≥ 18.x | 20.x LTS / 22.x LTS | https://nodejs.org |
| **npm** | ≥ 9.x | 随 Node.js 自带 | — |
| **Git** | ≥ 2.30 | 最新版 | https://git-scm.com |
| **浏览器** | Chrome 90+ / Edge 90+ / Safari 15+ | 最新版 | — |

### 可选（构建 APK 时需要）

| 工具 | 用途 | 下载 |
|---|---|---|
| **Android Studio** | Android SDK + 模拟器 | https://developer.android.com/studio |
| **JDK 17** | APK 编译 | https://adoptium.net |
| **Gradle** | Android 构建（Android Studio 自带） | 随 Android Studio |

---

## 二、克隆 & 一键安装

```bash
# 1. 克隆仓库
git clone https://github.com/RynOrca/vivo-aigc.git
cd vivo-aigc

# 2. 安装前端依赖
cd app
npm install

# 3. 安装后端依赖
cd ../backend
npm install

# 4. 回到项目根目录
cd ..
```

---

## 三、启动方式

### 方式 A：Mock 模式（推荐，零配置）

无需后端、无需 API Key，浏览器直接跑全部 6 个页面。

```bash
cd app
npm run dev
# 浏览器访问 http://localhost:5173
```

App 默认 Mock 模式，页面包含：Dashboard → 专注学习 → 休息伴聊 → 学习日报 → 统计 → 设置。

### 方式 B：完整模式（前端 + 后端）

需要 **两个终端**：

```bash
# 终端 1：启动 AI 后端（端口 8000）
cd backend
cp .env.example .env        # 首次需创建 .env
# 编辑 .env，填入你的 API Key（见第四节）
npm start
# 看到 "监听地址：http://localhost:8000" 即成功
```

```bash
# 终端 2：启动前端
cd app
npm run dev
```

进入 App **设置页** → 关闭「数据源模式」Toggle → 走真实后端。

---

## 四、AI 服务配置（需要真实 AI 时）

### 4.1 创建 .env

```bash
cd backend
cp .env.example .env
```

### 4.2 获取 API Key

| Provider | 用途 | 模型 | 申请地址 |
|---|---|---|---|
| **DeepSeek**（主力） | 文本生成 / 干预文案 / 日报 JSON Mode | `deepseek-chat` | https://platform.deepseek.com（注册送 500 万 Token） |
| **Qwen-VL**（识图） | 面部分析 / 疲劳检测 | `qwen-vl-plus` | 阿里云百炼 MAAS 平台 |
| **VIVO 蓝心 AI**（备选） | 原方案保留 | `blue-lm-v-3b` | https://aigc.vivo.com.cn |

### 4.3 填写 .env

```bash
# backend/.env

# ===== 服务端口 =====
PORT=8000

# ===== AI 模式 =====
AI_MOCK_MODE=false              # false = 调用真实 LLM
DEFAULT_MODEL_PROVIDER=deepseek  # deepseek | vivo

# ===== DeepSeek =====
DEEPSEEK_API_KEY=sk-your-deepseek-key-here
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

# ===== Qwen-VL（识图）=====
QEWN_API_KEY=sk-your-qewn-key-here
QEWN_BASE_URL=https://your-qewn-endpoint
QEWN_MODEL=qwen-vl-plus
```

### 4.4 验证

```bash
# 测试后端所有接口
cd backend && bash test_api.sh

# 测试 AI provider 连通性
cd backend && bash test_ai_providers.sh
```

---

## 五、构建 Android APK

项目使用 Capacitor 打包为 APK，前端直连 AI API（无需后端）。

### 5.1 前置条件

- Android Studio（安装时勾选 Android SDK Platform 34+）
- JDK 17
- 环境变量 `ANDROID_HOME` 指向 SDK 路径
- 环境变量 `JAVA_HOME` 指向 JDK 17 路径

### 5.2 构建步骤

```bash
cd app

# 1. 构建前端产物
npm run build

# 2. 同步到 Android 项目
npx cap sync android

# 3. 编译 APK
cd android
./gradlew assembleDebug

# APK 输出路径：
# app/android/app/build/outputs/apk/debug/app-debug.apk
```

### 5.3 安装到手机

```bash
# 通过 ADB
adb install app/android/app/build/outputs/apk/debug/app-debug.apk

# 或直接用 Android Studio 打开 app/android/ 目录，点 Run
```

---

## 六、目录结构速览

```text
vivo-aigc/
├── app/                        # 前端 React App（Vite 7 + React 19）
│   ├── src/
│   │   ├── pages/              # 6 个页面组件
│   │   ├── components/         # 公共组件（PhoneFrame、ArcProgress 等）
│   │   ├── data/               # 状态管理 + API 层 + AI 管线
│   │   └── hooks/              # useCamera / useAIAnalysis
│   ├── android/                # Capacitor Android 项目
│   ├── capacitor.config.json   # Capacitor 配置
│   └── package.json            # 前端依赖
│
├── backend/                    # AI 后端服务（Express）
│   ├── routes/                 # study / ai / face 路由
│   ├── services/               # LLM 客户端 / Prompt / Mock
│   ├── schemas/                # 请求校验
│   ├── .env.example            # 环境变量模板
│   └── package.json            # 后端依赖
│
├── sensing/                    # 端侧感知算法（独立模块）
│   ├── mockGenerator.js        # Mock StudyState 生成器
│   ├── focusDetector.js        # 专注分计算
│   ├── fatigueDetector.js      # 疲劳分计算
│   ├── distractionDetector.js  # 分心等级判断
│   └── test_sensing.js         # 验证脚本
│
└── docs/                       # 项目文档
    ├── PRD.md                  # 产品需求文档
    ├── API.md                  # 接口 & 数据结构定义
    ├── TASKS.md                # 四人任务分工
    └── DEMO_SCRIPT.md          # 演示脚本 & 话术
```

---

## 七、常见问题

| 问题 | 原因 | 解决 |
|---|---|---|
| 端口 8000 被占用 | 其他进程占用 | 修改 `backend/.env` 的 `PORT` 值 |
| 端口 5173 被占用 | 其他 Vite 实例 | Vite 会自动换端口，看终端提示 |
| 前端白屏 + `Failed to fetch` | 后端未启动 | 切回 Mock 模式，或启动后端 |
| AI 接口报错 | API Key 未填或无效 | 检查 `.env`，或在设置页关闭直连模式 |
| `npm install` 失败 | Node 版本过低 | 升级到 Node 18+ |
| APK 构建失败 | SDK/JDK 未配 | 检查 `ANDROID_HOME` 和 `JAVA_HOME` 环境变量 |
| `gradlew` 权限被拒 (Mac/Linux) | 缺少执行权限 | `chmod +x app/android/gradlew` |
| 摄像头无法启动 | 非 HTTPS/localhost | 浏览器需 localhost 或 HTTPS；APK 无此限制 |
| sensing import 失败 | 跨目录引用 | Mock 模式通过 `mockAdapter.js` 解决，不影响运行 |

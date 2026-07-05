#!/usr/bin/env bash
# Phase 9 一键测试脚本 — DeepSeek + Qwen-VL 多模型接管
#
# 前置条件：
#   1. 后端已启动：cd backend && npm start
#   2. .env.example 已 cp 为 .env（Key 已填）且 AI_MOCK_MODE=false
#
# 测试用例：
#   1. DeepSeek 干预文案（文本 4 接口走真实 DeepSeek）
#   2. DeepSeek 日报（JSON Mode 结构化输出）
#   3. Qwen-VL + DeepSeek analyze-face 完整管线
#   4. analyze-face Mock 模式（无需 Key）

set -e

BASE_URL="${BASE_URL:-http://localhost:8000}"

echo ""
echo "═══ Phase 9 多模型接入测试 ═══"
echo "  后端地址: $BASE_URL"
echo ""

# ========================================
# 1. DeepSeek 干预文案
# ========================================
echo "━━━ 1. DeepSeek 干预文案 ━━━"
RESP=$(curl -s -X POST "$BASE_URL/api/ai/intervention" \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"test-ds","focusScore":55,"fatigueScore":40,"distractionLevel":"L1","triggerReason":"视线偏离"}')

echo "$RESP" | node -e "
const d = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log('  code:', d.code);
console.log('  provider message:', d.data.message);
console.log('  title:', d.data.title, '| level:', d.data.level);
if (d.code !== 0 || !d.data || !d.data.message) { console.error('  ❌ 失败'); process.exit(1); }
console.log('  ✅ 通过');
"

# ========================================
# 2. DeepSeek 日报（JSON Mode）
# ========================================
echo ""
echo "━━━ 2. DeepSeek 日报 JSON Mode ━━━"
RESP=$(curl -s -X POST "$BASE_URL/api/ai/report" \
  -H 'Content-Type: application/json' \
  -d '{"sessionId":"test-ds","totalMinutes":45,"averageFocusScore":68,"maxFatigueScore":72,"distractionCount":3,"focusCurve":[80,78,70,55,48,42],"oralReview":"第二篇阅读错得比较多"}')

echo "$RESP" | node -e "
const d = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const x = d.data;
console.log('  code:', d.code);
console.log('  summary:', x.summary);
console.log('  advantage:', x.advantage);
console.log('  suggestions:', JSON.stringify(x.suggestions));
console.log('  encouragement:', x.encouragement);
const required = ['summary','advantage','problem','suggestions','encouragement'];
const missing = required.filter(k => !x[k] || (Array.isArray(x[k]) && x[k].length === 0));
if (missing.length > 0) { console.error('  ❌ 缺失字段:', missing.join(',')); process.exit(1); }
console.log('  ✅ 通过（5/5 字段齐全）');
"

# ========================================
# 3. Qwen-VL + DeepSeek analyze-face 完整管线
# ========================================
echo ""
echo "━━━ 3. Qwen-VL + DeepSeek analyze-face ━━━"

# 先创建学习会话
echo "  [step 1] 创建学习会话..."
SID=$(curl -s -X POST "$BASE_URL/api/study/start" \
  -H 'Content-Type: application/json' \
  -d '{"userId":"u1","taskName":"AI 感知测试","targetMinutes":30}' \
  | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);process.stdout.write(r.data?r.data.sessionId:'')})")
if [ -z "$SID" ]; then echo "  ❌ 会话创建失败"; exit 1; fi
echo "  sessionId: $SID"

# 调用 analyze-face — 使用公开可访问的人像照片
echo "  [step 2] 调用 analyze-face（照片来自 unsplash）..."
RESP=$(curl -s -X POST "$BASE_URL/api/ai/analyze-face" \
  -H 'Content-Type: application/json' \
  -d "{\"sessionId\":\"$SID\",\"image\":{\"url\":\"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400\"}}")

echo "$RESP" | node -e "
const d = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log('  code:', d.code, '| message:', d.message);
if (d.code !== 0 || !d.data) { console.error('  ❌ 失败'); process.exit(1); }

const ff = d.data.faceFeatures, ss = d.data.studyState;
const requiredFace = ['isUserPresent','eyeClosedRatio','gazeDirection','headYawDeg','headPitchDeg','faceCount'];
const missingFace = requiredFace.filter(k => ff[k] === undefined);
if (missingFace.length > 0) { console.error('  ❌ faceFeatures 缺失字段:', missingFace.join(',')); process.exit(1); }

const requiredState = ['focusScore','fatigueScore','distractionLevel','emotion'];
const missingState = requiredState.filter(k => ss[k] === undefined);
if (missingState.length > 0) { console.error('  ❌ studyState 缺失字段:', missingState.join(',')); process.exit(1); }

console.log('  faceFeatures:', JSON.stringify({
  isUserPresent: ff.isUserPresent,
  eyeClosedRatio: ff.eyeClosedRatio,
  gazeDirection: ff.gazeDirection,
  headYawDeg: ff.headYawDeg,
  headPitchDeg: ff.headPitchDeg,
  faceCount: ff.faceCount
}));
console.log('  studyState:', JSON.stringify({
  focusScore: ss.focusScore,
  fatigueScore: ss.fatigueScore,
  distractionLevel: ss.distractionLevel,
  emotion: ss.emotion
}));
console.log('  intervention:', d.data.intervention ? ('YES - ' + d.data.intervention.message.slice(0,40)) : 'null');
console.log('  ✅ 通过（端到端管线完整）');
"

# ========================================
# 4. analyze-face Mock 模式（验证前端无 Key 演示）
# ========================================
echo ""
echo "━━━ 4. analyze-face Mock 模式 ━━━"
echo "  （注意：本地开发默认 AI_MOCK_MODE=true，此用例应返回 mock branch）"
RESP=$(curl -s -X POST "$BASE_URL/api/ai/analyze-face" \
  -H 'Content-Type: application/json' \
  -d "{\"sessionId\":\"$SID\",\"image\":{\"url\":\"https://example.com/mock.jpg\"}}")

echo "$RESP" | node -e "
const d = JSON.parse(require('fs').readFileSync(0, 'utf8'));
console.log('  code:', d.code, '| message:', d.message);
if (d.code !== 0 || !d.data) { console.error('  ❌'); process.exit(1); }
console.log('  faceFeatures keys:', Object.keys(d.data.faceFeatures).length + ' 个');
console.log('  studyState.focusScore:', d.data.studyState.focusScore);
const isMock = d.message.toLowerCase().includes('mock');
console.log('  Mock 分支:', isMock ? 'YES ✅' : 'NO');
"

echo ""
echo "═══ 全部测试完成 ═══"
echo ""
echo "如需切回 vivo 备选方案："
echo "  修改 .env 中 DEFAULT_MODEL_PROVIDER=vivo，重启 npm start，重跑此脚本"

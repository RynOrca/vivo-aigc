#!/usr/bin/env bash
# Task 3 接口测试脚本
# 运行前请先启动后端：node backend/main.js

BASE="http://localhost:8000"

echo "=== 蓝心AI学习伴侣 后端接口测试 ==="
echo ""

# 1. 健康检查
echo "1. GET /api/health"
curl -s $BASE/api/health | python3 -m json.tool 2>/dev/null || curl -s $BASE/api/health
echo -e "\n"

# 2. 开始学习
echo "2. POST /api/study/start"
START_RESP=$(curl -s -X POST $BASE/api/study/start \
  -H "Content-Type: application/json" \
  -d '{"userId":"demo_user","taskName":"考研英语阅读","targetMinutes":45}')
echo "$START_RESP" | python3 -m json.tool 2>/dev/null || echo "$START_RESP"

# 提取 sessionId
SID=$(echo "$START_RESP" | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['sessionId'])" 2>/dev/null)
echo "   ↳ sessionId = $SID"
echo ""

# 3. 获取学习状态
echo "3. GET /api/study/state?sessionId=$SID"
curl -s "$BASE/api/study/state?sessionId=$SID" | python3 -m json.tool 2>/dev/null || curl -s "$BASE/api/study/state?sessionId=$SID"
echo -e "\n"

# 4. L2 干预
echo "4. POST /api/ai/intervention (L2)"
curl -s -X POST $BASE/api/ai/intervention \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SID\",\"focusScore\":48,\"fatigueScore\":45,\"distractionLevel\":\"L2\",\"triggerReason\":\"连续分心超过60秒\"}" \
  | python3 -m json.tool 2>/dev/null
echo -e "\n"

# 5. 休息伴聊
echo "5. POST /api/ai/rest-chat"
curl -s -X POST $BASE/api/ai/rest-chat \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SID\",\"sessionDuration\":45,\"fatigueScore\":65,\"userGoal\":\"考研英语阅读\",\"recentState\":\"疲劳偏高\"}" \
  | python3 -m json.tool 2>/dev/null
echo -e "\n"

# 6. 口头复盘
echo "6. POST /api/ai/oral-review"
curl -s -X POST $BASE/api/ai/oral-review \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SID\",\"taskName\":\"英语阅读\",\"focusScore\":78,\"distractionCount\":3,\"durationMinutes\":45}" \
  | python3 -m json.tool 2>/dev/null
echo -e "\n"

# 7. 学习日报
echo "7. POST /api/ai/report"
curl -s -X POST $BASE/api/ai/report \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SID\",\"totalMinutes\":45,\"effectiveMinutes\":38,\"averageFocusScore\":78,\"maxFatigueScore\":66,\"distractionCount\":4,\"oralReview\":\"我完成了两篇英语阅读，但第二篇错得比较多。\",\"focusCurve\":[80,82,78,65,72,85]}" \
  | python3 -m json.tool 2>/dev/null
echo -e "\n"

# 8. 结束学习
echo "8. POST /api/study/end"
curl -s -X POST $BASE/api/study/end \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SID\",\"totalMinutes\":45,\"focusHistory\":[80,82,78,65,72,85],\"distractionCount\":4,\"oralReview\":\"第二篇需要加强\"}" \
  | python3 -m json.tool 2>/dev/null
echo -e "\n"

# 9. 获取已有日报
echo "9. GET /api/study/report/$SID"
curl -s $BASE/api/study/report/$SID | python3 -m json.tool 2>/dev/null
echo ""

echo "=== 测试完成 ==="

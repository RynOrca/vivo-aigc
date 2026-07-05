/**
 * DeepSeek 专用 Prompt Builder
 *
 * 为 DeepSeek 设计的高质量 prompt：
 *   - buildFaceStatePrompt：视觉粗分类 → 数值校准（核心）
 *   - buildReportPrompt：学习数据 → 结构化日报 JSON（启用 response_format: json_object）
 *
 * intervention / rest-chat / oral-review 的文案 prompt 沿用 promptBuilder.js 现有 builder，
 * 不需要重新写。此文件仅针对 DeepSeek 特有的数值校准 + JSON Mode 输出需求。
 */

// ===== 4.1 核心：视觉特征 → 数值校准 =====

/**
 * 根据面部粗分类数据和上下文，生成给 DeepSeek 的数值校准 prompt
 *
 * @param {object} qwenRawFeatures - analyzeFace() 返回的粗分类字段
 * @param {object} ctx - 学习上下文
 * @param {number} ctx.elapsedSeconds - 已学习秒数
 * @param {number} [ctx.historicalAvgFocus] - 历史专注分均值（默认 75）
 * @param {number} [ctx.recentDistractions] - 最近干扰次数（默认 0）
 * @param {number[]} [ctx.focusScores] - 近期 focusScore 采样（默认 []）
 * @returns {string} 给 DeepSeek 的用户消息 prompt
 */
export function buildFaceStatePrompt(
  qwenRawFeatures,
  {
    elapsedSeconds = 0,
    historicalAvgFocus = 75,
    recentDistractions = 0,
    focusScores = [],
  } = {},
) {
  const recentFive = focusScores.slice(-5)
  const recentFiveStr = recentFive.length > 0 ? recentFive.join(', ') : '无'

  return `你是学习专注度校准模型。根据视觉感知模型（Qwen-VL）的粗分类输出，结合学习上下文，计算当前学习状态分数。

=== 视觉感知原始数据（来自 Qwen-VL）===
${JSON.stringify(qwenRawFeatures, null, 2)}

=== 学习上下文 ===
- 已学习时长：${elapsedSeconds} 秒
- 历史平均专注分：${historicalAvgFocus}
- 最近 5 分钟干扰次数：${recentDistractions}
- 过去 5 个 focusScore 采样：${recentFiveStr}

=== 计算规则（请参考这些思路算出数值）===
1. focusScore：
   - isUserPresent=false → 固定 0（因为人不在）
   - eyeClosedRatio>0.3 → 按比值线性扣 15~40 分
   - gazeAwaySeconds>20 → 考虑 L1 阈值；>60 → 考虑 L2
   - headDownSeconds>15 → 扣 10~20 分
   - currentAppType==="entertainment" → 直接 L3 且 focusScore<30
   - 最终分数做平滑：新分数 = 历史*0.3 + 视觉估分*0.7，然后 clamp(0, 100)

2. fatigueScore：
   - 基础 = elapsedSeconds / 60 × 2（每分钟 +2）
   - eyeClosedRatio>0.15 → +15
   - mouthOpen=true 且 mouthOpenCount>2 → +20
   - headDown 持续 >30s → +10
   - clamp(0, 100)

3. distractionLevel：
   - !isUserPresent → L3
   - currentAppType==="entertainment" → L3
   - gazeAway>=60s 或 focusScore<50 → L2
   - gazeAway>=20s 或 focusScore<70 → L1
   - else NONE

4. emotion 按 map 映射：
   - fatigueScore<40 且 distractionLevel=NONE → 'calm'
   - fatigueScore>=60 → 'tired'
   - distractionLevel 是 L2 或 L3 且疲劳不高 → 'distracted'
   - distractionLevel=L3 且 !isUserPresent → 'anxious'

请严格按以下 JSON schema 输出，不要任何其他文字（包括注释、解释、markdown 代码块）：

{
  "focusScore": <0-100 整数>,
  "fatigueScore": <0-100 整数>,
  "distractionLevel": <"NONE"/"L1"/"L2"/"L3">,
  "emotion": <"calm"/"tired"/"anxious"/"distracted">,
  "triggerReason": <触发原因的中文描述，无触发写 null>
}

只输出 JSON。`
}

// ===== 4.2 日报 Prompt（启用 JSON Mode）====

/**
 * 根据学习数据生成结构化日报 prompt
 *
 * 调用时必须传 options.response_format = { type: 'json_object' }
 * 让 DeepSeek 返回结构化 JSON，避免文本包裹格式错乱
 *
 * @param {object} ctx
 * @param {string} ctx.sessionId - 会话 ID
 * @param {number} ctx.totalMinutes - 总学习时长（分钟）
 * @param {number} ctx.effectiveMinutes - 有效学习时长（分钟）
 * @param {number} ctx.averageFocusScore - 平均专注分 0-100
 * @param {number} ctx.maxFatigueScore - 最高疲劳分 0-100
 * @param {number} ctx.distractionCount - 分心总次数
 * @param {string} [ctx.oralReview] - 用户复盘文字（可选）
 * @returns {string} 给 DeepSeek 的用户消息 prompt
 */
export function buildReportPrompt({
  sessionId = 'study_001',
  totalMinutes = 0,
  effectiveMinutes = 0,
  averageFocusScore = 70,
  maxFatigueScore = 50,
  distractionCount = 0,
  oralReview = '',
} = {}) {
  return `你是学习日报生成模型。根据用户本次学习数据，生成一份结构化学习日报。

=== 学习数据 ===
- 会话 ID: ${sessionId}
- 总学习时长: ${totalMinutes} 分钟
- 有效学习时长: ${effectiveMinutes} 分钟
- 平均专注分: ${averageFocusScore}（0-100 分制）
- 最高疲劳分: ${maxFatigueScore}
- 分心次数: ${distractionCount}
${oralReview ? `- 用户复盘: "${oralReview}"` : '- 用户复盘: （未填写）'}

=== 写前思考（你应该这样评判，不要写在输出里）===
1. 状态总结：
   - 平均 > 75 → "整体专注，效率较高"
   - 平均 60~75 → "状态中等，有波动"
   - 平均 < 60 → "状态起伏，需要调整策略"
2. 优点：
   - 长时间 >= 45min → "能坚持较长时间的自律学习"
   - 有效学习占比 > 80% → "专注时间利用率高"
   - 复盘具体 → "主动复盘，学习态度好"
   - 否则 → "完成了既定的学习计划"
3. 问题：
   - 分心 > 3 → "分心次数偏多，建议减少干扰源"
   - 最高疲劳 >= 70 → "疲劳指数较高，建议提前安排休息"
   - 长时间 >= 45 但疲劳高 → "长时间学习导致疲劳积累，建议拆分成 25 分钟单元"
   - 否则 → "保持当前学习节奏"
4. 建议：
   - 不要少于 2 条建议
   - 每条建议可操作、具体、下次能用
5. 鼓励语：
   - 1 句话
   - 温暖、激励、不要空泛

请严格按以下 JSON schema 输出，不要任何其他文字：

{
  "summary": "一句话总结本次学习状态",
  "advantage": "本次学习最突出的 1 个优点",
  "problem": "本次学习最值得改进的 1 个问题",
  "suggestions": [
    "建议 1（可操作、具体）",
    "建议 2（可操作、具体）"
  ],
  "encouragement": "一句温暖鼓励的话"
}

只输出 JSON。`
}

// ===== 常用 System Prompt =====

export const CALIBRATION_SYSTEM_PROMPT =
  '你是一个学习状态感知校准模型。你将收到视觉模型识别的面部粗分类数据和上下文，需要按规则计算出标准数值。严格按用户消息中的 schema 输出 JSON，不要任何解释。'

export const REPORT_SYSTEM_PROMPT =
  '你是一个 AI 学习日报生成模型。你将收到学习数据，需要按规则生成结构化学习日报。严格按用户消息中的 schema 输出 JSON，不要任何解释。'

export default {
  buildFaceStatePrompt,
  buildReportPrompt,
  CALIBRATION_SYSTEM_PROMPT,
  REPORT_SYSTEM_PROMPT,
}

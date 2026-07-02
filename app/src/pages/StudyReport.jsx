import React from 'react'
import { generateReport } from '../data/reportMock.js'

/** 格式化分钟 */
function fmtMin(m) {
  if (m < 60) return `${m}min`
  const h = Math.floor(m / 60)
  const rm = m % 60
  return rm > 0 ? `${h}h ${rm}min` : `${h}h`
}

export default function StudyReport({ totalMinutes, focusHistory, distractionCount, oralReview, onBackHome }) {
  const report = generateReport({ totalMinutes, focusHistory, distractionCount, oralReview })

  return (
    <div className="flex flex-col h-full">
      {/* 头部 — 珊瑚粉 */}
      <div className="bg-[#db7688] h-[130px] px-6 py-4 rounded-b-[40px] relative z-10 flex flex-col items-center justify-center gap-1">
        <p className="text-white/70 text-sm">学习日报</p>
        <p className="text-white text-[28px] font-extrabold tracking-wide leading-none">
          {report.summary.slice(0, 12)}...
        </p>
      </div>

      {/* 日报内容 — 可滚动 */}
      <div className="px-6 pt-4 pb-4 relative z-10 bg-[#f7f8ec] flex-1 overflow-y-auto">
        {/* 核心数据 */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#e8ede3] rounded-[22px] px-4 py-3 text-center">
            <p className="text-[28px] font-extrabold text-[#3f7b73] leading-none mb-1">
              {fmtMin(report.totalMinutes)}
            </p>
            <p className="text-xs text-[#666]">学习时长</p>
          </div>
          <div className="bg-[#e8ede3] rounded-[22px] px-4 py-3 text-center">
            <p className="text-[28px] font-extrabold text-[#3f7b73] leading-none mb-1">
              {fmtMin(report.effectiveMinutes)}
            </p>
            <p className="text-xs text-[#666]">有效学习</p>
          </div>
          <div className="bg-[#f2e3e1] rounded-[22px] px-4 py-3 text-center">
            <p className="text-[28px] font-extrabold text-[#db7688] leading-none mb-1">
              {report.averageFocusScore}
            </p>
            <p className="text-xs text-[#666]">平均专注分</p>
          </div>
          <div className="bg-[#f2e3e1] rounded-[22px] px-4 py-3 text-center">
            <p className="text-[28px] font-extrabold text-[#db7688] leading-none mb-1">
              {report.distractionCount}
            </p>
            <p className="text-xs text-[#666]">分心次数</p>
          </div>
        </div>

        {/* AI 总结 */}
        <div className="bg-white rounded-[22px] px-5 py-4 border border-[#e8ede3] mb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 bg-[#db7688] rounded-full flex justify-center items-center">
              <span className="text-white text-xs">AI</span>
            </div>
            <span className="text-xs text-[#999]">总结</span>
          </div>
          <p className="text-sm text-[#1a1a1a] leading-relaxed">{report.summary}</p>
        </div>

        {/* 复盘 */}
        {oralReview && (
          <div className="bg-white rounded-[22px] px-5 py-4 border border-[#e8ede3] mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs text-[#999]">📝 你的复盘</span>
            </div>
            <p className="text-sm text-[#555] leading-relaxed italic">
              "{oralReview}"
            </p>
          </div>
        )}

        {/* 优点 + 问题 */}
        <div className="flex gap-3 mb-3">
          <div className="flex-1 bg-[#e8ede3] rounded-[22px] px-4 py-3">
            <p className="text-xs text-[#3f7b73] font-bold mb-1">👍 做得好的</p>
            <p className="text-xs text-[#555] leading-relaxed">{report.advantage}</p>
          </div>
          <div className="flex-1 bg-[#f2e3e1] rounded-[22px] px-4 py-3">
            <p className="text-xs text-[#db7688] font-bold mb-1">🔧 可优化</p>
            <p className="text-xs text-[#555] leading-relaxed">{report.problem}</p>
          </div>
        </div>

        {/* 建议 */}
        <div className="bg-white rounded-[22px] px-5 py-4 border border-[#e8ede3] mb-3">
          <p className="text-xs text-[#999] font-bold mb-2">💡 下次建议</p>
          {report.suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2 mb-1.5 last:mb-0">
              <span className="text-[#3f7b73] text-xs mt-0.5">◆</span>
              <p className="text-xs text-[#555] leading-relaxed">{s}</p>
            </div>
          ))}
        </div>

        {/* 鼓励语 */}
        <div className="bg-[#e8b65e]/20 rounded-[22px] px-5 py-4 text-center mb-4">
          <p className="text-sm font-bold text-[#1a1a1a] leading-relaxed">
            🌟 {report.encouragement}
          </p>
        </div>

        {/* 回到首页 */}
        <button
          onClick={onBackHome}
          className="w-full bg-[#558d88] text-white py-3 rounded-full text-sm font-bold hover:bg-[#4a7d78] transition active:scale-95 mb-2"
        >
          回到首页
        </button>
      </div>
    </div>
  )
}

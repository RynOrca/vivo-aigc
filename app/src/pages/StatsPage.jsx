import React, { useEffect, useState } from 'react'
import { useAppState } from '../data/AppContext.jsx'

/**
 * 历史统计页 — 完全复用前端参考.jsx ScreenTwo 的布局和样式
 * 三卡片 + 大百分比 + SVG 折线图 + 渐变底部
 */

/* 图标组件 — 模板原样 */
const ActivityIcon = ({ stroke = '#3f7b73' }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
  </svg>
)

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

/** 数字跳动动画 */
function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    let start = 0
    const step = Math.ceil(target / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setValue(target); clearInterval(timer) }
      else setValue(start)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return value
}

export default function StatsPage({ onBack }) {
  const { totalSessions, totalMinutes, streakDays, averageFocusScore, totalFocusScores } = useAppState()

  const totalHours = Math.round(totalMinutes / 60)
  const displaySessions = useCountUp(totalSessions)
  const displayHours = useCountUp(totalHours)
  const displayStreak = useCountUp(streakDays)
  const displayFocus = useCountUp(averageFocusScore)

  // 专注趋势：取最近 5 个采样点，不足则用模拟数据补
  const recentScores = totalFocusScores.slice(-5)
  const focusTrend = recentScores.length >= 3
    ? recentScores
    : [72, 80, 65, 85, averageFocusScore || 78]
  const dayLabels = ['周一', '周二', '周三', '周四', '周五']
  const highlightDay = Math.min(focusTrend.length - 1, 4)

  // SVG 坐标映射
  const svgW = 400
  const svgH = 160
  const padding = 30
  const chartW = svgW - padding * 2
  const chartH = svgH - padding - 20
  const maxVal = 100
  const minVal = 50

  const points = focusTrend.map((v, i) => {
    const x = padding + (i / (focusTrend.length - 1)) * chartW
    const y = padding + ((maxVal - v) / (maxVal - minVal)) * chartH
    return `${x},${y}`
  })

  const pathD = points.map((p, i) => (i === 0 ? `M ${p}` : `L ${p}`)).join(' ')

  const highlightX = padding + (highlightDay / (focusTrend.length - 1)) * chartW

  return (
    <div className="flex flex-col h-full bg-[#f7f8ec]">
      {/* 头部 — 模板 ScreenTwo 样式 */}
      <div className="flex justify-between items-start px-6 pt-6 mb-4">
        <div>
          <h1 className="text-2xl text-[#1a1a1a] font-bold mb-1">
            学习统计
          </h1>
          <p className="text-sm text-[#888]">最近一周</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 bg-[#e5e6da] rounded-full flex justify-center items-center text-[#1a1a1a] hover:bg-[#d5d6ca] transition">
            <SearchIcon />
          </button>
          <button
            onClick={onBack}
            className="w-10 h-10 bg-[#db7688] rounded-full flex justify-center items-center text-white text-sm font-bold hover:bg-[#c96a7a] transition"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 三卡片模块 — 完全复用模板 */}
      <div className="flex justify-between px-6 mb-8">
        {/* 总次数 */}
        <div className="flex flex-col items-center w-[30%] relative">
          <div className="absolute top-0 w-full h-[110px] bg-[#e8ede3] rounded-[40px] z-0" />
          <div className="relative z-10 flex flex-col items-center pt-3">
            <div className="w-9 h-9 rounded-full bg-white border border-[#1a1a1a] flex justify-center items-center mb-3">
              <ActivityIcon />
            </div>
            <div className="text-[28px] font-extrabold text-[#1a1a1a] mb-5">{displaySessions}</div>
            <div className="text-xs text-[#666] font-medium">学习次数</div>
          </div>
        </div>

        {/* 总时长 */}
        <div className="flex flex-col items-center w-[30%] relative">
          <div className="absolute top-0 w-full h-[110px] bg-[#f2e3e1] rounded-[40px] z-0" />
          <div className="relative z-10 flex flex-col items-center pt-3">
            <div className="w-9 h-9 rounded-full bg-[#eab45c] flex justify-center items-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="text-[28px] font-extrabold text-[#1a1a1a] mb-5">{displayHours}h</div>
            <div className="text-xs text-[#666] font-medium">总时长</div>
          </div>
        </div>

        {/* 连续天数 */}
        <div className="flex flex-col items-center w-[30%] relative">
          <div className="absolute top-0 w-full h-[110px] border-[1.5px] border-dashed border-[#ccc] rounded-[40px] z-0" />
          <div className="relative z-10 flex flex-col items-center pt-3">
            <div className="w-9 h-9 rounded-full bg-white border border-[#1a1a1a] flex justify-center items-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <div className="text-[28px] font-extrabold text-[#1a1a1a] mb-5">{displayStreak}</div>
            <div className="text-xs text-[#666] font-medium">连续天数</div>
          </div>
        </div>
      </div>

      {/* 平均专注分 + 详情链接 — 模板原样 */}
      <div className="flex justify-between items-center px-6 mb-6">
        <div>
          <h2 className="text-[64px] font-extrabold text-[#1a1a1a] leading-none tracking-tighter">{displayFocus}%</h2>
          <p className="text-sm text-[#1a1a1a] font-bold">平均专注分</p>
        </div>
        <div className="text-center">
          <button className="w-10 h-10 rounded-full border border-[#ccc] flex justify-center items-center mx-auto mb-2 hover:bg-gray-100 transition">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
          <p className="text-[13px] font-bold text-[#1a1a1a] cursor-pointer">详情</p>
        </div>
      </div>

      {/* 折线图区域 — 完全复用模板的渐变 + SVG + 坐标轴 */}
      <div className="flex-1 bg-gradient-to-b from-[#f3d7dc] to-[#f7f8ec] -mx-0 px-6 pt-6 border-t-2 border-[#ebbec6]">
        <div className="flex justify-between text-sm font-bold text-[#1a1a1a] mb-4">
          <span>专注趋势</span>
          <span>本周</span>
        </div>

        <div className="relative h-[160px] w-full">
          {/* 高亮竖线 */}
          <div
            style={{ left: `${(highlightX / svgW) * 100}%` }}
            className="absolute bottom-[-16px] -translate-x-1/2 w-0.5 h-[160px] border-l border-dashed border-[#db7688]/70 z-10"
          />

          {/* 百分比气泡 */}
          <div
            style={{ left: `${(highlightX / svgW) * 100}%` }}
            className="absolute top-2 -translate-x-1/2 bg-[#1a1a1a] text-white px-4 py-2 rounded-full text-base font-bold z-20 shadow-lg"
          >
            {averageFocusScore || 78}%
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#1a1a1a]" />
          </div>

          {/* 数据波动标签 — 模板原样 */}
          <div className="absolute top-[60px] left-[20%] bg-white/60 rounded-full px-3 py-1 text-xs font-bold text-[#666] z-10">+8</div>
          <div className="absolute bottom-[10px] left-[50%] bg-white/60 rounded-full px-3 py-1 text-xs font-bold text-[#666] z-10">-15</div>
          <div className="absolute top-[30px] right-[5%] bg-white/60 rounded-full px-3 py-1 text-xs font-bold text-[#666] z-10">+20</div>

          <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-full" preserveAspectRatio="none">
            {/* 网格线 */}
            {[100, 200, 300].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2={svgH} stroke="#ccc" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.5" />
            ))}
            {/* 高亮网格线 */}
            <line x1={highlightX} y1="0" x2={highlightX} y2={svgH} stroke="#db7688" strokeWidth="1" strokeDasharray="4 4" />

            {/* 折线 */}
            <path d={pathD} fill="none" stroke="#db7688" strokeWidth="5" strokeLinecap="round" />

            {/* 高亮节点 */}
            <circle cx={highlightX} cy={padding + ((maxVal - focusTrend[highlightDay]) / (maxVal - minVal)) * chartH} r="6" fill="#fff" stroke="#1a1a1a" strokeWidth="3" />
          </svg>
        </div>

        {/* X 轴标签 — 模板原样的月份→改为日期 */}
        <div className="flex justify-between px-2 mt-3 text-xs text-[#666] font-medium">
          {dayLabels.map((label, i) => (
            <span
              key={i}
              className={i === highlightDay ? 'text-[#1a1a1a] font-bold border border-[#1a1a1a] px-3 py-0.5 rounded-full' : ''}
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

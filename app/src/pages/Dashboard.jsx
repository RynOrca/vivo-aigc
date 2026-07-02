import React, { useEffect, useState } from 'react'
import DashboardHeader from '../components/DashboardHeader.jsx'
import { dashboardData } from '../data/mockData.js'
import { useAppState } from '../data/AppContext.jsx'

/* 学习时长图标 */
const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3f7b73" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
)

/* 有效学习图标 */
const FocusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#db7688" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

/** 格式化分钟为 "Xh Xm" */
function formatMinutes(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  return `${h}h ${m}m`
}

/** 数字跳动动画 hook */
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

export default function Dashboard({ onStartStudy, onGoStats, onGoSettings }) {
  const { userName, currentDate } = dashboardData
  const { todayStudyMinutes, todayEffectiveMinutes, todaySessions } = useAppState()

  const displayStudy = useCountUp(todayStudyMinutes)
  const displayEffective = useCountUp(todayEffectiveMinutes)

  const aiEncouragement = todaySessions > 0
    ? `今天已经完成了 ${todaySessions} 次学习，累计 ${todayStudyMinutes} 分钟。状态不错，继续保持！ 💪`
    : '准备好开始今天的学习了吗？我会一直陪着你 💪'

  return (
    <>
      {/* 头部 — 珊瑚粉区域 */}
      <DashboardHeader userName={userName} currentDate={currentDate} />

      {/* 数据概览 + AI 鼓励区域 */}
      <div className="px-6 pt-4 relative z-10 bg-[#f7f8ec]">
        <h2 className="text-[32px] font-extrabold text-[#1a1a1a] leading-tight mb-3 tracking-tight">
          今日学习
        </h2>

        {/* 两张数据卡片 */}
        <div className="flex gap-4 mb-3">
          {/* 学习时长 */}
          <div className="flex-1 flex items-center gap-3 bg-[#e8ede3] rounded-[28px] px-4 py-3">
            <div className="w-10 h-10 bg-white rounded-full flex justify-center items-center shrink-0">
              <ClockIcon />
            </div>
            <div>
              <p className="text-xs text-[#666] mb-0.5">学习时长</p>
              <h4 className="text-lg font-bold text-[#3f7b73]">
                {formatMinutes(displayStudy)}
              </h4>
            </div>
          </div>

          {/* 有效时长 */}
          <div className="flex-1 flex items-center gap-3 bg-[#f2e3e1] rounded-[28px] px-4 py-3">
            <div className="w-10 h-10 bg-white rounded-full flex justify-center items-center shrink-0">
              <FocusIcon />
            </div>
            <div>
              <p className="text-xs text-[#666] mb-0.5">有效学习</p>
              <h4 className="text-lg font-bold text-[#db7688]">
                {formatMinutes(displayEffective)}
              </h4>
            </div>
          </div>
        </div>

        {/* 快捷入口：统计 + 设置 */}
        <div className="flex gap-3 mb-3">
          <button
            onClick={onGoStats}
            className="flex-1 flex items-center gap-2 bg-white rounded-[20px] px-4 py-2.5 border border-[#e8ede3] hover:bg-[#f9f9f9] transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3f7b73" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            <span className="text-xs text-[#3f7b73] font-medium">学习统计</span>
          </button>
          <button
            onClick={onGoSettings}
            className="flex items-center gap-2 bg-white rounded-[20px] px-4 py-2.5 border border-[#e8ede3] hover:bg-[#f9f9f9] transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#db7688" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            <span className="text-xs text-[#db7688] font-medium">设置</span>
          </button>
        </div>

        {/* AI 鼓励语卡片 */}
        <div className="bg-white rounded-[28px] px-5 py-3 border border-[#e8ede3]">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[#db7688] rounded-full flex justify-center items-center shrink-0 mt-0.5">
              <span className="text-white text-sm">AI</span>
            </div>
            <p className="text-sm text-[#555] leading-relaxed">
              {aiEncouragement}
            </p>
          </div>
        </div>
      </div>

      {/* 底部区域 — 复用模板的金色→绿色渐变 + 圆角模式 */}
      <div className="absolute bottom-0 left-0 w-full h-[330px] bg-[#e8b65e] rounded-t-[100px] overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-[235px] bg-[#558d88] rounded-t-[80px] flex flex-col items-center justify-center gap-4 pt-4">
          {/* 装饰文字 */}
          <p className="text-white/80 text-sm px-10 text-center leading-relaxed">
            蓝心 AI 会全程陪伴，实时检测你的学习状态
          </p>

          {/* 开始专注按钮 — 大圆形播放按钮风格 */}
          <button
            className="w-24 h-24 bg-[#6a9f99] rounded-full flex justify-center items-center border-[8px] border-white/20 hover:scale-105 transition-transform active:scale-95 cursor-pointer"
            onClick={onStartStudy}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="#fff">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          </button>

          <p className="text-white font-bold text-lg tracking-wide">
            开始专注
          </p>
        </div>
      </div>
    </>
  )
}

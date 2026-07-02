import React, { useState, useEffect, useRef } from 'react'
import ArcProgress from '../components/ArcProgress.jsx'
import InterventionModal from '../components/InterventionModal.jsx'
import { generateStudyState } from '../data/studyMock.js'
import { generateIntervention } from '../data/interventionMock.js'

/** 格式化秒数为 HH:MM:SS */
function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

const distLabelMap = {
  NONE: '正常',
  L1: '轻微分心',
  L2: '连续分心',
  L3: '严重分心',
}

export default function StudyPage({ onEndStudy }) {
  const [elapsed, setElapsed] = useState(0)
  const [state, setState] = useState(() => generateStudyState(0))
  const [intervention, setIntervention] = useState(null)
  const timerRef = useRef(null)
  const prevLevelRef = useRef('NONE')
  const lastInterventionRef = useRef(0)
  const focusHistoryRef = useRef([])
  const distractionCountRef = useRef(0)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1
        // 每 3 秒更新一次状态模拟
        if (next % 3 === 0) {
          setState((currentState) => {
            const newState = generateStudyState(next)

            // 每 5 秒采样专注分
            if (next % 5 === 0) {
              focusHistoryRef.current.push(newState.focusScore)
            }

            // 分心等级变化 → 触发干预
            const prevLevel = prevLevelRef.current
            const newLevel = newState.distractionLevel
            if (
              newLevel !== 'NONE' &&
              newLevel !== prevLevel &&
              // 冷却期：同一等级 15 秒内不重复触发
              next - lastInterventionRef.current > 15
            ) {
              lastInterventionRef.current = next
              setIntervention(generateIntervention(newState.sessionId, newLevel))
            }
            prevLevelRef.current = newLevel
            distractionCountRef.current = newState.distractionCount

            return newState
          })
        }
        return next
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [])

  const handleEndStudy = () => {
    clearInterval(timerRef.current)
    const totalMinutes = Math.round(elapsed / 60)
    onEndStudy({
      totalMinutes: Math.max(1, totalMinutes),
      focusHistory: [...focusHistoryRef.current],
      distractionCount: distractionCountRef.current,
    })
  }

  const { focusScore, fatigueScore, distractionLevel, distractionCount } = state

  return (
    <>
      {/* 头部 — 珊瑚粉，稍短 */}
      <div className="bg-[#db7688] h-[160px] px-6 py-5 rounded-b-[40px] relative z-10 flex flex-col items-center justify-center gap-1">
        <p className="text-white/70 text-sm">专注学习中</p>
        <p className="text-white text-[42px] font-extrabold tracking-widest leading-none">
          {formatTime(elapsed)}
        </p>
        <p className="text-white/60 text-xs">
          {distLabelMap[distractionLevel] || '正常'}
        </p>
      </div>

      {/* 中间内容 */}
      <div className="px-6 pt-4 relative z-10 bg-[#f7f8ec]">
        <h2 className="text-[32px] font-extrabold text-[#1a1a1a] leading-tight mb-2 tracking-tight">
          学习状态
        </h2>

        {/* 数据卡片 */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1 flex items-center gap-3 bg-[#f2e3e1] rounded-[28px] px-4 py-3">
            <div className="w-10 h-10 bg-white rounded-full flex justify-center items-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#db7688" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[#666] mb-0.5">疲劳指数</p>
              <h4 className="text-lg font-bold text-[#db7688]">{fatigueScore}</h4>
            </div>
          </div>

          <div className="flex-1 flex items-center gap-3 bg-[#e8ede3] rounded-[28px] px-4 py-3">
            <div className="w-10 h-10 bg-white rounded-full flex justify-center items-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3f7b73" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-[#666] mb-0.5">分心次数</p>
              <h4 className="text-lg font-bold text-[#3f7b73]">{distractionCount}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* 底部区域 — 金色→绿色 + 圆弧进度 */}
      <div className="absolute bottom-0 left-0 w-full h-[390px] bg-[#e8b65e] rounded-t-[100px] overflow-hidden">
        <div className="absolute bottom-0 left-0 w-full h-[285px] bg-[#558d88] rounded-t-[80px] flex flex-col items-center justify-center gap-2 pt-4">
          {/* 圆弧进度 — 展示专注分 */}
          <ArcProgress
            percentage={focusScore}
            label={String(focusScore)}
            subLabel="专注分"
          />

          {/* 状态文字 */}
          <p className="text-white/60 text-xs mt-1">
            {focusScore > 70 ? '👍 状态不错，继续保持' : '💡 试着把注意力拉回来'}
          </p>

          {/* 结束学习按钮 */}
          <button
            className="w-20 h-20 bg-[#db7688] rounded-full flex justify-center items-center border-[6px] border-white/20 hover:scale-105 transition-transform active:scale-95 cursor-pointer mt-2"
            onClick={handleEndStudy}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>

          <p className="text-white font-bold text-sm tracking-wide">
            结束学习
          </p>
        </div>
      </div>

      {/* 分级干预弹窗 */}
      <InterventionModal
        event={intervention}
        onDismiss={() => setIntervention(null)}
      />
    </>
  )
}

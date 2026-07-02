import React, { useState, useEffect, useRef, useCallback } from 'react'
import ArcProgress from '../components/ArcProgress.jsx'
import InterventionModal from '../components/InterventionModal.jsx'

/*
 * ==== Task 2 / Task 3 集成时 ====
 * 替换下面两行为:
 *   import { getStudyState, requestIntervention } from '../data/api.js'
 * 并将 MOCK_MODE 改为 false（在 api.js 中）
 */
import { generateStudyState } from '../data/studyMock.js'
import { generateIntervention } from '../data/interventionMock.js'

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

const distLabelMap = {
  NONE: '正常', L1: '轻微分心', L2: '连续分心', L3: '严重分心',
}

export default function StudyPage({ onEndStudy }) {
  const [elapsed, setElapsed] = useState(0)
  const [state, setState] = useState(() => generateStudyState(0))
  const [intervention, setIntervention] = useState(null)
  const [isPaused, setIsPaused] = useState(false)
  const [selfieMode, setSelfieMode] = useState(false)
  const timerRef = useRef(null)
  const prevLevelRef = useRef('NONE')
  const lastInterventionRef = useRef(0)
  const focusHistoryRef = useRef([])
  const distractionCountRef = useRef(0)
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  // 计时器
  useEffect(() => {
    if (isPaused) return
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1
        if (next % 3 === 0) {
          setState((currentState) => {
            const newState = generateStudyState(next)
            if (next % 5 === 0) focusHistoryRef.current.push(newState.focusScore)
            const prevLevel = prevLevelRef.current
            const newLevel = newState.distractionLevel
            if (newLevel !== 'NONE' && newLevel !== prevLevel && next - lastInterventionRef.current > 15) {
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
  }, [isPaused])

  // 自拍模式 — 启停摄像头
  useEffect(() => {
    if (selfieMode) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 480, height: 640 } })
        .then((stream) => {
          streamRef.current = stream
          if (videoRef.current) videoRef.current.srcObject = stream
        })
        .catch(() => {
          setSelfieMode(false)
          alert('无法访问摄像头，已切回普通模式')
        })
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
    }
  }, [selfieMode])

  const handleEndStudy = useCallback(() => {
    clearInterval(timerRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    const totalMinutes = Math.round(elapsed / 60)
    onEndStudy({
      totalMinutes: Math.max(1, totalMinutes),
      focusHistory: [...focusHistoryRef.current],
      distractionCount: distractionCountRef.current,
    })
  }, [elapsed, onEndStudy])

  const { focusScore, fatigueScore, distractionLevel, distractionCount } = state

  return (
    <>
      {/* ===== 摄像头背景（自拍模式）===== */}
      {selfieMode && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover z-0 rounded-[40px]"
          style={{ transform: 'scaleX(-1)' }}
        />
      )}

      {/* ===== 头部 ===== */}
      <div
        className={`${
          selfieMode
            ? 'h-[80px] rounded-b-[28px] bg-[#db7688]/85 backdrop-blur-sm'
            : 'h-[160px] rounded-b-[40px] bg-[#db7688]'
        } px-6 py-3 relative z-20 flex flex-col items-center justify-center gap-0.5 transition-all duration-300`}
      >
        <p className={`${selfieMode ? 'text-xs' : 'text-sm'} text-white/70`}>
          {isPaused ? '已暂停' : '专注学习中'}
        </p>
        <p className={`text-white font-extrabold tracking-widest leading-none ${selfieMode ? 'text-[30px]' : 'text-[42px]'}`}>
          {formatTime(elapsed)}
        </p>
        {!selfieMode && (
          <p className="text-white/60 text-xs">
            {distLabelMap[distractionLevel] || '正常'}
          </p>
        )}
      </div>

      {/* ===== 普通模式：中间内容 ===== */}
      {!selfieMode && (
        <div className="px-6 pt-4 relative z-10 bg-[#f7f8ec]">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-[32px] font-extrabold text-[#1a1a1a] leading-tight tracking-tight">
              学习状态
            </h2>
            {/* 自拍模式开关 */}
            <button
              onClick={() => setSelfieMode(true)}
              className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 border border-[#ddd] text-xs text-[#999] hover:text-[#db7688] hover:border-[#db7688] transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              自拍
            </button>
          </div>

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
                  <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-[#666] mb-0.5">分心次数</p>
                <h4 className="text-lg font-bold text-[#3f7b73]">{distractionCount}</h4>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 自拍模式：左右浮动小窗 ===== */}
      {selfieMode && (
        <>
          {/* 左 — 疲劳指数 */}
          <div className="absolute left-3 top-[120px] z-20 bg-white/85 backdrop-blur-sm rounded-[20px] px-3 py-2.5 shadow-lg border border-white/30 flex flex-col items-center gap-0.5 w-[65px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#db7688" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <span className="text-lg font-extrabold text-[#db7688] leading-none">{fatigueScore}</span>
            <span className="text-[9px] text-[#999]">疲劳</span>
          </div>

          {/* 右 — 分心次数 */}
          <div className="absolute right-3 top-[120px] z-20 bg-white/85 backdrop-blur-sm rounded-[20px] px-3 py-2.5 shadow-lg border border-white/30 flex flex-col items-center gap-0.5 w-[65px]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3f7b73" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            <span className="text-lg font-extrabold text-[#3f7b73] leading-none">{distractionCount}</span>
            <span className="text-[9px] text-[#999]">分心</span>
          </div>

          {/* 分心状态标签 */}
          <div className="absolute top-[108px] left-1/2 -translate-x-1/2 z-20 bg-white/70 backdrop-blur-sm rounded-full px-3 py-0.5 text-[10px] text-[#555]">
            {distLabelMap[distractionLevel] || '正常'}
          </div>

          {/* 退出自拍 */}
          <button
            onClick={() => setSelfieMode(false)}
            className="absolute top-[88px] right-3 z-20 w-7 h-7 bg-black/30 backdrop-blur-sm rounded-full flex justify-center items-center text-white text-xs"
          >
            ✕
          </button>
        </>
      )}

      {/* ===== 普通模式：底部金绿区域 + 圆弧进度 ===== */}
      {!selfieMode && (
        <div className="absolute bottom-0 left-0 w-full h-[390px] bg-[#e8b65e] rounded-t-[100px] overflow-hidden z-10">
          <div className="absolute bottom-0 left-0 w-full h-[285px] bg-[#558d88] rounded-t-[80px] flex flex-col items-center justify-center gap-2 pt-4">
            <ArcProgress percentage={focusScore} label={String(focusScore)} subLabel="专注分" />
            <p className="text-white/60 text-xs mt-1">
              {focusScore > 70 ? '👍 状态不错，继续保持' : '💡 试着把注意力拉回来'}
            </p>

            {/* 按钮组 */}
            <div className="flex items-center gap-4 mt-2">
              {/* 暂停/继续 */}
              <button
                className="w-14 h-14 bg-white/20 rounded-full flex justify-center items-center border-[4px] border-white/20 hover:scale-105 transition-transform active:scale-95 cursor-pointer"
                onClick={() => setIsPaused(!isPaused)}
              >
                {isPaused ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                    <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
                  </svg>
                )}
              </button>

              {/* 结束 */}
              <button
                className="w-20 h-20 bg-[#db7688] rounded-full flex justify-center items-center border-[6px] border-white/20 hover:scale-105 transition-transform active:scale-95 cursor-pointer"
                onClick={handleEndStudy}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            </div>

            <p className="text-white font-bold text-sm tracking-wide">
              {isPaused ? '继续学习' : '结束学习'}
            </p>
          </div>
        </div>
      )}

      {/* ===== 自拍模式：底部按钮栏 ===== */}
      {selfieMode && (
        <div className="absolute bottom-0 left-0 w-full h-[120px] bg-gradient-to-t from-black/50 to-transparent z-20 flex items-end justify-center gap-6 pb-6">
          {/* 暂停/继续 */}
          <button
            className="w-14 h-14 bg-white/25 backdrop-blur-sm rounded-full flex justify-center items-center border-2 border-white/30 hover:scale-105 transition-transform active:scale-95 cursor-pointer"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                <rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" />
              </svg>
            )}
          </button>

          {/* 结束 */}
          <button
            className="w-16 h-16 bg-[#db7688]/90 rounded-full flex justify-center items-center border-[4px] border-white/30 hover:scale-105 transition-transform active:scale-95 cursor-pointer"
            onClick={handleEndStudy}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        </div>
      )}

      {/* 干预弹窗 — 始终在最顶层 */}
      <InterventionModal
        event={intervention}
        onDismiss={() => setIntervention(null)}
      />
    </>
  )
}

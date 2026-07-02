import React, { useEffect, useState } from 'react'

/**
 * 分级干预弹窗 — L1 Toast / L2 卡片弹窗 / L3 强提醒
 * 完全复用前端参考.jsx 的色彩体系
 */

/* 关闭图标 */
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

/* L1: 顶部 Toast — 轻提示，3 秒自动消失 */
function L1Toast({ event, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div className="absolute top-4 left-4 right-4 z-50 animate-slide-down">
      <div className="bg-white/95 backdrop-blur rounded-[20px] px-4 py-3 shadow-lg border border-[#e8ede3] flex items-start gap-3">
        <div className="w-8 h-8 bg-[#e8ede3] rounded-full flex justify-center items-center shrink-0 mt-0.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3f7b73" strokeWidth="2">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-[#1a1a1a] mb-0.5">{event.title}</p>
          <p className="text-xs text-[#666] leading-relaxed">{event.message}</p>
        </div>
        <button onClick={onDismiss} className="text-[#999] hover:text-[#555] shrink-0">
          <CloseIcon />
        </button>
      </div>
    </div>
  )
}

/* L2: 中央卡片弹窗 — 需要点击确认 */
function L2Popup({ event, onDismiss }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-[32px] px-6 pt-8 pb-6 mx-8 shadow-2xl border border-[#e8ede3] w-full max-w-[300px] text-center animate-scale-in">
        {/* 图标 */}
        <div className="w-16 h-16 bg-[#f2e3e1] rounded-full flex justify-center items-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#db7688" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h3 className="text-lg font-bold text-[#1a1a1a] mb-2">{event.title}</h3>
        <p className="text-sm text-[#666] leading-relaxed mb-1">{event.message}</p>
        <p className="text-xs text-[#999] mb-6">建议：{event.action}</p>

        <button
          onClick={onDismiss}
          className="w-full bg-[#db7688] text-white py-3 rounded-full text-sm font-bold hover:bg-[#c96a7a] transition active:scale-95"
        >
          知道了，继续学习
        </button>
      </div>
    </div>
  )
}

/* L3: 全屏强提醒 — 必须点击确认 */
function L3Overlay({ event, onDismiss }) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-end bg-black/40 backdrop-blur-sm px-6 pb-12">
      <div className="bg-white rounded-[40px] px-6 pt-10 pb-8 w-full shadow-2xl text-center animate-scale-in">
        {/* 图标 */}
        <div className="w-20 h-20 bg-[#db7688] rounded-full flex justify-center items-center mx-auto mb-5">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>

        <h3 className="text-xl font-extrabold text-[#1a1a1a] mb-3">{event.title}</h3>
        <p className="text-sm text-[#666] leading-relaxed mb-1">{event.message}</p>
        <p className="text-xs text-[#999] mb-8">{event.triggerReason}</p>

        <button
          onClick={onDismiss}
          className="w-full bg-[#db7688] text-white py-4 rounded-full text-base font-bold hover:bg-[#c96a7a] transition active:scale-95"
        >
          {event.action}
        </button>

        <button
          onClick={onDismiss}
          className="w-full text-[#999] py-2 text-sm mt-2 hover:text-[#555] transition"
        >
          继续学习
        </button>
      </div>
    </div>
  )
}

/**
 * 主组件 — 根据 level 渲染对应样式
 * @param {object} event - InterventionEvent | null
 * @param {function} onDismiss - 关闭回调
 */
export default function InterventionModal({ event, onDismiss }) {
  if (!event) return null

  switch (event.level) {
    case 'L1':
      return <L1Toast event={event} onDismiss={onDismiss} />
    case 'L2':
      return <L2Popup event={event} onDismiss={onDismiss} />
    case 'L3':
      return <L3Overlay event={event} onDismiss={onDismiss} />
    default:
      return null
  }
}


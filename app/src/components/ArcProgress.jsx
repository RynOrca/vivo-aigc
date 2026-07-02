import React from 'react'

/**
 * 圆弧进度条 — 完全复用前端参考.jsx 的 SVG 弧形进度条
 * 圆心 (140,120)，半径 110，半圆弧从左到右
 *
 * @param {number} percentage - 0-100 的进度百分比
 * @param {string} label - 中心显示的文字（如 "78"）
 * @param {string} subLabel - 下方小字（如 "专注分"）
 */
export default function ArcProgress({ percentage = 0, label = '', subLabel = '' }) {
  const ratio = Math.min(Math.max(percentage / 100, 0), 1)
  const angleInRadians = Math.PI - ratio * Math.PI
  const dotX = 140 + 110 * Math.cos(angleInRadians)
  const dotY = 120 - 110 * Math.sin(angleInRadians)

  return (
    <div className="w-[280px] h-[140px] relative mx-auto">
      <svg viewBox="0 0 280 140" className="overflow-visible w-full h-full">
        {/* 灰色背景轨道 */}
        <path
          d="M 30 120 A 110 110 0 0 1 250 120"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        {/* 白色进度轨道 — pathLength="100" 直接百分比映射 */}
        <path
          d="M 30 120 A 110 110 0 0 1 250 120"
          fill="none"
          stroke="#fff"
          strokeWidth="10"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray={`${percentage} 100`}
        />
        {/* 进度指示圆点 */}
        <circle
          cx={dotX}
          cy={dotY}
          r="10"
          fill="#1a1a1a"
          stroke="#e8b65e"
          strokeWidth="4"
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {/* 中心文字 */}
      <div className="absolute top-[55px] w-full text-center text-white">
        <div className="text-3xl font-extrabold tracking-wide">{label}</div>
        {subLabel && (
          <div className="text-xs text-white/70 mt-0.5">{subLabel}</div>
        )}
      </div>
    </div>
  )
}

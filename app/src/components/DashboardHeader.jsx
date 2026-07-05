import React from 'react'

/**
 * Dashboard 头部 — 完全复用前端参考.jsx ScreenOne 头部样式
 * bg-[#db7688] h-[190px] px-6 py-6 rounded-b-[40px]
 */
export default function DashboardHeader({ userName, currentDate }) {
  return (
    <div className="bg-[#db7688] h-[190px] px-6 py-6 rounded-b-[40px] relative z-10 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl text-white font-bold mb-1 flex items-center gap-2">
            Hi, {userName} <span>👋🏻</span>
          </h1>
          <p className="text-sm text-white/80">{currentDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-[#e8b65e] flex justify-center items-center text-white text-lg font-bold">
            {userName[0]}
          </div>
        </div>
      </div>
    </div>
  )
}

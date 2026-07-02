import React from 'react'

/**
 * 手机模拟框容器 — 完全复用前端参考.jsx 的样式
 * w-[375px] h-[812px] bg-[#f7f8ec] rounded-[40px] shadow-2xl
 */
export default function PhoneFrame({ children }) {
  return (
    <div className="w-[375px] h-[812px] bg-[#f7f8ec] rounded-[40px] overflow-hidden relative shadow-2xl shrink-0">
      {children}
    </div>
  )
}

import React, { useState, useEffect, useRef } from 'react'
import { generateRestChat } from '../data/reportMock.js'

/** 格式化秒数 */
function formatCountdown(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function RestChat({ totalMinutes, onComplete }) {
  const restDataRef = useRef(generateRestChat(totalMinutes))
  const restData = restDataRef.current
  const [restSeconds, setRestSeconds] = useState(restData.restDuration * 60)
  const [userInput, setUserInput] = useState('')
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setRestSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const handleSubmit = () => {
    const review = userInput.trim() || '今天学习感觉还可以'
    onComplete(review)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 头部 — 珊瑚粉 */}
      <div className="bg-[#db7688] h-[140px] px-6 py-4 rounded-b-[40px] relative z-10 flex flex-col items-center justify-center gap-1 shrink-0">
        <p className="text-white/70 text-sm">休息一下</p>
        <p className="text-white text-[36px] font-extrabold tracking-widest leading-none">
          {formatCountdown(restSeconds)}
        </p>
        <p className="text-white/50 text-xs">休息倒计时</p>
      </div>

      {/* AI 伴聊卡片 */}
      <div className="px-6 pt-4 relative z-10 bg-[#f7f8ec] flex-1 overflow-y-auto">
        <div className="bg-[#e8ede3] rounded-[28px] px-5 py-4 mb-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[#3f7b73] rounded-full flex justify-center items-center shrink-0 mt-0.5">
              <span className="text-white text-sm">AI</span>
            </div>
            <div>
              <p className="text-sm text-[#1a1a1a] leading-relaxed mb-3">
                {restData.message}
              </p>
              <div className="flex flex-wrap gap-2">
                {restData.suggestedReplies.map((reply, i) => (
                  <button
                    key={i}
                    className="bg-white rounded-full px-4 py-1.5 text-xs text-[#3f7b73] border border-[#3f7b73]/20 hover:bg-[#3f7b73]/5 transition"
                    onClick={() => setUserInput(reply)}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 复盘问题 */}
        <div className="bg-white rounded-[28px] px-5 py-4 border border-[#e8ede3] mb-3">
          <p className="text-sm font-bold text-[#1a1a1a] mb-3">
            💬 {restData.question}
          </p>
          <textarea
            className="w-full bg-[#f7f8ec] rounded-[16px] px-4 py-3 text-sm text-[#555] resize-none outline-none border border-transparent focus:border-[#db7688] transition"
            rows={3}
            placeholder="输入你的复盘..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />
        </div>

        {/* 提交按钮 */}
        <button
          onClick={handleSubmit}
          className="w-full bg-[#db7688] text-white py-3 rounded-full text-sm font-bold hover:bg-[#c96a7a] transition active:scale-95 mb-4"
        >
          完成复盘，查看日报
        </button>
      </div>
    </div>
  )
}

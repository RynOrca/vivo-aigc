import React, { useState } from 'react'

export default function SettingsPage({ onBack }) {
  const [goalMinutes, setGoalMinutes] = useState(45)
  const [reminderLevel, setReminderLevel] = useState('medium')
  const [mockMode, setMockMode] = useState(true)

  return (
    <div className="flex flex-col h-full bg-[#f7f8ec]">
      {/* 头部 */}
      <div className="bg-[#db7688] h-[150px] px-6 pt-6 pb-4 rounded-b-[40px] relative z-10 flex items-end justify-between">
        <div>
          <h1 className="text-2xl text-white font-bold">设置</h1>
          <p className="text-sm text-white/70">个性化你的学习体验</p>
        </div>
        <button
          onClick={onBack}
          className="w-10 h-10 bg-white/30 rounded-full flex justify-center items-center text-white hover:bg-white/40 transition"
        >
          ✕
        </button>
      </div>

      {/* 设置列表 */}
      <div className="px-6 pt-5 flex-1 overflow-y-auto">
        {/* 学习目标 */}
        <div className="mb-5">
          <p className="text-xs text-[#999] font-bold mb-3 uppercase tracking-wider">学习目标</p>
          <div className="bg-white rounded-[22px] px-5 py-4 border border-[#e8ede3]">
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm text-[#1a1a1a] font-bold">每日学习时长</p>
              <span className="text-sm font-bold text-[#db7688]">{goalMinutes} 分钟</span>
            </div>
            <input
              type="range"
              min="15"
              max="120"
              step="5"
              value={goalMinutes}
              onChange={(e) => setGoalMinutes(Number(e.target.value))}
              className="w-full h-2 bg-[#e8ede3] rounded-full appearance-none cursor-pointer accent-[#db7688]"
            />
            <div className="flex justify-between text-xs text-[#bbb] mt-1">
              <span>15min</span>
              <span>120min</span>
            </div>
          </div>
        </div>

        {/* 提醒强度 */}
        <div className="mb-5">
          <p className="text-xs text-[#999] font-bold mb-3 uppercase tracking-wider">提醒设置</p>
          <div className="bg-white rounded-[22px] border border-[#e8ede3] overflow-hidden">
            {[
              { key: 'gentle', label: '温和提醒', desc: '仅文字提示，不打断学习' },
              { key: 'medium', label: '标准提醒', desc: '弹窗 + 语音提醒' },
              { key: 'strong', label: '强提醒', desc: '所有提醒方式，包括震动' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setReminderLevel(item.key)}
                className={`w-full flex items-center justify-between px-5 py-3.5 border-b border-[#f0f0f0] last:border-0 hover:bg-[#f9f9f9] transition text-left ${
                  reminderLevel === item.key ? 'bg-[#fdf2f4]' : ''
                }`}
              >
                <div>
                  <p className="text-sm text-[#1a1a1a] font-medium">{item.label}</p>
                  <p className="text-xs text-[#999] mt-0.5">{item.desc}</p>
                </div>
                {reminderLevel === item.key && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#db7688" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mock 模式 */}
        <div className="mb-5">
          <p className="text-xs text-[#999] font-bold mb-3 uppercase tracking-wider">开发选项</p>
          <div className="bg-white rounded-[22px] px-5 py-4 border border-[#e8ede3]">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-[#1a1a1a] font-medium">Mock 模式</p>
                <p className="text-xs text-[#999] mt-0.5">使用模拟数据演示</p>
              </div>
              <button
                onClick={() => setMockMode(!mockMode)}
                className={`w-12 h-7 rounded-full transition relative ${
                  mockMode ? 'bg-[#3f7b73]' : 'bg-[#ddd]'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow transition-transform ${
                    mockMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* 关于 */}
        <div className="mb-6">
          <p className="text-xs text-[#999] font-bold mb-3 uppercase tracking-wider">关于</p>
          <div className="bg-white rounded-[22px] border border-[#e8ede3] overflow-hidden">
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-[#f0f0f0]">
              <span className="text-sm text-[#1a1a1a]">版本</span>
              <span className="text-sm text-[#999]">0.1.0 MVP</span>
            </div>
            <div className="flex justify-between items-center px-5 py-3.5">
              <span className="text-sm text-[#1a1a1a]">隐私说明</span>
              <span className="text-sm text-[#999]">不收集人脸数据</span>
            </div>
          </div>
        </div>

        {/* 底部留白 */}
        <div className="h-6" />
      </div>
    </div>
  )
}

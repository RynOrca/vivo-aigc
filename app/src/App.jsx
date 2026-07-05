import React, { useState, useCallback, useEffect } from 'react'
import PhoneFrame from './components/PhoneFrame.jsx'
import Dashboard from './pages/Dashboard.jsx'
import StudyPage from './pages/StudyPage.jsx'
import RestChat from './pages/RestChat.jsx'
import StudyReport from './pages/StudyReport.jsx'
import StatsPage from './pages/StatsPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import { useAppState } from './data/AppContext.jsx'

// 检测是否在 Capacitor 原生环境中运行
const isNative = typeof window !== 'undefined' && !!(window.Capacitor || window.__capacitor)

export default function App() {
  const { completeSession } = useAppState()
  const [page, setPage] = useState('dashboard')
  const [sessionData, setSessionData] = useState({
    totalMinutes: 0,
    focusHistory: [],
    distractionCount: 0,
    oralReview: '',
  })

  const goTo = useCallback((p) => () => setPage(p), [])

  const handleEndStudy = useCallback((data) => {
    setSessionData((prev) => ({ ...prev, ...data }))
    setPage('rest')
  }, [])

  const handleRestComplete = useCallback((oralReview) => {
    setSessionData((prev) => ({ ...prev, oralReview }))
    setPage('report')
  }, [])

  const handleBackHome = useCallback(() => {
    // 将本次会话数据写入全局状态
    completeSession({
      totalMinutes: sessionData.totalMinutes,
      focusHistory: sessionData.focusHistory,
      distractionCount: sessionData.distractionCount,
    })
    setPage('dashboard')
    setSessionData({
      totalMinutes: 0,
      focusHistory: [],
      distractionCount: 0,
      oralReview: '',
    })
  }, [sessionData, completeSession])

  const inner = (
    <div className="page-enter h-full relative" key={page}>
      {page === 'dashboard' && (
        <Dashboard
          onStartStudy={goTo('study')}
          onGoStats={goTo('stats')}
          onGoSettings={goTo('settings')}
        />
      )}
      {page === 'study' && (
        <StudyPage onEndStudy={handleEndStudy} />
      )}
      {page === 'rest' && (
        <RestChat
          totalMinutes={sessionData.totalMinutes}
          onComplete={handleRestComplete}
        />
      )}
      {page === 'report' && (
        <StudyReport
          totalMinutes={sessionData.totalMinutes}
          focusHistory={sessionData.focusHistory}
          distractionCount={sessionData.distractionCount}
          oralReview={sessionData.oralReview}
          onBackHome={handleBackHome}
        />
      )}
      {page === 'stats' && (
        <StatsPage onBack={goTo('dashboard')} />
      )}
      {page === 'settings' && (
        <SettingsPage onBack={goTo('dashboard')} />
      )}
    </div>
  )

  // 原生 APK 模式：全屏无框  |  Web 开发模式：375×812 手机模拟框
  if (isNative) {
    return <div className="h-full w-full bg-[#f7f8ec] overflow-hidden">{inner}</div>
  }

  return (
    <div className="flex justify-center items-center p-10 bg-[#1e1e1e] min-h-screen">
      <PhoneFrame>{inner}</PhoneFrame>
    </div>
  )
}

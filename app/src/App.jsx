import React, { useState } from 'react'
import PhoneFrame from './components/PhoneFrame.jsx'
import Dashboard from './pages/Dashboard.jsx'
import StudyPage from './pages/StudyPage.jsx'
import RestChat from './pages/RestChat.jsx'
import StudyReport from './pages/StudyReport.jsx'
import StatsPage from './pages/StatsPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'

export default function App() {
  const [page, setPage] = useState('dashboard')
  const [sessionData, setSessionData] = useState({
    totalMinutes: 0,
    focusHistory: [],
    distractionCount: 0,
    oralReview: '',
  })

  const goTo = (p) => () => setPage(p)

  const handleEndStudy = (data) => {
    setSessionData((prev) => ({ ...prev, ...data }))
    setPage('rest')
  }

  const handleRestComplete = (oralReview) => {
    setSessionData((prev) => ({ ...prev, oralReview }))
    setPage('report')
  }

  const handleBackHome = () => {
    setPage('dashboard')
    setSessionData({
      totalMinutes: 0,
      focusHistory: [],
      distractionCount: 0,
      oralReview: '',
    })
  }

  return (
    <div className="flex justify-center items-center p-10 bg-[#1e1e1e] min-h-screen">
      <PhoneFrame>
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
      </PhoneFrame>
    </div>
  )
}

import React, { useState } from 'react'
import PhoneFrame from './components/PhoneFrame.jsx'
import Dashboard from './pages/Dashboard.jsx'
import StudyPage from './pages/StudyPage.jsx'

export default function App() {
  const [page, setPage] = useState('dashboard')

  return (
    <div className="flex justify-center items-center p-10 bg-[#1e1e1e] min-h-screen">
      <PhoneFrame>
        {page === 'dashboard' ? (
          <Dashboard onStartStudy={() => setPage('study')} />
        ) : (
          <StudyPage onEndStudy={() => setPage('dashboard')} />
        )}
      </PhoneFrame>
    </div>
  )
}

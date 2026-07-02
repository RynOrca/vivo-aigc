import React from 'react'
import PhoneFrame from './components/PhoneFrame.jsx'
import Dashboard from './pages/Dashboard.jsx'

export default function App() {
  return (
    <div className="flex justify-center items-center p-10 bg-[#1e1e1e] min-h-screen">
      <PhoneFrame>
        <Dashboard />
      </PhoneFrame>
    </div>
  )
}

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AppProvider } from './data/AppContext.jsx'
import './index.css'

// 不包裹 <React.StrictMode>：StrictMode 在开发环境会 double-fire effects，
// 导致 useCamera 第一次 getUserMedia 获取的流被第二次 effect 的 cleanup 杀死，
// 摄像头灯亮一下就灭、画面不显示。
ReactDOM.createRoot(document.getElementById('root')).render(
  <AppProvider>
    <App />
  </AppProvider>,
)

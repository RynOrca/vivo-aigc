import React, { useState, useEffect, useRef, useCallback } from 'react'
import ArcProgress from '../components/ArcProgress.jsx'
import InterventionModal from '../components/InterventionModal.jsx'
import { analyzeFace } from '../data/api.js'

/**
 * 专注学习页 — Phase 10：AI 感知驱动
 *
 * 与上一版（200 秒 Mock 循环）的区别：
 *   - 新增 [启动 AI 感知] 按钮：getUserMedia 拿前置摄像头
 *   - 每 5 秒截帧 → POST /api/ai/analyze-face → 返回 studyState 驱动 UI
 *   - intervention != null → 弹出 L1/L2/L3 干预弹窗
 *   - 摄像头失败 → 上传照片手动分析
 *
 * Settings 页 Toggle 控制 api.js 的 MOCK_MODE 切换真实/Mock 管线
 */

function formatTime(totalSeconds) {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
}

function cx(...parts) { return parts.filter(Boolean).join(' ') }

const distLabelMap = { NONE: '正常', L1: '轻微分心', L2: '连续分心', L3: '严重分心' }
const emotionLabelMap = { calm: '平静', focused: '专注', tired: '疲劳', anxious: '焦虑', distracted: '分心' }

export default function StudyPage({ onEndStudy }) {
  const [elapsed, setElapsed] = useState(0)
  const [state, setState] = useState(null)
  const [intervention, setIntervention] = useState(null)
  const [isPaused, setIsPaused] = useState(false)

  const [aiEnabled, setAiEnabled] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const [selfieMode, setSelfieMode] = useState(false)
  const [lastAnalysisTime, setLastAnalysisTime] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const [sessionId] = useState(() => 'study_' + Date.now().toString(36))
  const [loading, setLoading] = useState(true)
  const [cameraLoading, setCameraLoading] = useState(false)

  const timerRef = useRef(null)
  const aiIntervalRef = useRef(null)
  const prevLevelRef = useRef('NONE')
  const lastInterventionRef = useRef(0)
  const focusHistoryRef = useRef([])
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    analyzeFace(sessionId, '', 0)
      .then((res) => { setState(res.studyState); setLoading(false) })
      .catch(() => {
        setState({ sessionId, timestamp: Math.floor(Date.now() / 1000), elapsedSeconds: 0, focusScore: 85, fatigueScore: 10, distractionLevel: 'NONE', emotion: 'calm', currentScene: 'study', isUserPresent: true })
        setLoading(false)
      })
  }, [sessionId])

  useEffect(() => {
    if (isPaused || loading) return
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [isPaused, loading])

  const captureAndAnalyze = useCallback(async () => {
    if (isAnalyzing) return
    setIsAnalyzing(true)
    let base64 = null
    const video = videoRef.current
    const canvas = canvasRef.current
    if (video && canvas && video.readyState >= 2) {
      try {
        canvas.width = 320; canvas.height = 240
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, 320, 240)
        base64 = canvas.toDataURL('image/jpeg', 0.7)
      } catch (e) { /* noop */ }
    }
    try {
      const result = await analyzeFace(sessionId, base64 || '', elapsed)
      setState(result.studyState)
      setLastAnalysisTime(Date.now())
      if (elapsed > 0 && elapsed % 5 === 0) focusHistoryRef.current.push(result.studyState.focusScore)
      const newLevel = result.studyState.distractionLevel
      if (newLevel !== 'NONE' && newLevel !== prevLevelRef.current && elapsed - lastInterventionRef.current > 15 && result.intervention) {
        lastInterventionRef.current = elapsed
        setIntervention(result.intervention)
      }
      prevLevelRef.current = newLevel
    } catch (e) {
      console.warn('[StudyPage] AI analyze failed:', e.message)
    } finally { setIsAnalyzing(false) }
  }, [sessionId, elapsed, isAnalyzing])

  useEffect(() => {
    if (!aiEnabled || isPaused) { clearInterval(aiIntervalRef.current); return }
    captureAndAnalyze()
    aiIntervalRef.current = setInterval(captureAndAnalyze, 5000)
    return () => clearInterval(aiIntervalRef.current)
  }, [aiEnabled, isPaused, captureAndAnalyze])

  const startAiPerception = useCallback(async () => {
    setCameraError(null); setCameraLoading(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setAiEnabled(true)
    } catch (e) {
      console.warn('[StudyPage] getUserMedia failed:', e)
      setCameraError('无法访问摄像头,可以改用上传照片')
    } finally { setCameraLoading(false) }
  }, [])

  const stopAiPerception = useCallback(() => {
    clearInterval(aiIntervalRef.current)
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null }
    setAiEnabled(false)
  }, [])

  const handleFileUpload = useCallback(async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const base64 = await new Promise((resolve, reject) => {
      const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(file)
    })
    try {
      const result = await analyzeFace(sessionId, base64, elapsed)
      setState(result.studyState); setLastAnalysisTime(Date.now())
      if (result.intervention && result.intervention.level !== 'NONE') {
        const lv = result.intervention.level
        if (lv !== prevLevelRef.current && elapsed - lastInterventionRef.current > 15) { lastInterventionRef.current = elapsed; setIntervention(result.intervention) }
        prevLevelRef.current = lv
      }
    } catch (err) { console.warn('[StudyPhoto] analyze failed:', err.message) }
  }, [sessionId, elapsed])

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current); clearInterval(aiIntervalRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const handleEndStudy = useCallback(() => {
    clearInterval(timerRef.current); clearInterval(aiIntervalRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    const totalMinutes = Math.round(elapsed / 60)
    onEndStudy({ totalMinutes: Math.max(1, totalMinutes), focusHistory: [...focusHistoryRef.current], distractionCount: state ? state.distractionCount : 0 })
  }, [elapsed, onEndStudy, state])

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-[#f7f8ec] items-center justify-center">
        <div className="bg-[#db7688] h-[160px] w-full rounded-b-[40px] flex items-center justify-center">
          <p className="text-white text-lg">加载中...</p>
        </div>
      </div>
    )
  }

  const fs2 = state || {}
  const focusScore = fs2.focusScore || 85
  const fatigueScore = fs2.fatigueScore || 10
  const distractionLevel = fs2.distractionLevel || 'NONE'
  const distractionCount = fs2.distractionCount || 0
  const emotion = fs2.emotion || 'calm'
  const faceFeatures = state && state.faceFeatures ? state.faceFeatures : null
  const lastSec = lastAnalysisTime ? Math.floor((Date.now() - lastAnalysisTime) / 1000) : null

  const headerClass = selfieMode ? 'h-[80px] rounded-b-[28px] bg-[#db7688]/85 backdrop-blur-sm' : 'h-[160px] rounded-b-[40px] bg-[#db7688]'
  const timerTextClass = selfieMode ? 'text-[30px]' : 'text-[42px]'
  const statusLabel = isPaused ? '已暂停' : (aiEnabled ? 'AI 感知驱动中' : '专注学习中')
  const headerSubTextClass = selfieMode ? 'text-xs' : 'text-sm'

  return (
    <>
      <video ref={videoRef} autoPlay playsInline muted className="hidden" style={{ position: 'absolute', top: -9999 }} />
      <canvas ref={canvasRef} className="hidden" style={{ position: 'absolute', top: -9999 }} />
      <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />

      <div className={headerClass + ' px-6 py-3 relative z-20 flex flex-col items-center justify-center gap-0.5 transition-all duration-300'}>
        <p className={headerSubTextClass + ' text-white/70'}>{statusLabel}</p>
        <p className={'text-white font-extrabold tracking-widest leading-none ' + timerTextClass}>{formatTime(elapsed)}</p>
        {!selfieMode && (
          <p className="text-white/60 text-xs">
            {(distLabelMap[distractionLevel] || '正常') + ' - ' + (emotionLabelMap[emotion] || emotion)}
            {aiEnabled && lastSec !== null && <span className="ml-2 text-white/40">{'> ' + lastSec + 's 前分析'}</span>}
          </p>
        )}
        {cameraError && <p className="text-yellow-200 text-[10px] mt-1">{cameraError}</p>}
      </div>

      {!selfieMode && (
        <div className="px-6 pt-4 relative z-10 bg-[#f7f8ec] pb-4">
          <div className="flex gap-2 mb-3">
            {!aiEnabled ? (
              <button onClick={startAiPerception} disabled={cameraLoading}
                className="flex-1 bg-[#db7688] text-white rounded-full px-4 py-2 text-sm font-bold hover:bg-[#c56678] transition flex items-center justify-center gap-2 disabled:opacity-60">
                {cameraLoading
                  ? React.createElement(React.Fragment, null, React.createElement('span', { className: 'inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin' }), '启动中...')
                  : '启动 AI 感知'}
              </button>
            ) : (
              <button onClick={stopAiPerception} className="flex-1 bg-[#3f7b73] text-white rounded-full px-4 py-2 text-sm font-bold hover:bg-[#345f59] transition">
                暂停 AI 感知
              </button>
            )}
            <button onClick={() => setSelfieMode(true)}
              className="bg-white rounded-full px-3 py-1.5 border border-[#ddd] text-xs text-[#999] hover:text-[#db7688] hover:border-[#db7688] transition">
              - 自拍
            </button>
          </div>

          {aiEnabled && faceFeatures && (
            <div className="bg-white rounded-[20px] px-4 py-3 mb-3 shadow-sm border border-[#eee]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-[#333]">AI 面部分析</span>
                <span className="text-[10px] text-[#999]">
                  {isAnalyzing ? React.createElement('span', { className: 'text-[#db7688]' }, '分析中') : (lastSec !== null ? lastSec + 's 前' : '等待中')}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                <div><p className="text-[#999] text-[10px] mb-0.5">闭眼占比</p><p className="font-bold text-[#db7688]">{faceFeatures.eyeClosedRatio}</p></div>
                <div><p className="text-[#999] text-[10px] mb-0.5">视线方向</p><p className="font-bold text-[#3f7b73]">{faceFeatures.gazeDirection}</p></div>
                <div><p className="text-[#999] text-[10px] mb-0.5">头部偏角</p><p className="font-bold text-[#e8b65e]">{faceFeatures.headYawDeg}°</p></div>
                <div><p className="text-[#999] text-[10px] mb-0.5">在座</p><p className={cx('font-bold', faceFeatures.isUserPresent ? 'text-[#3f7b73]' : 'text-[#db7688]')}>{faceFeatures.isUserPresent ? 'Y' : 'N'}</p></div>
              </div>
            </div>
          )}

          <div className="flex gap-4 mb-3">
            <div className={cx('flex-1 flex items-center gap-3 rounded-[28px] px-4 py-3', aiEnabled ? 'bg-[#f2e3e1]/60' : 'bg-[#f2e3e1]')}>
              <div className="w-10 h-10 bg-white rounded-full flex justify-center items-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#db7688" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
              </div>
              <div><p className="text-xs text-[#666] mb-0.5">疲劳指数</p><h4 className="text-lg font-bold text-[#db7688]">{fatigueScore}</h4></div>
            </div>
            <div className={cx('flex-1 flex items-center gap-3 rounded-[28px] px-4 py-3', aiEnabled ? 'bg-[#e8ede3]/60' : 'bg-[#e8ede3]')}>
              <div className="w-10 h-10 bg-white rounded-full flex justify-center items-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3f7b73" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
              </div>
              <div><p className="text-xs text-[#666] mb-0.5">分心次数</p><h4 className="text-lg font-bold text-[#3f7b73]">{distractionCount}</h4></div>
            </div>
          </div>

          {cameraError && !aiEnabled && (
            <button onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="w-full bg-white border border-dashed border-[#db7688] text-[#db7688] rounded-[20px] px-4 py-3 mb-3 text-sm hover:bg-[#fdf2f4] transition">
              上传照片手动分析
            </button>
          )}

          {aiEnabled && (
            <div className="bg-[#e8ede3]/60 rounded-[20px] px-4 py-2 mb-3 text-[11px] text-[#555]">
              AI 每 5 秒分析一次摄像头画面。试着偏头、闭眼，看专注分变化。
            </div>
          )}
        </div>
      )}

      {selfieMode && React.createElement(React.Fragment, null,
        React.createElement('video', { ref: videoRef, autoPlay: true, playsInline: true, muted: true,
          className: 'absolute inset-0 w-full h-full object-cover z-0 rounded-[40px]', style: { transform: 'scaleX(-1)' } }),
        React.createElement('div', { className: 'absolute left-3 top-[120px] z-20 bg-white/85 backdrop-blur-sm rounded-[20px] px-3 py-2.5 shadow-lg border border-white/30 flex flex-col items-center gap-0.5 w-[65px]' },
          React.createElement('svg', { width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: '#db7688', strokeWidth: '2' }, React.createElement('path', { d: 'M22 12h-4l-3 9L9 3l-3 9H2' })),
          React.createElement('span', { className: 'text-lg font-extrabold text-[#db7688] leading-none' }, fatigueScore),
          React.createElement('span', { className: 'text-[9px] text-[#999]' }, '疲劳')
        ),
        React.createElement('div', { className: 'absolute right-3 top-[120px] z-20 bg-white/85 backdrop-blur-sm rounded-[20px] px-3 py-2.5 shadow-lg border border-white/30 flex flex-col items-center gap-0.5 w-[65px]' },
          React.createElement('svg', { width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: '#3f7b73', strokeWidth: '2' },
            React.createElement('line', { x1: '8', y1: '6', x2: '21', y2: '6' }), React.createElement('line', { x1: '8', y1: '12', x2: '21', y2: '12' }), React.createElement('line', { x1: '8', y1: '18', x2: '21', y2: '18' }),
            React.createElement('line', { x1: '3', y1: '6', x2: '3.01', y2: '6' }), React.createElement('line', { x1: '3', y1: '12', x2: '3.01', y2: '12' }), React.createElement('line', { x1: '3', y1: '18', x2: '3.01', y2: '18' })
          ),
          React.createElement('span', { className: 'text-lg font-extrabold text-[#3f7b73] leading-none' }, distractionCount),
          React.createElement('span', { className: 'text-[9px] text-[#999]' }, '分心')
        ),
        React.createElement('div', { className: 'absolute top-[108px] left-1/2 -translate-x-1/2 z-20 bg-white/70 backdrop-blur-sm rounded-full px-3 py-0.5 text-[10px] text-[#555]' }, distLabelMap[distractionLevel] || '正常'),
        React.createElement('button', { onClick: () => { setSelfieMode(false); if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null } },
          className: 'absolute top-[88px] right-3 z-20 w-7 h-7 bg-black/30 backdrop-blur-sm rounded-full flex justify-center items-center text-white text-xs' }, 'X')
      )}

      {!selfieMode && (
        <div className="absolute bottom-0 left-0 w-full h-[390px] bg-[#e8b65e] rounded-t-[100px] overflow-hidden z-10">
          <div className="absolute bottom-0 left-0 w-full h-[285px] bg-[#558d88] rounded-t-[80px] flex flex-col items-center justify-center gap-2 pt-4">
            <ArcProgress percentage={focusScore} label={String(focusScore)} subLabel="专注分" />
            <p className="text-white/60 text-xs mt-1">{focusScore > 70 ? '状态不错，继续保持' : '试着把注意力拉回来'}</p>
            <div className="flex items-center gap-4 mt-2">
              <button className="w-14 h-14 bg-white/20 rounded-full flex justify-center items-center border-[4px] border-white/20 hover:scale-105 transition-transform active:scale-95 cursor-pointer"
                onClick={() => setIsPaused(!isPaused)}>
                {isPaused
                  ? React.createElement('svg', { width: '24', height: '24', viewBox: '0 0 24 24', fill: '#fff' }, React.createElement('polygon', { points: '5 3 19 12 5 21 5 3' }))
                  : React.createElement('svg', { width: '22', height: '22', viewBox: '0 0 24 24', fill: '#fff' }, React.createElement('rect', { x: '6', y: '4', width: '4', height: '16' }), React.createElement('rect', { x: '14', y: '4', width: '4', height: '16' }))}
              </button>
              <button className="w-20 h-20 bg-[#db7688] rounded-full flex justify-center items-center border-[6px] border-white/20 hover:scale-105 transition-transform active:scale-95 cursor-pointer"
                onClick={handleEndStudy}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
              </button>
            </div>
            <p className="text-white font-bold text-sm tracking-wide">{isPaused ? '继续学习' : '结束学习'}</p>
          </div>
        </div>
      )}

      {selfieMode && (
        <div className="absolute bottom-0 left-0 w-full h-[120px] bg-gradient-to-t from-black/50 to-transparent z-20 flex items-end justify-center gap-6 pb-6">
          <button className="w-14 h-14 bg-white/25 backdrop-blur-sm rounded-full flex justify-center items-center border-2 border-white/30 hover:scale-105 transition-transform active:scale-95 cursor-pointer"
            onClick={() => setIsPaused(!isPaused)}>
            {isPaused
              ? React.createElement('svg', { width: '22', height: '22', viewBox: '0 0 24 24', fill: '#fff' }, React.createElement('polygon', { points: '5 3 19 12 5 21 5 3' }))
              : React.createElement('svg', { width: '20', height: '20', viewBox: '0 0 24 24', fill: '#fff' }, React.createElement('rect', { x: '6', y: '4', width: '4', height: '16' }), React.createElement('rect', { x: '14', y: '4', width: '4', height: '16' }))}
          </button>
          <button className="w-16 h-16 bg-[#db7688]/90 rounded-full flex justify-center items-center border-[4px] border-white/30 hover:scale-105 transition-transform active:scale-95 cursor-pointer"
            onClick={handleEndStudy}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
          </button>
        </div>
      )}

      {intervention && React.createElement(InterventionModal, { event: intervention, onDismiss: () => setIntervention(null) })}
    </>
  )
}

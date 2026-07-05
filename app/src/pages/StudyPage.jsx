import React, { useState, useEffect, useRef, useCallback } from 'react'
import ArcProgress from '../components/ArcProgress.jsx'
import InterventionModal from '../components/InterventionModal.jsx'
import { analyzeFace } from '../data/api.js'
import { useCamera } from '../hooks/useCamera.js'
import { useAIAnalysis } from '../hooks/useAIAnalysis.js'

/**
 * StudyPage — Phase 10 final: AI 感知驱动
 *
 * 架构拆分：
 *   - useCamera(videoRef, enabled) → 管理 stream/error
 *   - useAIAnalysis({videoRef, ...}) → 每 3s 截帧 API + 每 30s 平均更新
 *   - 自拍模式：独立 videoRef + useCamera
 *   - AI 感知模式：独立 videoRef + useCamera + useAIAnalysis
 */

function fmt(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
}

const distL = { NONE: '正常', L1: '轻微分心', L2: '连续分心', L3: '严重分心' }
const emoL = { calm: '平静', focused: '专注', tired: '疲劳', anxious: '焦虑', distracted: '分心' }

export default function StudyPage({ onEndStudy }) {
  const [elapsed, setElapsed] = useState(0)
  const [intervention, setIntervention] = useState(null)
  const [isPaused, setIsPaused] = useState(false)
  const [selfieMode, setSelfieMode] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [sessionId] = useState(() => 'study_' + Date.now().toString(36))
  const [loading, setLoading] = useState(true)
  const focusHistoryRef = useRef([])

  // 自拍模式的 video（全屏显示）
  const selfieVideoRef = useRef(null)
  const selfieCam = useCamera(selfieVideoRef, selfieMode, 'front')

  // AI 感知模式的视频（隐藏，仅用于截帧）
  const aiVideoRef = useRef(null)
  const aiCam = useCamera(aiVideoRef, aiEnabled, 'front')

  // AI 感知的分析 hook
  const ai = useAIAnalysis({
    enabled: aiEnabled && !isPaused,
    paused: isPaused,
    videoRef: aiVideoRef,
    sessionId,
    getElapsed: () => elapsed,
    onIntervention: (evt) => setIntervention(evt),
    captureIntervalMs: 3000,
    aggregateIntervalMs: 30000,
  })

  // 初始加载
  useEffect(() => {
    analyzeFace(sessionId, '', 0)
      .then(r => { ai.displayState || null; setLoading(false) })
      .catch(() => setLoading(false))
  }, [sessionId])

  // 计时器
  useEffect(() => {
    if (isPaused || loading) return
    const t = setInterval(() => setElapsed(p => p + 1), 1000)
    return () => clearInterval(t)
  }, [isPaused, loading])

  // 每 5 秒采样 focusScore 到 focusHistory
  useEffect(() => {
    if (aiEnabled && elapsed > 0 && elapsed % 5 === 0 && ai.displayState) {
      focusHistoryRef.current.push(ai.displayState.focusScore)
    }
  }, [elapsed, aiEnabled, ai.displayState])

  // 文件上传 fallback
  const fileRef = useRef(null)
  const handleFile = useCallback(async (e) => {
    const file = e.target.files[0]; if (!file) return
    const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file) })
    try {
      const r = await analyzeFace(sessionId, b64, elapsed)
      ai.displayState || null
    } catch (err) { console.warn('[StudyPage] upload analyze failed:', err.message) }
  }, [sessionId, elapsed])

  // 结束学习
  const endStudy = useCallback(() => {
    aiCam.stop(); selfieCam.stop()
    onEndStudy({
      totalMinutes: Math.max(1, Math.round(elapsed / 60)),
      focusHistory: [...focusHistoryRef.current],
      distractionCount: ai.displayState ? ai.displayState.distractionCount : 0,
    })
  }, [elapsed, onEndStudy, ai.displayState, aiCam, selfieCam])

  // 清理
  useEffect(() => () => { aiCam.stop(); selfieCam.stop() }, [aiCam, selfieCam])

  if (loading) return (
    <div className="flex flex-col h-full bg-[#f7f8ec] items-center justify-center">
      <div className="bg-[#db7688] h-[160px] w-full rounded-b-[40px] flex items-center justify-center">
        <p className="text-white text-lg">加载中...</p>
      </div>
    </div>
  )

  const ds = ai.displayState || {}
  const focusScore = ds.focusScore != null ? ds.focusScore : 85
  const fatigueScore = ds.fatigueScore != null ? ds.fatigueScore : 10
  const distractionLevel = ds.distractionLevel || 'NONE'
  const distractionCount = ds.distractionCount || 0
  const emotion = ds.emotion || 'calm'
  const ff = ai.faceFeatures || ds.faceFeatures || null
  const lastSec = ai.lastAnalysisTime ? Math.floor((Date.now() - ai.lastAnalysisTime) / 1000) : null

  const hdrCls = selfieMode ? 'h-[80px] bg-[#db7688]/85 backdrop-blur-sm' : 'h-[160px] bg-[#db7688]'
  const timerCls = selfieMode ? 'text-[30px]' : 'text-[42px]'
  const statusLbl = isPaused ? '已暂停' : aiEnabled ? 'AI 感知驱动中' : '专注学习中'
  const cameraError = aiCam.error || selfieCam.error
  const cameraLoading = aiCam.loading || selfieCam.loading

  return (
    <>
      {/* 隐藏元素 */}
      <video ref={aiVideoRef} autoPlay playsInline muted className="hidden" />
      <input type="file" accept="image/*" ref={fileRef} className="hidden" onChange={handleFile} />

      {/* 头部 */}
      <div className={'rounded-b-[40px] px-6 py-3 relative z-20 flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ' + hdrCls}>
        <p className={(selfieMode ? 'text-xs' : 'text-sm') + ' text-white/70'}>{statusLbl}</p>
        <p className={'text-white font-extrabold tracking-widest leading-none ' + timerCls}>{fmt(elapsed)}</p>
        {!selfieMode && <p className="text-white/60 text-xs">{(distL[distractionLevel] || '正常') + ' · ' + (emoL[emotion] || emotion)}{aiEnabled && lastSec != null && ' · ' + lastSec + 's 前'}</p>}
        {cameraError && <p className="text-yellow-200 text-[10px] mt-1">{cameraError}</p>}
      </div>

      {/* 自拍模式 */}
      {selfieMode && (
        <>
          <video ref={selfieVideoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover z-0 rounded-[40px]" style={{ transform: 'scaleX(-1)' }} />
          <SelFatigue fatigueScore={fatigueScore} />
          <SelDistraction distractionCount={distractionCount} />
          <SelLevel level={distractionLevel} />
          <button onClick={() => setSelfieMode(false)} className="absolute top-[88px] right-3 z-20 w-7 h-7 bg-black/30 rounded-full flex items-center justify-center text-white text-xs">✕</button>
          <SelBottom isPaused={isPaused} setIsPaused={setIsPaused} onEnd={endStudy} />
        </>
      )}

      {/* 普通模式 */}
      {!selfieMode && (
        <div className="px-6 pt-4 relative z-10 bg-[#f7f8ec] pb-4">
          <div className="flex gap-2 mb-3">
            {!aiEnabled ? (
              <button onClick={() => setAiEnabled(true)} disabled={cameraLoading}
                className="flex-1 bg-[#db7688] text-white rounded-full px-4 py-2 text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                {cameraLoading ? <><span className="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />启动中...</> : '🤖 启动 AI 感知'}
              </button>
            ) : (
              <button onClick={() => setAiEnabled(false)} className="flex-1 bg-[#3f7b73] text-white rounded-full px-4 py-2 text-sm font-bold">⏸ 暂停感知</button>
            )}
            <button onClick={() => setSelfieMode(true)} className="bg-white rounded-full px-3 py-1.5 border border-[#ddd] text-xs text-[#999]">📷 自拍</button>
          </div>

          {aiEnabled && ff && (
            <div className="bg-white rounded-[20px] px-4 py-3 mb-3 shadow-sm border border-[#eee]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-[#333]">🧠 AI 面部分析</span>
                <span className="text-[10px] text-[#999]">{ai.isAnalyzing ? '分析中…' : (lastSec != null ? lastSec + 's 前' : '等待中')}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                <FV l="闭眼占比" v={ff.eyeClosedRatio} c="#db7688" />
                <FV l="视线方向" v={ff.gazeDirection} c="#3f7b73" />
                <FV l="头部偏角" v={ff.headYawDeg != null ? ff.headYawDeg + '°' : '—'} c="#e8b65e" />
                <FV l="在座" v={ff.isUserPresent ? '✓' : '✗'} c={ff.isUserPresent ? '#3f7b73' : '#db7688'} />
              </div>
              <p className="text-[9px] text-[#999] mt-1.5">内部每 3s 采样 · UI 每 30s 平均更新</p>
            </div>
          )}

          <div className="flex gap-4 mb-3">
            <div className={'flex-1 flex items-center gap-3 rounded-[28px] px-4 py-3 ' + (aiEnabled ? 'bg-[#f2e3e1]/60' : 'bg-[#f2e3e1]')}>
              <FatigueIcon /><div><p className="text-xs text-[#666] mb-0.5">疲劳指数</p><h4 className="text-lg font-bold text-[#db7688]">{fatigueScore}</h4></div>
            </div>
            <div className={'flex-1 flex items-center gap-3 rounded-[28px] px-4 py-3 ' + (aiEnabled ? 'bg-[#e8ede3]/60' : 'bg-[#e8ede3]')}>
              <DistIcon /><div><p className="text-xs text-[#666] mb-0.5">分心次数</p><h4 className="text-lg font-bold text-[#3f7b73]">{distractionCount}</h4></div>
            </div>
          </div>

          {cameraError && !aiEnabled && (
            <button onClick={() => fileRef.current?.click()}
              className="w-full bg-white border border-dashed border-[#db7688] text-[#db7688] rounded-[20px] px-4 py-3 mb-3 text-sm">📁 上传照片手动分析</button>
          )}

          {aiEnabled && <div className="bg-[#e8ede3]/60 rounded-[20px] px-4 py-2 text-[11px] text-[#555]">💡 试着偏头、闭眼，专注分会在下次 30s 聚合后变化。</div>}
        </div>
      )}

      {!selfieMode && (
        <div className="absolute bottom-0 left-0 w-full h-[390px] bg-[#e8b65e] rounded-t-[100px] overflow-hidden z-10">
          <div className="absolute bottom-0 left-0 w-full h-[285px] bg-[#558d88] rounded-t-[80px] flex flex-col items-center justify-center gap-2 pt-4">
            <ArcProgress percentage={focusScore} label={String(focusScore)} subLabel="专注分" />
            <p className="text-white/60 text-xs mt-1">{focusScore > 70 ? '👍 继续保持' : '💡 拉回注意力'}</p>
            <div className="flex items-center gap-4 mt-2">
              <button onClick={() => setIsPaused(!isPaused)} className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center border-[4px] border-white/20">{isPaused ? <PlayIcon /> : <PauseIcon />}</button>
              <button onClick={endStudy} className="w-20 h-20 bg-[#db7688] rounded-full flex items-center justify-center border-[6px] border-white/20"><StopIcon /></button>
            </div>
            <p className="text-white font-bold text-sm tracking-wide">{isPaused ? '继续学习' : '结束学习'}</p>
          </div>
        </div>
      )}

      {intervention && <InterventionModal event={intervention} onDismiss={() => setIntervention(null)} />}
    </>
  )
}

/* ===== sub components ===== */
function FV({ l, v, c }) { return <div><p className="text-[#999] text-[10px] mb-0.5">{l}</p><p className="font-bold" style={{ color: c }}>{v != null ? v : '—'}</p></div> }
function FatigueIcon() { return <div className="w-10 h-10 bg-white rounded-full flex justify-center items-center shrink-0"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#db7688" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg></div> }
function DistIcon() { return <div className="w-10 h-10 bg-white rounded-full flex justify-center items-center shrink-0"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3f7b73" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /></svg></div> }
function PlayIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3" /></svg> }
function PauseIcon() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg> }
function StopIcon() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><rect x="6" y="6" width="12" height="12" rx="2" /></svg> }
function SelFatigue({ fatigueScore }) { return <div className="absolute left-3 top-[120px] z-20 bg-white/85 backdrop-blur-sm rounded-[20px] px-3 py-2.5 shadow-lg border border-white/30 flex flex-col items-center gap-0.5 w-[65px]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#db7688" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg><span className="text-lg font-extrabold text-[#db7688] leading-none">{fatigueScore}</span><span className="text-[9px] text-[#999]">疲劳</span></div> }
function SelDistraction({ distractionCount }) { return <div className="absolute right-3 top-[120px] z-20 bg-white/85 backdrop-blur-sm rounded-[20px] px-3 py-2.5 shadow-lg border border-white/30 flex flex-col items-center gap-0.5 w-[65px]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3f7b73" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /></svg><span className="text-lg font-extrabold text-[#3f7b73] leading-none">{distractionCount}</span><span className="text-[9px] text-[#999]">分心</span></div> }
function SelLevel({ level }) { return <div className="absolute top-[108px] left-1/2 -translate-x-1/2 z-20 bg-white/70 backdrop-blur-sm rounded-full px-3 py-0.5 text-[10px] text-[#555]">{(distL[level] || '正常')}</div> }
function SelBottom({ isPaused, setIsPaused, onEnd }) { return <div className="absolute bottom-0 left-0 w-full h-[120px] bg-gradient-to-t from-black/50 to-transparent z-20 flex items-end justify-center gap-6 pb-6"><button onClick={() => setIsPaused(!isPaused)} className="w-14 h-14 bg-white/25 rounded-full flex items-center justify-center border-2 border-white/30">{isPaused ? <PlayIcon /> : <PauseIcon />}</button><button onClick={onEnd} className="w-16 h-16 bg-[#db7688]/90 rounded-full flex items-center justify-center border-[4px] border-white/30"><StopIcon /></button></div> }

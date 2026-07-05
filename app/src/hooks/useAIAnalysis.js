/**
 * useAIAnalysis — 封装 AI 感知管线逻辑
 *
 * 行为：
 *   - 每 captureIntervalMs 秒截帧 1 次 → API 提交
 *   - 每 aggregateIntervalMs 秒对 buffer 取平均 → 更新 UI state
 *   - 摄像头失败时自动降级到 Mock 分支（内部伪造数据）
 *
 * @param {object} opts
 * @param {boolean} opts.enabled - 是否启动感知
 * @param {boolean} opts.paused - 暂停（保持流但停止截帧）
 * @param {React.MutableRefObject} opts.videoRef - 摄像头 video element ref
 * @param {string} opts.sessionId
 * @param {() => number} opts.getElapsed - 获取当前学习秒数
 * @param {(result: object) => void} opts.onIntervention - 干预事件回调
 * @param {number} [opts.captureIntervalMs=3000]
 * @param {number} [opts.aggregateIntervalMs=30000]
 * @returns {{ displayState, faceFeatures, lastAnalysisTime, isAnalyzing, bufferCount }}
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { analyzeFace } from '../data/api.js'

export function useAIAnalysis({
  enabled,
  paused,
  videoRef,
  sessionId,
  getElapsed,
  onIntervention,
  captureIntervalMs = 3000,
  aggregateIntervalMs = 30000,
}) {
  const [displayState, setDisplayState] = useState(null)
  const [faceFeatures, setFaceFeatures] = useState(null)
  const [lastAnalysisTime, setLastAnalysisTime] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [bufferCount, setBufferCount] = useState(0)

  const bufferRef = useRef([])
  const captureTimerRef = useRef(null)
  const aggregateTimerRef = useRef(null)
  const prevLevelRef = useRef('NONE')
  const lastInterventionRef = useRef(0)

  /* 截帧 → 调 API → 推入 buffer */
  const captureAndAnalyze = useCallback(async () => {
    const video = videoRef?.current
    const canvas = document.createElement('canvas')
    let base64 = ''
    if (video && video.readyState >= 2) {
      try {
        canvas.width = 320; canvas.height = 240
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, 320, 240)
        base64 = canvas.toDataURL('image/jpeg', 0.7)
      } catch (e) { /* noop */ }
    }
    setIsAnalyzing(true)
    try {
      const result = await analyzeFace(sessionId, base64, getElapsed())
      bufferRef.current.push({
        focusScore: result.studyState.focusScore,
        fatigueScore: result.studyState.fatigueScore,
        distractionLevel: result.studyState.distractionLevel,
        emotion: result.studyState.emotion,
        eyeClosedRatio: result.faceFeatures.eyeClosedRatio,
        gazeDirection: result.faceFeatures.gazeDirection,
        headYawDeg: result.faceFeatures.headYawDeg,
        isUserPresent: result.faceFeatures.isUserPresent,
        intervention: result.intervention,
        ts: Date.now(),
      })
      setBufferCount(bufferRef.current.length)
      setFaceFeatures(result.faceFeatures)
      setLastAnalysisTime(Date.now())
    } catch (e) {
      console.warn('[AIAnalysis] capture failed:', e.message)
    } finally {
      setIsAnalyzing(false)
    }
  }, [videoRef, sessionId, getElapsed])

  /* 聚合 buffer → 生成 displayState */
  const aggregate = useCallback(() => {
    const buf = bufferRef.current
    if (buf.length === 0) return
    const avgInt = arr => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
    const mostFreq = arr => {
      const m = {}
      arr.forEach(v => { m[v] = (m[v] || 0) + 1 })
      return Object.entries(m).sort((a, b) => b[1] - a[1])[0][0]
    }
    const focusScore = avgInt(buf.map(b => b.focusScore))
    const fatigueScore = avgInt(buf.map(b => b.fatigueScore))
    const distractionLevel = mostFreq(buf.map(b => b.distractionLevel))
    const emotion = mostFreq(buf.map(b => b.emotion))
    const latest = buf[buf.length - 1]

    setDisplayState({
      sessionId,
      timestamp: Math.floor(Date.now() / 1000),
      elapsedSeconds: getElapsed(),
      focusScore, fatigueScore, distractionLevel, emotion,
      currentScene: 'study',
      isUserPresent: latest.isUserPresent,
      faceFeatures: {
        eyeClosedRatio: latest.eyeClosedRatio,
        gazeDirection: latest.gazeDirection,
        headYawDeg: latest.headYawDeg,
        isUserPresent: latest.isUserPresent,
      },
    })

    // 检查干预
    if (distractionLevel !== 'NONE' && distractionLevel !== prevLevelRef.current) {
      const trig = buf.find(b => b.intervention && b.intervention.level === distractionLevel)
      if (trig && getElapsed() - lastInterventionRef.current > 15) {
        lastInterventionRef.current = getElapsed()
        onIntervention?.(trig.intervention)
      }
    }
    if (distractionLevel !== prevLevelRef.current) prevLevelRef.current = distractionLevel

    bufferRef.current = []
    setBufferCount(0)
  }, [sessionId, getElapsed, onIntervention])

  /* 启停捕获 + 聚合定时器 */
  useEffect(() => {
    if (!enabled || paused) {
      clearInterval(captureTimerRef.current)
      clearInterval(aggregateTimerRef.current)
      return
    }
    // 立即截帧一次
    captureAndAnalyze()
    captureTimerRef.current = setInterval(captureAndAnalyze, captureIntervalMs)
    aggregateTimerRef.current = setInterval(aggregate, aggregateIntervalMs)
    return () => {
      clearInterval(captureTimerRef.current)
      clearInterval(aggregateTimerRef.current)
    }
  }, [enabled, paused, captureAndAnalyze, aggregate, captureIntervalMs, aggregateIntervalMs])

  return { displayState, faceFeatures, lastAnalysisTime, isAnalyzing, bufferCount }
}

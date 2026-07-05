/**
 * useAIAnalysis — 封装 AI 感知管线逻辑
 *
 * 行为：
 *   - 每 captureIntervalMs 秒截帧 1 次 → API 提交
 *   - 每 aggregateIntervalMs 秒对 buffer 取平均 → 更新 UI state
 *   - 摄像头失败时自动降级到 Mock 分支（内部伪造数据）
 *
 * 关键设计：
 *   - getElapsed / onIntervention 通过 ref 持有，不在 useEffect 依赖中
 *     避免 timer 每秒变化导致 callback 重建 → effect 重跑 → 死循环
 *   - canvas 复用，不每次截帧创建新 DOM 元素
 *   - captureAndAnalyze 和 aggregate 通过 ref 存储，timer 内读 ref
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
  const canvasRef = useRef(null)

  // 通过 ref 持有频繁变化的 callback/值，避免 callback 重建导致 effect 重跑
  const getElapsedRef = useRef(getElapsed)
  useEffect(() => { getElapsedRef.current = getElapsed }, [getElapsed])

  const onInterventionRef = useRef(onIntervention)
  useEffect(() => { onInterventionRef.current = onIntervention }, [onIntervention])

  const sessionIdRef = useRef(sessionId)
  useEffect(() => { sessionIdRef.current = sessionId }, [sessionId])

  /* 截帧 → 调 API → 推入 buffer */
  const captureAndAnalyzeFn = useCallback(async () => {
    const video = videoRef?.current
    // 复用 canvas，不每次创建 DOM 元素
    if (!canvasRef.current) canvasRef.current = document.createElement('canvas')
    const canvas = canvasRef.current
    let base64 = ''
    if (video && video.readyState >= 2) {
      try {
        canvas.width = 320; canvas.height = 240
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0, 320, 240)
        // canvas.toDataURL 返回 "data:image/jpeg;base64,xxx"，后端会再加一次前缀
        // 这里只取纯 base64 部分，避免双前缀导致 Qwen-VL 无法解析
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
        base64 = dataUrl.includes('base64,') ? dataUrl.split('base64,')[1] : dataUrl
      } catch (e) { /* noop */ }
    }
    setIsAnalyzing(true)
    try {
      const sid = sessionIdRef.current
      const elapsed = getElapsedRef.current()
      const result = await analyzeFace(sid, base64, elapsed)
      bufferRef.current.push({
        focusScore: result.studyState.focusScore,
        fatigueScore: result.studyState.fatigueScore,
        distractionLevel: result.studyState.distractionLevel,
        distractionCount: result.studyState.distractionCount || 0,  // 后端累积值
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
  }, [videoRef])

  /* 聚合 buffer → 生成 displayState */
  const aggregateFn = useCallback(() => {
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
    const sid = sessionIdRef.current
    const elapsed = getElapsedRef.current()

    setDisplayState({
      sessionId: sid,
      timestamp: Math.floor(Date.now() / 1000),
      elapsedSeconds: elapsed,
      focusScore, fatigueScore, distractionLevel, emotion,
      currentScene: 'study',
      isUserPresent: latest.isUserPresent,
      distractionCount: latest.distractionCount || 0,  // 后端累积值，非本地窗口
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
      if (trig && elapsed - lastInterventionRef.current > 15) {
        lastInterventionRef.current = elapsed
        onInterventionRef.current?.(trig.intervention)
      }
    }
    if (distractionLevel !== prevLevelRef.current) prevLevelRef.current = distractionLevel

    bufferRef.current = []
    setBufferCount(0)
  }, [])

  // 用 ref 保存最新的 callback，这样 timer 回调总拿到最新的实现
  const captureFnRef = useRef(captureAndAnalyzeFn)
  useEffect(() => { captureFnRef.current = captureAndAnalyzeFn }, [captureAndAnalyzeFn])

  const aggregateFnRef = useRef(aggregateFn)
  useEffect(() => { aggregateFnRef.current = aggregateFn }, [aggregateFn])

  /* 启停捕获 + 聚合定时器
   *
   * 依赖项只放 enabled / paused / captureIntervalMs / aggregateIntervalMs，
   * 不放 captureAndAnalyze 和 aggregate ——
   * timer 内部通过 ref 读取最新函数，避免每 tick 重建 effect。
   */
  useEffect(() => {
    if (!enabled || paused) {
      clearInterval(captureTimerRef.current)
      clearInterval(aggregateTimerRef.current)
      return
    }

    // 立即截帧一次
    captureFnRef.current()

    captureTimerRef.current = setInterval(() => {
      captureFnRef.current()
    }, captureIntervalMs)

    aggregateTimerRef.current = setInterval(() => {
      aggregateFnRef.current()
    }, aggregateIntervalMs)

    return () => {
      clearInterval(captureTimerRef.current)
      clearInterval(aggregateTimerRef.current)
    }
  }, [enabled, paused, captureIntervalMs, aggregateIntervalMs])

  return { displayState, faceFeatures, lastAnalysisTime, isAnalyzing, bufferCount }
}

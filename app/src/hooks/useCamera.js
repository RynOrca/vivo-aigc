/**
 * useCamera — 封装 getUserMedia 摄像头流
 *
 * @param {React.MutableRefObject} videoRef - <video> 元素的 ref
 * @param {boolean} enabled - 是否启用
 * @param {string} mode - 'front' | 'back'
 * @returns {{ stream, error, loading }}
 */
import { useState, useEffect, useRef } from 'react'

export function useCamera(videoRef, enabled, mode = 'front') {
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const streamRef = useRef(null)

  useEffect(() => {
    if (!enabled) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      setStream(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: mode, width: 640, height: 480 } })
      .then((s) => {
        if (cancelled) { s.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = s
        if (videoRef.current) videoRef.current.srcObject = s
        setStream(s)
      })
      .catch((e) => { if (!cancelled) setError(e.message || '摄像头未授权') })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => {
      cancelled = true
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [enabled, mode, videoRef])

  const stop = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach((t) => t.stop()); streamRef.current = null }
    setStream(null)
  }

  return { stream, error, loading, stop }
}

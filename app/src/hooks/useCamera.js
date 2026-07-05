/**
 * useCamera — 封装 getUserMedia 摄像头流
 *
 * 关键设计：
 *   - 用 streamIdRef 自增 ID 标识当前活跃实例，防止 React 18 StrictMode 双次 effect 时
 *     旧 stream 被新 stream 的 cleanup 杀死的竞争条件
 *   - enabled 切换时只影响当前实例（streamId 不同的旧实例自动失效）
 *
 * @param {React.MutableRefObject} videoRef - <video> 元素的 ref
 * @param {boolean} enabled - 是否启用
 * @param {string} mode - 'user' | 'environment' （WebRTC 标准 facingMode）
 * @returns {{ stream, error, loading, stop }}
 */
import { useState, useEffect, useRef } from 'react'

let _globalStreamId = 0

export function useCamera(videoRef, enabled, mode = 'user') {
  const [stream, setStream] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const streamRef = useRef(null)
  const ownerIdRef = useRef(0)

  useEffect(() => {
    if (!enabled) {
      // cleanup only if this hook instance owns the current stream
      if (streamRef.current && ownerIdRef.current === _globalStreamId) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        _globalStreamId++
      }
      setStream(null)
      return
    }

    const myId = ++_globalStreamId
    ownerIdRef.current = myId
    setLoading(true)
    setError(null)

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: mode, width: 640, height: 480 } })
      .then((s) => {
        // 有更年轻的 hook 实例已经启动了 → 丢弃这个旧 stream，避免"杀死新实例的流"
        if (myId !== _globalStreamId) { s.getTracks().forEach((t) => t.stop()); return }
        streamRef.current = s
        if (videoRef.current) videoRef.current.srcObject = s
        setStream(s)
      })
      .catch((e) => { if (myId === _globalStreamId) setError(e.message || '摄像头未授权') })
      .finally(() => { if (myId === _globalStreamId) setLoading(false) })

    return () => {
      // 只有这个实例仍然是最新的时候才清理
      if (myId === _globalStreamId && streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        _globalStreamId++
      }
    }
  }, [enabled, mode, videoRef])

  const stop = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
      _globalStreamId++
    }
    setStream(null)
  }

  return { stream, error, loading, stop }
}

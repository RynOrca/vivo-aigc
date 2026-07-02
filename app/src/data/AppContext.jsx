import React, { createContext, useContext, useReducer, useCallback } from 'react'

/**
 * 全局应用状态 — 跨页面共享
 * 解决 Dashboard / StatsPage 学习后数据不更新的问题
 */

const AppContext = createContext(null)

const initialState = {
  // 今日累计
  todayStudyMinutes: 0,
  todayEffectiveMinutes: 0,
  todaySessions: 0,

  // 历史累计
  totalSessions: 0,
  totalMinutes: 0,
  totalFocusScores: [], // 所有专注分采样，用于计算平均

  // 当前会话
  currentSession: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'COMPLETE_SESSION': {
      const { totalMinutes, focusHistory, distractionCount } = action.payload
      const avgFocus = focusHistory.length > 0
        ? Math.round(focusHistory.reduce((a, b) => a + b, 0) / focusHistory.length)
        : 78
      const effectiveMinutes = Math.round(totalMinutes * avgFocus / 100)

      return {
        ...state,
        todayStudyMinutes: state.todayStudyMinutes + totalMinutes,
        todayEffectiveMinutes: state.todayEffectiveMinutes + effectiveMinutes,
        todaySessions: state.todaySessions + 1,
        totalSessions: state.totalSessions + 1,
        totalMinutes: state.totalMinutes + totalMinutes,
        totalFocusScores: [...state.totalFocusScores, ...focusHistory],
        currentSession: {
          totalMinutes,
          effectiveMinutes,
          averageFocusScore: avgFocus,
          distractionCount,
          focusHistory,
          completedAt: Date.now(),
        },
      }
    }
    case 'RESET_TODAY':
      return {
        ...state,
        todayStudyMinutes: 0,
        todayEffectiveMinutes: 0,
        todaySessions: 0,
      }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const completeSession = useCallback((data) => {
    dispatch({ type: 'COMPLETE_SESSION', payload: data })
  }, [])

  // 计算派生数据
  const averageFocusScore = state.totalFocusScores.length > 0
    ? Math.round(state.totalFocusScores.reduce((a, b) => a + b, 0) / state.totalFocusScores.length)
    : 0

  const streakDays = state.todaySessions > 0 ? Math.min(state.totalSessions, 5) : 0

  const value = {
    ...state,
    averageFocusScore,
    streakDays,
    completeSession,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}

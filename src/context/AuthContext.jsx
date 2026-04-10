import { useCallback, useEffect, useMemo, useState } from 'react'
import { AuthContext } from './authContextValue'
import { API_BASE_URL, ApiError, apiRequest } from '../lib/apiClient'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [sessionError, setSessionError] = useState('')

  const refreshSession = useCallback(async () => {
    setLoadingSession(true)
    setSessionError('')

    try {
      const response = await apiRequest(API_BASE_URL, '/api/v1/auth/me')
      setUser(response?.user ?? null)
    } catch (error) {
      if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
        setUser(null)
      } else {
        setSessionError(error instanceof Error ? error.message : 'No se pudo validar la sesión.')
      }
    } finally {
      setLoadingSession(false)
    }
  }, [])

  useEffect(() => {
    refreshSession()
  }, [refreshSession])

  const login = useCallback(async ({ email, password }) => {
    const response = await apiRequest(API_BASE_URL, '/api/v1/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    await refreshSession()
    return response
  }, [refreshSession])

  const logout = useCallback(async () => {
    const response = await apiRequest(API_BASE_URL, '/api/v1/auth/logout', {
      method: 'POST',
    })
    setUser(null)
    return response
  }, [])

  const value = useMemo(
    () => ({
      user,
      loadingSession,
      sessionError,
      login,
      logout,
      refreshSession,
      isAuthenticated: Boolean(user),
    }),
    [loadingSession, login, logout, refreshSession, sessionError, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

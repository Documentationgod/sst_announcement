'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth, useClerk } from '@clerk/nextjs'
import { apiService, registerAuthTokenProvider } from '@/services/api'
import type { User } from '@/types'

export const AUTH_ERROR_STORAGE_KEY = 'sst:lastAuthError'

interface AppUserContextValue {
  user: User | null
  isLoading: boolean
  error: string | null
  refreshProfile: () => Promise<void>
  clearError: () => void
}

const AppUserContext = createContext<AppUserContextValue | undefined>(undefined)

export function useAppUser(): AppUserContextValue {
  const context = useContext(AppUserContext)
  if (!context) {
    throw new Error('useAppUser must be used within an AppUserProvider')
  }
  return context
}

interface ProviderProps {
  children: ReactNode
}

export function AppUserProvider({ children }: ProviderProps) {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { signOut } = useClerk()
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isSignedIn) {
      registerAuthTokenProvider(null)
      return
    }

    registerAuthTokenProvider(async () => {
      try {
        return (await getToken({ skipCache: true })) ?? null
      } catch (tokenError) {
        console.warn('Unable to fetch Clerk token', tokenError)
        return null
      }
    })

    return () => {
      registerAuthTokenProvider(null)
    }
  }, [isSignedIn, getToken])

  const persistErrorAndSignOut = useCallback(
    async (message: string) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_ERROR_STORAGE_KEY, message)
      }
      await signOut()
    },
    [signOut]
  )

  const fetchProfile = useCallback(async () => {
    if (!isLoaded) {
      return
    }

    if (!isSignedIn) {
      setUser(null)
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    try {
      const response = await apiService.getUserProfile()
      if (response.success && response.data) {
        setUser(response.data)
        setError(null)
      } else {
        const message = response.error || 'Unable to load profile'
        setUser(null)
        setError(message)
        if (message.toLowerCase().includes('domain access restricted')) {
          await persistErrorAndSignOut(message)
        }
      }
    } catch (profileError) {
      const message = profileError instanceof Error ? profileError.message : 'Unable to load profile'
      setUser(null)
      setError(message)
      // Sign out if it's a domain restriction error
      if (message.toLowerCase().includes('access denied') || 
          message.toLowerCase().includes('domain') || 
          message.toLowerCase().includes('restricted to scaler')) {
        await persistErrorAndSignOut(message)
      }
    } finally {
      setIsLoading(false)
    }
  }, [isLoaded, isSignedIn, persistErrorAndSignOut])

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      error,
      refreshProfile: fetchProfile,
      clearError,
    }),
    [user, isLoading, error, fetchProfile, clearError]
  )

  return <AppUserContext.Provider value={value}>{children}</AppUserContext.Provider>
}

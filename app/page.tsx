'use client'

import { useAuth, SignedIn, SignedOut } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import Dashboard from '@/components/pages/Dashboard'
import AllAnnouncements from '@/components/pages/AllAnnouncements'
import Login from '@/components/pages/Login'
import { AppUserProvider, useAppUser } from '@/contexts/AppUserContext'

function AppContent() {
  const { user, isLoading, error } = useAppUser()
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'all-announcements'>('dashboard')

  useEffect(() => {
    const path = window.location.pathname
    if (path === '/all-announcements') {
      setCurrentPage('all-announcements')
    } else {
      setCurrentPage('dashboard')
    }
  }, [])

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (path === '/all-announcements') {
        setCurrentPage('all-announcements')
      } else {
        setCurrentPage('dashboard')
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const handleViewAllAnnouncements = () => {
    setCurrentPage('all-announcements')
    window.history.pushState({}, '', '/all-announcements')
  }

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard')
    window.history.pushState({}, '', '/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <div className="w-32 h-4 bg-white/20 rounded-lg mx-auto animate-pulse"></div>
            <div className="w-24 h-3 bg-white/10 rounded-lg mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 text-center">
          <p className="text-white/80 text-lg">{error || 'Unable to load your profile. Please try signing in again.'}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {currentPage === 'all-announcements' ? (
        <AllAnnouncements onBackToDashboard={handleBackToDashboard} />
      ) : (
        <Dashboard onViewAllAnnouncements={handleViewAllAnnouncements} />
      )}
    </>
  )
}

export default function Home() {
  const { isLoaded } = useAuth()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-32 h-4 bg-white/20 rounded-lg mx-auto animate-pulse"></div>
          <div className="w-24 h-3 bg-white/10 rounded-lg mx-auto animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <>
      <SignedIn>
        <AppUserProvider>
          <AppContent />
        </AppUserProvider>
      </SignedIn>
      <SignedOut>
        <Login />
      </SignedOut>
    </>
  )
}

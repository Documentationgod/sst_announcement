'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import AttachmentList from '../ui/AttachmentList'
import { apiService } from '@/services/api'
import type { Announcement } from '@/types'
import type { AnnouncementFile } from '@/lib/types'
import { useAppUser } from '@/contexts/AppUserContext'
import { isAnnouncementExpired, formatDateTime } from '@/utils/dateUtils'
import { getCategoryColor, getCategoryIcon } from '@/constants/categoryStyles'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '../ui/toast'
import { normalizeUserRole, type UserRole } from '@/utils/announcementUtils'
import { parseLinks } from '@/utils/linkParser'

interface AllAnnouncementsProps {
  onBackToDashboard: () => void
}

const AllAnnouncements: React.FC<AllAnnouncementsProps> = ({ onBackToDashboard }) => {
  const { user } = useAppUser()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [attachmentsMap, setAttachmentsMap] = useState<Record<string, AnnouncementFile[]>>({})
  const { toasts, showToast, removeToast } = useToast()

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  useEffect(() => {
    // Fetch attachments for all announcements
    announcements.forEach(async (announcement) => {
      if (announcement.id) {
        try {
          const response = await apiService.getAnnouncementAttachments(announcement.id.toString())
          if (response.success && response.data) {
            setAttachmentsMap(prev => ({
              ...prev,
              [announcement.id!]: response.data!
            }))
          }
        } catch (error) {
          console.error(`Error fetching attachments for announcement ${announcement.id}:`, error)
        }
      }
    })
  }, [announcements])

  const fetchAnnouncements = async () => {
    try {
      setLoading(true)
      const response = await apiService.getAnnouncements()
      if (response.success && response.data) {
        setAnnouncements(response.data)
      } else {
        showToast('Failed to load announcements', 'error')
      }
    } catch (error) {
      console.error('Error fetching announcements:', error)
      showToast('Error loading announcements', 'error')
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', 'general', 'academic', 'sil', 'clubs']

  // Determine user role (kept for future extensions if needed)
  const derivedRole: UserRole = normalizeUserRole(user?.role, user?.is_admin)

  // Filter announcements only by category and search
  const filteredAnnouncements = announcements
    .filter(announcement => {
      if (selectedCategory === 'all') return true
      return announcement.category === selectedCategory
    })
    .filter(announcement => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return (
        announcement.title.toLowerCase().includes(query) ||
        announcement.description.toLowerCase().includes(query)
      )
    })

  // Show all filtered announcements (no pagination on this page)
  const displayedAnnouncements = filteredAnnouncements

  return (
    <div className="min-h-screen bg-gray-950">  
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              All Announcements
            </h1>
            <p className="text-gray-400">Browse all announcements from the SST community</p>
          </div>
          <Button
            onClick={onBackToDashboard}
            variant="outline"
            className="w-full md:w-auto border-gray-700 text-gray-300 bg-transparent hover:bg-gray-800 hover:text-white transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 border border-gray-800/50 mb-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                type="text"
                placeholder="Search announcements..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <span className="text-sm text-gray-400 whitespace-nowrap">{filteredAnnouncements.length} announcements found</span>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                  className={`${
                    selectedCategory === category 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white border-transparent' 
                      : 'bg-gray-800/30 border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {category === 'all' ? 'All' : category === 'sil' ? 'SIL' : category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Announcements Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-900/50 border border-gray-800/50 rounded-2xl p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-3/4 h-5 bg-gray-800 rounded-lg"></div>
                  <div className="w-16 h-6 bg-gray-800 rounded-full"></div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="w-full h-3 bg-gray-800 rounded-lg"></div>
                  <div className="w-4/5 h-3 bg-gray-800 rounded-lg"></div>
                  <div className="w-3/5 h-3 bg-gray-800 rounded-lg"></div>
                </div>
                <div className="flex justify-between">
                  <div className="w-20 h-3 bg-gray-800 rounded-lg"></div>
                  <div className="w-16 h-3 bg-gray-800 rounded-lg"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedAnnouncements.map((announcement, index) => {
                const isEmergency = announcement.is_emergency || false
                const isExpired = isAnnouncementExpired(announcement)
                return (
                <Card 
                  key={announcement.id} 
                  className={`group relative overflow-hidden backdrop-blur-sm border transition-all duration-300 ${
                    isExpired 
                      ? 'opacity-60 grayscale bg-gray-800/30 border-gray-700/30 pointer-events-none' 
                      : `hover:-translate-y-1 hover:shadow-xl ${
                          isEmergency
                            ? 'bg-red-900/30 border-red-500/50 hover:border-red-400 hover:shadow-red-500/20'
                            : 'bg-gray-900/50 border-gray-800/50 hover:border-gray-700 hover:shadow-gray-900/50'
                        }`
                  }`}
                >
                  {/* Category accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1 ${
                    isExpired ? 'bg-gray-600' : (isEmergency ? 'bg-red-500' : 'bg-blue-500')
                  }`}></div>
                  
                  <CardHeader className="relative p-4 md:p-6 pb-4 md:pb-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        {isExpired && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-600/50 text-gray-300">
                            ⏰ EXPIRED
                          </span>
                        )}
                        {isEmergency && !isExpired && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                            🚨 EMERGENCY
                          </span>
                        )}
                        
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isExpired 
                            ? 'bg-gray-600/50 text-gray-400' 
                            : (isEmergency 
                                ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30')
                        }`}>
                          {announcement.category === 'sil' ? 'SIL' : announcement.category.charAt(0).toUpperCase() + announcement.category.slice(1).replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-lg md:text-xl font-bold text-white leading-tight select-text cursor-text mb-2">
                      {announcement.title}
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="relative p-4 md:p-6 pt-0 md:pt-0 space-y-4">
                    {/* Description Section */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-700/50">
                        <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h4 className="text-sm font-bold text-green-400 uppercase tracking-wide">Description</h4>
                      </div>
                      <CardDescription className="text-sm text-gray-300 leading-relaxed select-text cursor-text">
                        {parseLinks(announcement.description)}
                      </CardDescription>
                    </div>
                    
                    {/* Attachments */}
                    {((announcement.id && attachmentsMap[announcement.id] && attachmentsMap[announcement.id].length > 0) || announcement.url) && (
                      <AttachmentList attachments={announcement.id ? (attachmentsMap[announcement.id] || []) : []} url={announcement.url} />
                    )}
                    
                    {/* Metadata */}
                    <div className="space-y-2 pt-4 border-t border-gray-800/30">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="select-text cursor-text">
                            {announcement.created_at ? new Date(announcement.created_at).toLocaleDateString() : 'Unknown date'}
                          </span>
                        </div>
                        {announcement.expiry_date && (
                          <div className="flex items-center gap-2 text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="select-text cursor-text">
                              Expires {new Date(announcement.expiry_date).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Display Deadlines */}
                      {announcement.deadlines && announcement.deadlines.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          {announcement.deadlines.map((deadline, idx) => {
                            const deadlineDate = new Date(deadline.date);
                            const isPassed = deadlineDate < new Date();
                            return (
                              <div key={idx} className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-lg ${
                                isPassed 
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                                  : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                              }`}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>
                                  {deadline.label}: {formatDateTime(deadline.date, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                                  {isPassed && <span className="ml-1">(Passed)</span>}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                )
              })}
            </div>

            {filteredAnnouncements.length === 0 && !loading && (
              <div className="text-center py-16 bg-gray-900/30 rounded-2xl border border-gray-800/50">
                <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-300 mb-2">No announcements found</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {selectedCategory === 'all' 
                    ? 'There are no announcements available at the moment. Check back later for updates.'
                    : `No announcements found in the "${selectedCategory.replace('-', ' ')}" category. Try selecting a different category.`
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}

export default AllAnnouncements
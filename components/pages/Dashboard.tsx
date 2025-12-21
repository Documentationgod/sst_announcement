import React, { useState, useRef, useEffect, useMemo } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import AttachmentList from '../ui/AttachmentList';
import { apiService } from '@/services/api';
import type { Announcement, User, CreateAnnouncementData, UpdateAnnouncementData } from '@/types';
import type { AttachmentUpload, AnnouncementFile } from '@/lib/types';
import { useAppUser } from '@/contexts/AppUserContext';
import { isAnnouncementExpired, formatDateTime } from '@/utils/dateUtils';
import {
  isVisibleToUser, 
  filterByCategory, 
  searchAnnouncements, 
  sortAnnouncementsByPriority,
  filterAnnouncementsByRole,
  canPerformAdminActions,
  canManageUsers,
  normalizeUserRole,
  type UserRole
} from '@/utils/announcementUtils';
import { getCategoryAccentClasses } from '@/constants/categoryStyles';
import { useCountUp } from '@/hooks/useCountUp';
import {
  CreateAnnouncementModal,
  EditAnnouncementModal,
  DeleteConfirmModal,
  UserManagementModal,
} from '../modals';
import { ToastContainer } from '../ui/toast';
import { useToast } from '@/hooks/useToast';
import '@/styles/Dashboard.css';
import { useClerk } from '@clerk/nextjs';
import { extractIntakeCodeFromEmail } from '@/utils/studentYear';
import { parseLinks } from '@/utils/linkParser';

interface DashboardProps {
  onViewAllAnnouncements: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onViewAllAnnouncements }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [userManagementLoading, setUserManagementLoading] = useState(false);
  const [createModalVariant, setCreateModalVariant] = useState<'standard' | 'emergency'>('standard');
  const [createInitialData, setCreateInitialData] = useState<Partial<CreateAnnouncementData> | undefined>(undefined);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { user } = useAppUser();
  const { signOut } = useClerk();
  const { toasts, showToast, removeToast } = useToast();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [announcementsToShow, setAnnouncementsToShow] = useState<number>(5);
  const [attachmentsMap, setAttachmentsMap] = useState<Record<string, AnnouncementFile[]>>({});
  const fetchingAttachments = useRef<Set<number>>(new Set());

  // Determine user role with proper normalization for backward compatibility
  const derivedRole: UserRole = normalizeUserRole(user?.role, user?.is_admin);
  const isSuperAdmin = derivedRole === 'super_admin';
  const canManageOtherUsers = canManageUsers(derivedRole);
  const canDoAdminActions = canPerformAdminActions(derivedRole);
  
  
  
  // Filter and prioritize announcements based on user role
  const userIntakeCode = user?.email ? extractIntakeCodeFromEmail(user.email) : null;
  const visibleAnnouncements = announcements.filter(a => 
    isVisibleToUser(
      a, 
      derivedRole,
      user?.is_admin || false, 
      user?.id, 
      user?.role === 'super_admin',
      userIntakeCode
    )
  );

  const filteredByRole = filterAnnouncementsByRole(visibleAnnouncements, derivedRole);
  const prioritizedAnnouncements = sortAnnouncementsByPriority(filteredByRole, derivedRole);
  const totalVisibleCount = useCountUp(visibleAnnouncements.length);
  const academicCount = useCountUp(visibleAnnouncements.filter(a => a.category.toLowerCase() === 'academic').length);
  const silCount = useCountUp(visibleAnnouncements.filter(a => a.category.toLowerCase() === 'sil').length);

  const filteredAnnouncements = searchAnnouncements(
    filterByCategory(prioritizedAnnouncements, filterCategory),
    searchQuery
  );

  // Custom sorting for Recent Announcements: prioritize emergency, then expired, then deadline announcements
  const sortedForRecentAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    const now = new Date();

    // Highest priority: Emergency announcements always on top
    const aIsEmergency = a.is_emergency || false;
    const bIsEmergency = b.is_emergency || false;
    if (aIsEmergency && !bIsEmergency) return -1;
    if (!aIsEmergency && bIsEmergency) return 1;
    
    // Check if expired
    const aIsExpired = isAnnouncementExpired(a) || a.status === 'expired';
    const bIsExpired = isAnnouncementExpired(b) || b.status === 'expired';
    
    // Check if has deadlines
    const aHasDeadlines = a.deadlines && Array.isArray(a.deadlines) && a.deadlines.length > 0;
    const bHasDeadlines = b.deadlines && Array.isArray(b.deadlines) && b.deadlines.length > 0;
    
    
    if (aIsExpired && !bIsExpired) return -1;
    if (!aIsExpired && bIsExpired) return 1;
    
    if (aIsExpired && bIsExpired) {
      const aExpiry = a.expiry_date ? new Date(a.expiry_date) : null;
      const bExpiry = b.expiry_date ? new Date(b.expiry_date) : null;
      if (aExpiry && bExpiry) {
        return bExpiry.getTime() - aExpiry.getTime(); // Most recent expiry first
      }
      if (aExpiry) return -1;
      if (bExpiry) return 1;
    }
    
    if (aHasDeadlines && !bHasDeadlines) return -1;
    if (!aHasDeadlines && bHasDeadlines) return 1;
    
    // Both have deadlines - sort by nearest deadline
    if (aHasDeadlines && bHasDeadlines) {
      let aNearestDeadline: Date | null = null;
      let bNearestDeadline: Date | null = null;
      
      // Find nearest deadline for a
      for (const deadline of a.deadlines!) {
        if (deadline.date) {
          const deadlineDate = new Date(deadline.date);
          if (!isNaN(deadlineDate.getTime())) {
            if (!aNearestDeadline || deadlineDate < aNearestDeadline) {
              aNearestDeadline = deadlineDate;
            }
          }
        }
      }
      
      // Find nearest deadline for b
      for (const deadline of b.deadlines!) {
        if (deadline.date) {
          const deadlineDate = new Date(deadline.date);
          if (!isNaN(deadlineDate.getTime())) {
            if (!bNearestDeadline || deadlineDate < bNearestDeadline) {
              bNearestDeadline = deadlineDate;
            }
          }
        }
      }
      
      if (aNearestDeadline && bNearestDeadline) {
        return aNearestDeadline.getTime() - bNearestDeadline.getTime(); // Sooner deadline first
      }
      if (aNearestDeadline) return -1;
      if (bNearestDeadline) return 1;
    }
    
    // Default: maintain original order (already sorted by priority)
    return 0;
  });

  // Reset announcements count when filters change
  useEffect(() => {
    setAnnouncementsToShow(5);
  }, [searchQuery, filterCategory]);

  // Get the announcements to display (first N announcements) - memoized to prevent recalculation
  const displayedAnnouncements = useMemo(
    () => sortedForRecentAnnouncements.slice(0, announcementsToShow),
    [sortedForRecentAnnouncements, announcementsToShow]
  );
  const hasMoreAnnouncements = sortedForRecentAnnouncements.length > announcementsToShow;

  // Fetch attachments only when announcement is expanded (lazy loading)
  const fetchAttachments = async (announcementId: number) => {
    // Skip if already fetched or currently fetching
    if (attachmentsMap[announcementId] || fetchingAttachments.current.has(announcementId)) {
      return;
    }

    // Mark as fetching
    fetchingAttachments.current.add(announcementId);

    try {
      const response = await apiService.getAnnouncementAttachments(announcementId.toString());
      if (response.success && response.data) {
        setAttachmentsMap(prev => ({
          ...prev,
          [announcementId]: response.data!
        }));
      }
    } catch (error) {
      console.error(`Error fetching attachments for announcement ${announcementId}:`, error);
    } finally {
      // Remove from fetching set
      fetchingAttachments.current.delete(announcementId);
    }
  };

  // Preload attachments for displayed announcements (recent 5)
  useEffect(() => {
    displayedAnnouncements.forEach((announcement) => {
      if (announcement.id) {
        // Only fetch if we don't already have the data
        if (!attachmentsMap[announcement.id] && !fetchingAttachments.current.has(announcement.id)) {
          fetchAttachments(announcement.id);
        }
      }
    });
  }, [displayedAnnouncements, attachmentsMap]);

  // Clicking an announcement will record a 'view' event instead of auto-tracking on render
  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setShowEditForm(true);
  };

  const handleCreateAnnouncement = async (data: CreateAnnouncementData, attachments?: AttachmentUpload[]) => {
    setCreateLoading(true);
    try {
      const response = await apiService.createAnnouncement(data);
      if (response.success) {
        // Handle both response structures: direct Announcement or wrapped { announcement: ... }
        const announcementId = (response.data as any)?.announcement?.id ?? (response.data as any)?.id;
        console.log('[Dashboard] Announcement created:', announcementId);
        console.log('[Dashboard] Attachments to upload:', attachments?.length || 0);
        
        // Upload attachments if any and if announcement was created successfully
        if (attachments && attachments.length > 0 && announcementId) {
          const announcementIdStr = announcementId.toString();
          console.log('[Dashboard] Starting attachment uploads for announcement:', announcementIdStr);
          
          // Upload each attachment
          const uploadPromises = attachments.map(async (attachment, index) => {
            console.log('[Dashboard] Uploading file:', attachment.file.name, 'Size:', attachment.file.size);
            const formData = new FormData();
            formData.append('file', attachment.file);
            formData.append('displayOrder', index.toString());

            try {
              const uploadResponse = await fetch(`/api/announcements/${announcementIdStr}/attachments`, {
                method: 'POST',
                body: formData,
              });

              const result = await uploadResponse.json();
              if (!result.success) {
                throw new Error(result.error || 'Upload failed');
              }

              return { success: true, index };
            } catch (error: any) {
              return { success: false, index, error: error.message };
            }
          });

          const uploadResults = await Promise.allSettled(uploadPromises);
          const failedUploads = uploadResults.filter(
            (result): result is PromiseRejectedResult | PromiseFulfilledResult<{ success: false; index: number; error: string }> => 
              result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)
          );

          if (failedUploads.length > 0) {
            showToast(`Announcement created, but ${failedUploads.length} attachment(s) failed to upload`, 'info');
          }
        }
        
        const announcementsResponse = await apiService.getAnnouncements();
        if (announcementsResponse.success && announcementsResponse.data) {
          setAnnouncements(Array.isArray(announcementsResponse.data) ? announcementsResponse.data : []);
        }
        setShowCreateForm(false);
        setCreateInitialData(undefined);
        setCreateModalVariant('standard');
        
        // Show success message based on user role
        const announcement = (response.data as any)?.announcement ?? response.data;
        if (user?.role !== 'super_admin') {
          // Regular admin: announcement goes to review
          showToast(
            attachments && attachments.length > 0 
              ? 'Announcement with attachments created successfully! Sent to superadmin for review.'
              : 'Announcement created successfully! Sent to superadmin for review.',
            'success'
          );
        } else if (announcement?.scheduled_at) {
          // Superadmin with scheduled date
          showToast(
            `Announcement created successfully! Scheduled for ${formatDateTime(announcement.scheduled_at)}`,
            'success'
          );
        } else {
          showToast(
            attachments && attachments.length > 0 
              ? 'Announcement with attachments created successfully!'
              : 'Announcement created successfully!',
            'success'
          );
        }
      } else {
        showToast(response.error || 'Failed to create announcement', 'error');
      }
    } catch (error) {
      console.error('Failed to create announcement:', error);
      showToast('An error occurred while creating the announcement', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateAnnouncement = async (id: number, data: UpdateAnnouncementData, attachments?: AttachmentUpload[]) => {
    setEditLoading(true);
    try {
      const response = await apiService.updateAnnouncement(id, data);
      if (response.success) {
        // Upload attachments if any
        if (attachments && attachments.length > 0) {
          console.log('[Dashboard] Uploading attachments for announcement:', id);
          const uploadPromises = attachments.map(async (attachment, index) => {
            const formData = new FormData();
            formData.append('file', attachment.file);
            formData.append('displayOrder', index.toString());

            try {
              const uploadResponse = await fetch(`/api/announcements/${id}/attachments`, {
                method: 'POST',
                body: formData,
              });

              const result = await uploadResponse.json();
              if (!result.success) {
                throw new Error(result.error || 'Upload failed');
              }

              return { success: true, index };
            } catch (error: any) {
              console.error(`[Dashboard] Failed to upload attachment ${index}:`, error);
              return { success: false, index, error: error.message };
            }
          });

          const uploadResults = await Promise.allSettled(uploadPromises);
          const failedUploads = uploadResults.filter(
            (result) => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success)
          );

          if (failedUploads.length > 0) {
            console.warn('[Dashboard] Some attachments failed to upload:', failedUploads);
            showToast(`Announcement updated, but ${failedUploads.length} attachment(s) failed to upload`, 'error');
          }
        }
        
        const announcementsResponse = await apiService.getAnnouncements();
        if (announcementsResponse.success && announcementsResponse.data) {
          setAnnouncements(Array.isArray(announcementsResponse.data) ? announcementsResponse.data : []);
        }
        setShowEditForm(false);
        setEditingAnnouncement(null);
        showToast(
          attachments && attachments.length > 0 
            ? 'Announcement with attachments updated successfully!' 
            : 'Announcement updated successfully!', 
          'success'
        );
      } else {
        showToast(response.error || 'Failed to update announcement', 'error');
      }
    } catch (error) {
      console.error('Failed to update announcement:', error);
      showToast('An error occurred while updating the announcement', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    setDeleteLoading(id);
    try {
      const response = await apiService.deleteAnnouncement(id);
      if (response.success) {
        const announcementsResponse = await apiService.getAnnouncements();
        if (announcementsResponse.success && announcementsResponse.data) {
          setAnnouncements(Array.isArray(announcementsResponse.data) ? announcementsResponse.data : []);
        }
        setShowDeleteConfirm(null);
        showToast('Announcement deleted successfully!', 'success');
      } else {
        showToast(response.error || 'Failed to delete announcement', 'error');
      }
    } catch (error) {
      console.error('Failed to delete announcement:', error);
      showToast('An error occurred while deleting the announcement', 'error');
    } finally {
      setDeleteLoading(null);
    }
  };

  const fetchUsers = async () => {
    setUserManagementLoading(true);
    try {
      const response = await apiService.getAllUsers();
      if (response.success && response.data) {
        setUsers(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setUserManagementLoading(false);
    }
  };

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await apiService.getAnnouncements();
        if (response.success && response.data) {
          setAnnouncements(Array.isArray(response.data) ? response.data : []);
        } else {
          setAnnouncements([]);
        }
      } catch (error) {
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const getCategoryColor = (category: string) => {
    const normalized = category.toLowerCase();
    if (['general', 'clubs'].includes(normalized)) {
      return 'default';
    }
    if (['academic', 'sil'].includes(normalized)) {
      return 'secondary';
    }
    return 'outline';
  };

  return (
    <div className="dashboard relative min-h-screen bg-black">
      <div className="relative z-10">
        <header
          className="dashboard-header flex flex-col md:flex-row items-center justify-between px-6 py-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-b border-white/10 shadow-lg"
          role="navigation"
          aria-label="Top Navigation"
        >
          {/* Left Section — Logo + Title */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-white/10 hover:scale-105 transition-transform duration-200">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent tracking-tight">
                SST Announcements
              </h1>
              <p className="text-sm text-gray-400">
                Welcome back, <span className="font-semibold">{user?.username || user?.email?.split('@')[0] || 'Student'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <div
              className="user-info flex items-center gap-4 bg-white/5 px-3 py-2 rounded-xl hover:bg-white/10 transition"
              aria-label="Current user"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 via-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md ring-2 ring-white/20">
                {(user?.username || user?.email)?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col">
                <span
                  className="text-sm font-medium text-white truncate max-w-[150px]"
                  title={user?.username || user?.email || ""}
                >
                  {user?.username || user?.email}
                </span>
                {user && (
                  <div className="flex items-center gap-1 mt-1">
                    {(() => {
                      const roleConfig = {
                        super_admin: { label: 'SUPER ADMIN', color: 'bg-purple-400', textColor: 'text-purple-300' },
                        admin: { label: 'ADMIN', color: 'bg-blue-400', textColor: 'text-blue-300' },
                        student_admin: { label: 'STUDENT ADMIN', color: 'bg-green-400', textColor: 'text-green-300' },
                        student: { label: 'STUDENT', color: 'bg-gray-400', textColor: 'text-gray-300' },
                      };
                      const config = roleConfig[derivedRole as keyof typeof roleConfig] || roleConfig.student;
                      return (
                        <>
                          <div className={`w-2 h-2 ${config.color} rounded-full`}></div>
                          <span className={`text-xs font-semibold ${config.textColor}`}>{config.label}</span>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {canManageOtherUsers && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setShowUserManagement(true);
                  await fetchUsers();
                }}
                className="group border-white/20 hover:bg-white/10 hover:border-white/40 transition-all duration-200 text-white"
                title="Manage Users"
              >
                <svg
                  className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
                <span className="ml-2 hidden md:inline">Manage Users</span>
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="logout-button group border-white/20 hover:bg-red-500 hover:border-white/40 transition-all duration-200 text-white"
            >
              <svg
                className="w-4 h-4 group-hover:rotate-12 transition-transform duration-200"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </Button>
          </div>
        </header>

        <main className="dashboard-content p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Admin Actions Card */}
            {canDoAdminActions && (
              <Card className="bg-gray-900/80 backdrop-blur-xl border border-gray-800/60 shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 animate-in fade-in slide-in-from-top duration-500">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
                        <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                        </svg>
                      </div>

                      <div>
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-1">Admin Controls</h3>
                        <p className="text-sm md:text-base text-gray-400">Manage your announcements</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 justify-center w-full lg:w-auto">
                      <Button
                        onClick={() => {
                          setCreateModalVariant('standard');
                          setCreateInitialData(undefined);
                          setShowCreateForm(true);
                        }}
                        aria-label="Create Announcement"
                        className="flex-1 lg:flex-none bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-4 md:px-8 md:py-6 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 hover:shadow-xl hover:shadow-purple-500/50 group"
                      >
                        <svg className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create
                      </Button>

                      {isSuperAdmin && (
                        <Button
                          onClick={() => {
                            setCreateModalVariant('emergency');
                            setCreateInitialData({
                              title: 'Emergency Broadcast',
                              status: 'urgent',
                              send_email: true,
                              is_active: true,
                            });
                            setShowCreateForm(true);
                          }}
                          aria-label="Trigger Emergency Broadcast"
                          className="flex-1 lg:flex-none bg-gradient-to-r from-red-700 via-red-600 to-orange-500 hover:from-red-800 hover:via-red-700 hover:to-orange-600 text-white font-semibold px-6 py-4 md:px-8 md:py-6 rounded-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 hover:shadow-xl hover:shadow-red-600/50 group"
                        >
                          <svg className="w-5 h-5 mr-2 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 18a2 2 0 01-1 1.732l-7 4a2 2 0 01-2 0l-7-4A2 2 0 013 18V6a2 2 0 011-1.732l7-4a2 2 0 012 0l7 4A2 2 0 0121 6z" />
                          </svg>
                          Emergency Alert
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="group relative overflow-hidden bg-gray-900/80 backdrop-blur-xl border border-gray-800/60 shadow-xl hover:shadow-2xl hover:shadow-blue-900/30 transition-all duration-300 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="relative p-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="text-4xl font-black bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                        {totalVisibleCount}
                      </div>
                      <p className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Total Announcements</p>
                    </div>
                    
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-gray-900/80 backdrop-blur-xl border border-gray-800/60 shadow-xl hover:shadow-2xl hover:shadow-purple-900/30 transition-all duration-300 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom duration-600">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="relative p-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="text-4xl font-black bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                        {academicCount}
                      </div>
                      <p className="text-gray-400 font-semibold text-sm uppercase tracking-wider">Academic</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="group relative overflow-hidden bg-gray-900/80 backdrop-blur-xl border border-gray-800/60 shadow-xl hover:shadow-2xl hover:shadow-emerald-900/30 transition-all duration-300 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom duration-700">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <CardContent className="relative p-8">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="text-4xl font-black bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                        {silCount}
                      </div>
                      <p className="text-gray-400 font-semibold text-sm uppercase tracking-wider">SIL</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900/80 backdrop-blur-xl border border-gray-800/60 shadow-2xl animate-in fade-in slide-in-from-bottom duration-800">
              <CardHeader className="border-b border-gray-800/60 pb-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-bold text-white mb-2">Recent Announcements</CardTitle>
                    <CardDescription className="text-gray-400">Stay updated with the latest news</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search announcements..."
                      className="flex-1 md:flex-initial h-11 w-full md:w-72 px-4 rounded-xl bg-slate-800/60 border-slate-700 text-gray-200 placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <Select
                      value={filterCategory}
                      onValueChange={(value) => setFilterCategory(value)}
                    >
                      <SelectTrigger className="h-11 w-full md:w-[140px] rounded-xl bg-slate-800/60 border-slate-700 text-gray-200 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-gray-200">
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="sil">SIL</SelectItem>
                        <SelectItem value="clubs">Clubs</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={onViewAllAnnouncements} className="h-11 w-full md:w-auto border-slate-600 text-gray-300 hover:bg-slate-800 hover:text-white hover:border-slate-500 transition-all duration-200">
                      View All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-20 bg-slate-800/50 rounded-2xl animate-pulse"></div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {displayedAnnouncements.map((a, index) => {
                      const priorityUntil = a.priority_until ? new Date(a.priority_until) : null;
                      const isPriorityActive =
                        !!priorityUntil &&
                        !isNaN(priorityUntil.getTime()) &&
                        priorityUntil > new Date() &&
                        (a.status?.toLowerCase() === 'urgent');
                      const isEmergency = a.is_emergency || false;
                      const showStatusBadge =
                        !!a.status &&
                        a.status.toLowerCase() !== 'approved' &&
                        !(isEmergency && a.status.toLowerCase() === 'urgent') &&
                        (user?.is_admin || user?.role === 'super_admin');
                      
                      // Check for approaching expiry dates or deadlines (within 7 days) - ONLY for students
                      const isStudent = derivedRole === 'student';
                      let hasApproachingDate = false;
                      let nearestApproachingDate: Date | null = null;
                      let approachingDateLabel: string | null = null;
                      
                      if (isStudent) {
                        const now = new Date();
                        const WARNING_DAYS = 7;
                        const warningThreshold = new Date(now.getTime() + WARNING_DAYS * 24 * 60 * 60 * 1000);
                        
                        // Check expiry date
                        if (a.expiry_date) {
                          const expiryDate = new Date(a.expiry_date);
                          if (!isNaN(expiryDate.getTime()) && expiryDate > now && expiryDate <= warningThreshold) {
                            nearestApproachingDate = expiryDate;
                            approachingDateLabel = 'Expires';
                            hasApproachingDate = true;
                          }
                        }
                        
                        // Check deadlines
                        if (a.deadlines && Array.isArray(a.deadlines) && a.deadlines.length > 0) {
                          for (const deadline of a.deadlines) {
                            if (deadline.date) {
                              const deadlineDate = new Date(deadline.date);
                              if (!isNaN(deadlineDate.getTime()) && deadlineDate > now && deadlineDate <= warningThreshold) {
                                if (!nearestApproachingDate || deadlineDate < nearestApproachingDate) {
                                  nearestApproachingDate = deadlineDate;
                                  approachingDateLabel = deadline.label || 'Deadline';
                                  hasApproachingDate = true;
                                }
                              }
                            }
                          }
                        }
                      }

                      return (
                        <div
                          key={a.id}
                          className={`group relative overflow-hidden rounded-2xl border backdrop-blur-sm transition-all duration-300 animate-in fade-in slide-in-from-left cursor-pointer ${(isAnnouncementExpired(a) || a.status === 'expired') ? 'opacity-70 grayscale' : ''} ${
                            isEmergency || isPriorityActive
                              ? 'bg-gradient-to-r from-red-900/60 to-red-800/40 border-red-500/50 hover:border-red-400 hover:shadow-xl hover:shadow-red-500/30 border-l-4 border-l-red-500'
                              : hasApproachingDate
                              ? 'bg-gradient-to-r from-orange-900/60 to-orange-800/40 border-orange-500/50 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-500/30 border-l-4 border-l-orange-500'
                              : `bg-gradient-to-r from-slate-800/60 to-slate-800/40 border-slate-600 hover:border-slate-600 hover:shadow-xl ${getCategoryAccentClasses(a.category)}`
                          }`}
                          style={{ animationDelay: `${index * 100}ms` }}
                          onClick={(e) => {
                            // Don't toggle card if a modal/viewer is currently open (z-index 60)
                            const modalOpen = document.querySelector('.fixed.z-\\[60\\]');
                            if (modalOpen) return;
                            
                            const nextId = expandedId === a.id ? null : (a.id ?? null);
                            setExpandedId(nextId);
                            // Fetch attachments when expanding
                            if (nextId && a.id) {
                              fetchAttachments(a.id);
                            }
                          }}
                        >
                          <div className="relative flex flex-col sm:flex-row items-start justify-between p-4 md:p-6 gap-4">
                            <div className="flex items-start gap-3 md:gap-4 min-w-0 flex-1 w-full">
                              <div className={`mt-1 flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl ring-2 ring-white/10 group-hover:scale-110 transition-transform duration-300 ${
                                (isAnnouncementExpired(a) || a.status === 'expired')
                                  ? 'bg-gradient-to-br from-gray-600/30 to-gray-700/30'
                                  : (isEmergency || isPriorityActive)
                                  ? 'bg-gradient-to-br from-red-500/30 to-rose-500/30'
                                  : hasApproachingDate
                                  ? 'bg-gradient-to-br from-orange-500/30 to-amber-500/30'
                                  : 'bg-gradient-to-br from-blue-500/20 to-purple-500/20'
                              }`}>
                                {(isAnnouncementExpired(a) || a.status === 'expired') ? (
                                  <svg className="h-5 w-5 md:h-6 md:w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                ) : (isEmergency || isPriorityActive) ? (
                                  <svg className="h-5 w-5 md:h-6 md:w-6 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                                ) : hasApproachingDate ? (
                                  <svg className="h-5 w-5 md:h-6 md:w-6 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                ) : (
                                  <svg className="h-5 w-5 md:h-6 md:w-6 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h8M5 6a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2H5z" />
                                  </svg>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
                                  <div className={`text-base md:text-lg font-bold transition-colors duration-200 ${
                                    (isAnnouncementExpired(a) || a.status === 'expired')
                                      ? 'text-gray-300 group-hover:text-gray-400'
                                      : (isEmergency || isPriorityActive)
                                      ? 'text-red-100 group-hover:text-red-200'
                                      : hasApproachingDate
                                      ? 'text-orange-100 group-hover:text-orange-200'
                                      : 'text-white group-hover:text-blue-300'
                                  }`}>
                                    {a.title}
                                  </div>
                                  {/* Show EXPIRED badge for all expired announcements, regardless of original status */}
                                  {(isAnnouncementExpired(a) || a.status === 'expired') ? (
                                    <Badge className="bg-gray-600/80 text-gray-200 border-gray-500/50 px-3 py-1 text-xs font-bold">
                                      EXPIRED
                                    </Badge>
                                  ) : (
                                    <>
                                      {(isEmergency || isPriorityActive) && (
                                        <Badge className="bg-red-600/80 text-white border-red-500/50 px-3 py-1 text-xs font-bold animate-pulse shadow-lg">
                                          🚨 EMERGENCY
                                        </Badge>
                                      )}
                                      {hasApproachingDate && !isEmergency && !isPriorityActive && nearestApproachingDate && (
                                        <Badge className="bg-orange-600/80 text-white border-orange-500/50 px-3 py-1 text-xs font-bold animate-pulse shadow-lg">
                                          ⏰ {approachingDateLabel} {formatDateTime(nearestApproachingDate.toISOString(), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                                        </Badge>
                                      )}
                                      {showStatusBadge && (() => {
                                        // Check if scheduled time has passed - hide badge if showing "Scheduled: ..." and time has passed
                                        const now = new Date();
                                        const scheduledDate = a.scheduled_at ? new Date(a.scheduled_at) : null;
                                        const isScheduledTimePassed = scheduledDate && !isNaN(scheduledDate.getTime()) && scheduledDate.getTime() < now.getTime();
                                        
                                        // Hide badge completely if scheduled time has passed and we're showing scheduled status
                                        const isShowingScheduled = a.status === 'scheduled' || a.status?.toLowerCase() === 'scheduled';
                                        if (isShowingScheduled && a.scheduled_at && isScheduledTimePassed) {
                                          return null;
                                        }
                                        
                                        // Don't show "Scheduled: ..." text if time has passed
                                        const canShowScheduledText = isShowingScheduled && a.scheduled_at && !isScheduledTimePassed;
                                        
                                        return (
                                          <Badge
                                            className={'bg-slate-500/30 text-slate-200 border border-slate-500/50 px-3 py-1 text-xs font-bold capitalize'}
                                          >
                                            {canShowScheduledText
                                              ? `Scheduled: ${formatDateTime(a.scheduled_at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}`
                                              : a.status}
                                          </Badge>
                                        );
                                      })()}
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mb-3 flex-wrap">
                                  <Badge variant={getCategoryColor(a.category)} className="text-xs px-3 py-1 font-semibold capitalize">
                                    {a.category.toLowerCase() === 'sil' ? 'SIL' : a.category}
                                  </Badge>
                                  <span className="text-gray-500">•</span>
                                  <span className="text-sm text-gray-400">
                                    {formatDateTime(a.created_at, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                                  </span>
                                  
                                  {/* Display Deadlines */}
                                  {a.deadlines && a.deadlines.length > 0 && (
                                    <>
                                      <span className="text-gray-500">•</span>
                                      <div className="flex flex-wrap items-center gap-2">
                                        {a.deadlines.map((deadline, idx) => {
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
                                    </>
                                  )}
                                </div>
                                {isPriorityActive && (
                                  <div className="text-xs font-semibold text-red-200 mb-2">
                                    Pinned for campus-wide visibility
                                  </div>
                                )}
                                <div 
                                  className={`grid transition-all duration-500 ease-in-out ${
                                    expandedId === a.id ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'
                                  }`}
                                >
                                  <div className="overflow-hidden">
                                    <div className="space-y-4">
                                      {/* Description Section */}
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 pb-2 border-b border-gray-700/50">
                                          <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                          <h4 className="text-sm font-bold text-green-400 uppercase tracking-wide">Description</h4>
                                        </div>
                                        <div className="text-sm text-gray-300 leading-relaxed">
                                          {parseLinks(a.description)}
                                        </div>
                                      </div>
                                      
                                      {/* Attachments Section */}
                                      {((a.id && attachmentsMap[a.id] && attachmentsMap[a.id].length > 0) || a.url) && (
                                        <AttachmentList attachments={(a.id ? attachmentsMap[a.id] : undefined) || []} url={a.url} />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex sm:flex-col md:flex-row items-center gap-2 w-full sm:w-auto justify-end mt-2 sm:mt-0 opacity-100 md:opacity-70 md:group-hover:opacity-100 transition-opacity duration-200">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-10 w-10 p-0 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const nextId = expandedId === a.id ? null : (a.id ?? null);
                                  setExpandedId(nextId);
                                  // Fetch attachments when expanding
                                  if (nextId && a.id) {
                                    fetchAttachments(a.id);
                                  }
                                }}
                                title={expandedId === a.id ? 'Collapse' : 'Expand'}
                                aria-expanded={expandedId === a.id}
                              >
                                <svg className={`w-5 h-5 transition-transform duration-300 ${expandedId === a.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </Button>
                              {user?.is_admin && (
                                <>
                                  {canDoAdminActions && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-10 w-10 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-xl transition-all duration-200"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditAnnouncement(a);
                                      }}
                                      title="Edit"
                                    >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-10 w-10 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-xl transition-all duration-200"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowDeleteConfirm(a.id!);
                                    }}
                                    title="Delete"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
                                    </svg>
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {announcements.length === 0 && (
                      <div className="flex items-center justify-center py-16">
                        <div className="text-center">
                          <div className="mx-auto mb-4 h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 ring-2 ring-white/10 flex items-center justify-center">
                            <svg className="h-10 w-10 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h8M5 6a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2H5z" />
                            </svg>
                          </div>
                          <div className="text-lg text-gray-300 font-semibold">No announcements yet</div>
                          <div className="text-sm text-gray-500 mt-2">Create your first announcement to get started.</div>
                        </div>
                      </div>
                    )}
                    {hasMoreAnnouncements && announcements.length > 0 && (
                      <div className="flex justify-center pt-4">
                        <Button
                          onClick={() => setAnnouncementsToShow(prev => prev + 5)}
                          className="bg-gray-700 hover:bg-gray-600  text-white font-semibold px-6 py-2 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          Load More ({sortedForRecentAnnouncements.length - announcementsToShow} remaining)
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>

        <CreateAnnouncementModal
          isOpen={showCreateForm}
          onClose={() => {
            setShowCreateForm(false);
            setCreateInitialData(undefined);
            setCreateModalVariant('standard');
          }}
          onSubmit={handleCreateAnnouncement}
          loading={createLoading}
          variant={createModalVariant}
          initialData={createInitialData}
        />

        <EditAnnouncementModal
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setEditingAnnouncement(null);
          }}
          announcement={editingAnnouncement}
          onSubmit={handleUpdateAnnouncement}
          loading={editLoading}
        />

        <DeleteConfirmModal
          isOpen={showDeleteConfirm !== null}
          announcementId={showDeleteConfirm}
          announcementTitle={announcements.find(a => a.id === showDeleteConfirm)?.title}
          onClose={() => setShowDeleteConfirm(null)}
          onConfirm={handleDeleteAnnouncement}
          loading={deleteLoading === showDeleteConfirm}
        />

        <UserManagementModal
          isOpen={showUserManagement}
          onClose={() => setShowUserManagement(false)}
          users={users}
          loading={userManagementLoading}
          onRefresh={fetchUsers}
        />

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </div>
  );
};

export default Dashboard;
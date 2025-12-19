import React, { useEffect, useState } from 'react';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import type { Announcement, UpdateAnnouncementData, Deadline } from '../../types';
import { CATEGORY_OPTIONS } from '../../constants/categories';
import { formatDateForInput } from '../../utils/dateUtils';
import { useAppUser } from '../../contexts/AppUserContext';
import { INTAKE_YEAR_OPTIONS } from '../../utils/studentYear';

interface EditAnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
  onSubmit: (id: number, data: UpdateAnnouncementData) => Promise<void>;
  loading?: boolean;
}

const EditAnnouncementModal: React.FC<EditAnnouncementModalProps> = ({
  isOpen,
  onClose,
  announcement,
  onSubmit,
  loading = false,
}) => {
  const { user } = useAppUser();
  const isSuperAdmin = user?.role === 'super_admin';
  const [formData, setFormData] = useState<UpdateAnnouncementData>({
    title: '',
    description: '',
    category: 'general',
    expiry_date: '',
    deadlines: null,
    scheduled_at: '',
    reminder_time: '',
    target_years: null,
    url: null,
  });
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const scheduledDeadlineMin = formData.scheduled_at
    ? formatDateForInput(formData.scheduled_at)
    : '';

  useEffect(() => {
    if (announcement) {
      setFormData({
        title: announcement.title,
        description: announcement.description,
        category: announcement.category,
        expiry_date: formatDateForInput(announcement.expiry_date),
        deadlines: announcement.deadlines ?? null,
        scheduled_at: formatDateForInput(announcement.scheduled_at),
        reminder_time: formatDateForInput(announcement.reminder_time),
        target_years: announcement.target_years ?? null,
        url: announcement.url ?? null,
      });
      setDeadlines(announcement.deadlines || []);
    }
  }, [announcement, isSuperAdmin]);

  if (!isOpen || !announcement || !announcement.id) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const convertLocalInputToUTC = (value?: string | null) => {
    if (!value) return value;
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process deadlines
    const validDeadlines = deadlines
      .filter(d => d.label.trim() && d.date)
      .map(d => ({
        label: d.label.trim(),
        date: d.date ? convertLocalInputToUTC(d.date) || d.date : d.date,
      }));

    const submissionData: UpdateAnnouncementData = { 
      ...formData,
      deadlines: validDeadlines.length > 0 ? validDeadlines : null,
    };
    if (!isSuperAdmin) {
      delete submissionData.scheduled_at;
    }
    await onSubmit(announcement.id!, submissionData);
  };

  const addDeadline = () => {
    setDeadlines([...deadlines, { label: '', date: '' }]);
  };

  const updateDeadline = (index: number, field: 'label' | 'date', value: string) => {
    const updated = [...deadlines];
    let nextValue = value;

    if (field === 'date' && scheduledDeadlineMin && value) {
      const selected = new Date(value);
      const scheduled = new Date(scheduledDeadlineMin);
      if (!isNaN(selected.getTime()) && !isNaN(scheduled.getTime()) && selected < scheduled) {
        nextValue = scheduledDeadlineMin;
      }
    }

    updated[index] = { ...updated[index], [field]: nextValue };
    setDeadlines(updated);
  };

  const removeDeadline = (index: number) => {
    setDeadlines(deadlines.filter((_, i) => i !== index));
  };

  const toggleYearSelection = (year: number) => {
    setFormData(prev => {
      const current = prev.target_years ?? [];
      const exists = current.includes(year);
      const next = exists ? current.filter(y => y !== year) : [...current, year];
      next.sort((a, b) => a - b);
      return { ...prev, target_years: next.length ? next : null };
    });
  };

  const isAllYears = !formData.target_years || formData.target_years.length === 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-black rounded-2xl border border-gray-900 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        <div className="p-6 border-b border-gray-900 bg-black">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-900 border border-gray-800 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Edit Announcement</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-900 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Title <span className="text-red-400">*</span>
            </Label>
            <Input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-black/70 border-gray-800 text-white placeholder-gray-500 focus-visible:ring-blue-600/40"
              placeholder="Enter a compelling title for your announcement"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Description <span className="text-red-400">*</span>
            </Label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={5}
              className="w-full px-4 py-2 bg-black/70 border border-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600/40 resize-none"
              placeholder="Provide detailed information about your announcement..."
            />
            <p className="text-xs text-gray-500">{(formData.description || '').length} characters</p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm font-semibold text-gray-300">
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Link URL (Single Link Only)
            </Label>
            <p className="text-xs text-gray-400 mb-2">
              Add a single link that will be displayed as a QR code on TV screens. This QR code will be shown alongside the announcement content.
            </p>
            <Input
              type="url"
              placeholder="https://example.com/form"
              value={formData.url || ''}
              onChange={(e) => {
                const value = e.target.value.trim();
                // Only allow one URL - if user tries to paste multiple, take the first one
                const urlMatch = value.match(/https?:\/\/[^\s]+/);
                const singleUrl = urlMatch ? urlMatch[0] : value;
                setFormData({ ...formData, url: singleUrl || null });
              }}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value && !value.match(/^https?:\/\/.+/)) {
                  // Auto-add https:// if user forgot it
                  if (!value.startsWith('http://') && !value.startsWith('https://')) {
                    setFormData({ ...formData, url: `https://${value}` });
                  }
                }
              }}
              className="bg-black/70 border-gray-800 text-white placeholder-gray-500 focus-visible:ring-cyan-500/50 [color-scheme:dark]"
            />
            <div className="flex items-start gap-2 mt-2">
              <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-gray-500">
                <span className="font-semibold text-gray-400">Note:</span> Only one link can be added per announcement. 
                Examples: registration forms, event pages, or resource links. The link will be converted to a QR code and displayed on TV screens for easy scanning.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Category <span className="text-red-400">*</span>
            </Label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 bg-black/70 border border-gray-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-600/40"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Visible to Intake Years
            </label>
            <p className="text-xs text-gray-500">Select specific intake years or keep it visible to all.</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, target_years: null }))}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  isAllYears
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/40'
                    : 'bg-blue-900/40 text-blue-200 hover:bg-blue-800/40'
                }`}
              >
                All years
              </button>
              {INTAKE_YEAR_OPTIONS.map((intakeYear) => {
                const isSelected = formData.target_years?.includes(intakeYear);
                return (
                  <button
                    key={intakeYear}
                    type="button"
                    onClick={() => toggleYearSelection(intakeYear)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40'
                        : 'bg-purple-900/40 text-purple-200 hover:bg-purple-800/40'
                    }`}
                  >
                    {intakeYear}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400">
              {isAllYears
                ? 'Announcement will be visible to all students.'
                : `Visible to: Intake ${formData.target_years?.join(', ')}`}
            </p>
          </div>
          
          {/* Deadlines Section */}
          <div className="space-y-3 bg-gray-900/30 border border-gray-800/50 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Deadlines (Form/Action closes)
              </label>
              <Button
                type="button"
                onClick={addDeadline}
                className="px-3 py-1.5 text-xs bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/30 rounded-lg transition-all"
              >
                <svg className="w-4 h-4 mr-1 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Deadline
              </Button>
            </div>
            <p className="text-xs text-gray-500">e.g., "Form closes", "Interview date", "Results announced"</p>
            
            {deadlines.map((deadline, index) => (
              <div key={index} className="flex gap-2 items-end bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-medium text-gray-400">Label</label>
                  <input
                    type="text"
                    value={deadline.label}
                    onChange={(e) => updateDeadline(index, 'label', e.target.value)}
                    placeholder="e.g., Form closes"
                    className="w-full px-3 py-2 bg-black/70 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 text-sm"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-medium text-gray-400">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={deadline.date ? formatDateForInput(deadline.date) : ''}
                    onChange={(e) => updateDeadline(index, 'date', e.target.value)}
                    min={scheduledDeadlineMin || undefined}
                    className="w-full px-3 py-2 bg-black/70 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeDeadline(index)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all"
                  title="Remove deadline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            
            {deadlines.length === 0 && (
              <p className="text-xs text-gray-500 italic text-center py-2">No deadlines added. Click "Add Deadline" to add one.</p>
            )}
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-300">
              <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule & Timing
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Expiry Date
                </Label>
                <Input
                  type="datetime-local"
                  value={formData.expiry_date || ''}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  className="bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus-visible:ring-cyan-500/50 [color-scheme:dark]"
                />
              </div>
              {isSuperAdmin && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                    <svg className="w-3.5 h-3.5 text-cyan-500/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Scheduled At
                  </Label>
                  <Input
                    type="datetime-local"
                    value={formData.scheduled_at || ''}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    className="bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus-visible:ring-cyan-500/50 [color-scheme:dark]"
                  />
                </div>
              )}
              {/* <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                  <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Reminder Time
                </Label>
                <Input
                  type="datetime-local"
                  value={formData.reminder_time || ''}
                  onChange={(e) => setFormData({ ...formData, reminder_time: e.target.value })}
                  className="bg-gray-800/80 border-gray-700 text-white placeholder-gray-500 focus-visible:ring-cyan-500/50 [color-scheme:dark]"
                />
              </div> */}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </span>
              ) : (
                'Update Announcement'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-gray-900 text-gray-300 hover:bg-gray-900"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAnnouncementModal;

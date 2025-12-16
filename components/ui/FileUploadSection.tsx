'use client'

import React, { useRef } from 'react'
import { Button } from '../ui/button'
import type { AttachmentUpload } from '@/lib/types'

interface FileUploadSectionProps {
  attachments: AttachmentUpload[]
  onFilesAdd: (files: File[]) => void
  onFileRemove: (index: number) => void
  disabled?: boolean
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  attachments,
  onFilesAdd,
  onFileRemove,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      onFilesAdd(files)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    }
    return (
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-gray-300">
          Attachments (Optional)
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white text-xs"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Files
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* File List */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-700/50 hover:bg-gray-800/60 transition-colors"
            >
              {/* Preview or Icon */}
              <div className="flex-shrink-0">
                {attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt={attachment.file.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <div className="w-12 h-12 flex items-center justify-center bg-gray-700/50 rounded">
                    {getFileIcon(attachment.file.type)}
                  </div>
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">
                  {attachment.file.name}
                </p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(attachment.file.size)}
                  {attachment.uploaded && (
                    <span className="ml-2 text-green-400">✓ Uploaded</span>
                  )}
                  {attachment.error && (
                    <span className="ml-2 text-red-400">✗ {attachment.error}</span>
                  )}
                </p>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => onFileRemove(index)}
                disabled={disabled || attachment.uploaded}
                className="flex-shrink-0 p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        Supported: Images (JPG, PNG, GIF, WebP - max 5MB), Documents (PDF, Word, Excel, PowerPoint, TXT - max 10MB)
      </p>
    </div>
  )
}

export default FileUploadSection

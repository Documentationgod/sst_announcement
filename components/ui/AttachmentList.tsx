'use client'

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import ImageLightbox from './ImageLightbox'
import DocumentViewer from './DocumentViewer'
import type { AnnouncementFile } from '@/lib/types'

interface AttachmentListProps {
  attachments: AnnouncementFile[]
  className?: string
}

const AttachmentList: React.FC<AttachmentListProps> = ({ attachments, className = '' }) => {
  const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<{ url: string; name: string; mimeType: string } | null>(null)

  if (!attachments || attachments.length === 0) {
    return null
  }

  const images = attachments.filter(a => a.file_category === 'image')
  const documents = attachments.filter(a => a.file_category === 'document')

  const formatFileSize = (url: string): string => {
    // This is a placeholder - actual file size would need to be stored in DB
    return ''
  }

  const getDocumentIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return (
        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      )
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return (
        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    }
    if (mimeType.includes('sheet') || mimeType.includes('excel')) {
      return (
        <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )
    }
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
      return (
        <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
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
    <div className={`space-y-4 ${className}`}>
      {/* Images */}
      {images.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Images</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((image) => (
              <button
                key={image.id}
                onClick={() => setSelectedImage({ url: image.file_url, name: image.file_name })}
                className="group relative aspect-square rounded-lg overflow-hidden bg-gray-800/40 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200 cursor-pointer"
              >
                <img
                  src={image.file_url}
                  alt={image.file_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-xs text-white truncate font-medium">
                      {image.file_name}
                    </p>
                  </div>
                </div>
                {/* Enlarge Icon */}
                <div className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Documents</h4>
          <div className="space-y-2">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDocument({ url: doc.file_url, name: doc.file_name, mimeType: doc.mime_type })}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-700/50 hover:bg-gray-800/60 hover:border-blue-500/50 transition-all duration-200 group text-left"
              >
                <div className="flex-shrink-0">
                  {getDocumentIcon(doc.mime_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate group-hover:text-blue-400 transition-colors">
                    {doc.file_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {doc.mime_type.split('/')[1]?.toUpperCase() || 'FILE'}
                  </p>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  <span className="text-xs text-gray-500 group-hover:text-blue-400">View</span>
                  <svg className="w-5 h-5 text-gray-500 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Lightbox - Rendered at root level via portal */}
      {selectedImage && typeof window !== 'undefined' && createPortal(
        <ImageLightbox
          imageUrl={selectedImage.url}
          fileName={selectedImage.name}
          onClose={() => setSelectedImage(null)}
        />,
        document.body
      )}

      {/* Document Viewer - Rendered at root level via portal */}
      {selectedDocument && typeof window !== 'undefined' && createPortal(
        <DocumentViewer
          fileUrl={selectedDocument.url}
          fileName={selectedDocument.name}
          mimeType={selectedDocument.mimeType}
          onClose={() => setSelectedDocument(null)}
        />,
        document.body
      )}
    </div>
  )
}

export default AttachmentList

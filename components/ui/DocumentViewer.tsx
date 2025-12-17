'use client'

import React, { useEffect } from 'react'

interface DocumentViewerProps {
  fileUrl: string
  fileName: string
  mimeType: string
  onClose: () => void
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ fileUrl, fileName, mimeType, onClose }) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  // Prevent body scroll when viewer is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const isPDF = mimeType === 'application/pdf'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-lg bg-gray-900/80 hover:bg-gray-800 text-white transition-colors z-10"
        aria-label="Close"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* File Name and Download */}
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <div className="px-4 py-2 rounded-lg bg-gray-900/80 backdrop-blur-sm">
          <p className="text-sm text-white font-medium">{fileName}</p>
        </div>
        <a
          href={fileUrl}
          download
          className="px-4 py-2 rounded-lg bg-blue-600/80 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </a>
      </div>

      {/* Document Viewer */}
      <div
        className="relative w-[90vw] h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {isPDF ? (
          <iframe
            src={`${fileUrl}#view=FitH`}
            className="w-full h-full rounded-lg bg-white shadow-2xl"
            title={fileName}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-900/50 rounded-lg">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <p className="text-white text-lg mb-4">Preview not available for this file type</p>
              <a
                href={fileUrl}
                download
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download File
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DocumentViewer

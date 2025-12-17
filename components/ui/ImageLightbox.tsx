'use client'

import React, { useEffect } from 'react'

interface ImageLightboxProps {
  imageUrl: string
  fileName: string
  onClose: () => void
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ imageUrl, fileName, onClose }) => {
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

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xl animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all duration-200 shadow-lg hover:scale-110 z-10"
        aria-label="Close"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* File Name */}
      <div className="absolute top-6 left-6 px-5 py-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg">
        <p className="text-sm text-white font-medium truncate max-w-md">{fileName}</p>
      </div>

      {/* Image Container - Full Screen */}
      <div
        className="relative w-screen h-screen flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrl}
          alt={fileName}
          className="max-w-full max-h-full object-contain drop-shadow-2xl animate-in zoom-in-95 fade-in duration-300"
        />
      </div>
    </div>
  )
}

export default ImageLightbox

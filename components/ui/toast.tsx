'use client'

import React, { useEffect } from 'react'
import { cn } from '@/lib/utils'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface ToastProps {
  toast: Toast
  onRemove: (id: string) => void
}

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = React.useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      // Wait for exit animation to complete before removing
      setTimeout(() => {
        onRemove(toast.id)
      }, 300)
    }, 3000)

    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      onRemove(toast.id)
    }, 300)
  }

  const getToastStyles = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-600 to-emerald-600 border-green-400 text-white shadow-green-500/50'
      case 'error':
        return 'bg-gradient-to-r from-red-600 to-rose-600 border-red-400 text-white shadow-red-500/50'
      case 'info':
      default:
        return 'bg-gradient-to-r from-blue-600 to-cyan-600 border-blue-400 text-white shadow-blue-500/50'
    }
  }

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      case 'info':
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-4 rounded-xl border-2 shadow-2xl transition-all duration-300 ease-in-out',
        getToastStyles(toast.type),
        isExiting 
          ? 'animate-out slide-out-to-right fade-out' 
          : 'animate-in slide-in-from-right fade-in'
      )}
    >
      <div className="flex-shrink-0">
        {getIcon(toast.type)}
      </div>
      <div className="flex-1 text-sm font-semibold">
        {toast.message}
      </div>
      <button
        onClick={handleClose}
        className="flex-shrink-0 text-white hover:bg-white/20 rounded-lg p-1 transition-all"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  )
}

export { Toast }

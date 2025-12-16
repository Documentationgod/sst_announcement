import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SST Announcement System',
  description: 'Stay updated with the latest announcements from SST',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || ''
  
  if (!publishableKey) {
    console.warn('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is not set. Clerk authentication may not work.')
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        <ClerkProvider
          publishableKey={publishableKey}
          signInFallbackRedirectUrl="/"
          signUpFallbackRedirectUrl="/"
        >
          <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-black z-0"></div>
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </ClerkProvider>
      </body>
    </html>
  )
}

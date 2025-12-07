import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-white/90">404</h1>
          <h2 className="text-2xl font-semibold text-white/80">Page Not Found</h2>
          <p className="text-white/60 max-w-md mx-auto">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Go Back Home
          </Link>
          
          <div className="text-sm text-white/40">
            <Link href="/" className="hover:text-white/60 transition-colors">
              Dashboard
            </Link>
            {' • '}
            <Link href="/all-announcements" className="hover:text-white/60 transition-colors">
              All Announcements
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

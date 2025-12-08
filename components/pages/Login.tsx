'use client'

import React, { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import logo from "@/app/assets/image.png"
import { Button } from "../ui/button"
import { SignInButton, useAuth } from "@clerk/nextjs"
import { AUTH_ERROR_STORAGE_KEY } from "@/contexts/AppUserContext"

const Login: React.FC = () => {
  const { isLoaded } = useAuth()
  const [error, setError] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null
    }
    return localStorage.getItem(AUTH_ERROR_STORAGE_KEY)
  })

  const clearError = useCallback(() => {
    setError(null)
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_ERROR_STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => clearError(), 10000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  const buttonDisabled = useMemo(() => !isLoaded, [isLoaded])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="relative z-10">
        <section
          aria-label="Notifications alt+T"
          tabIndex={-1}
          aria-live="polite"
          aria-relevant="additions text"
          aria-atomic="false"
        ></section>
        <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
          <div className="fixed inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-black"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 via-transparent to-purple-600/5"></div>
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDYwIDAgTCAwIDAgMCA2MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40"></div>
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-500/10 animate-gradient"></div>
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            </div>
          </div>
          <div className="relative z-10 w-full max-w-md space-y-8 p-4 transition-all duration-1000 opacity-100 translate-y-0">
            <div className="text-center space-y-4">
              <div className="relative">
                <Image
                  src={logo}
                  alt="Scaler Logo"
                  className="relative h-24 mx-auto w-auto object-contain"
                  priority
                />
              </div>
              <div className="text-blue-500 text-lg flex items-center justify-center gap-2 group">
                <span>+1% Better Everyday</span>
                <span className="flex gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-arrow-up h-4 w-4 transition-all duration-600 group-hover:-translate-y-1 text-violet-400 animate-pulse"
                  >
                    <path d="m5 12 7-7 7 7"></path>
                    <path d="M12 19V5"></path>
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-arrow-up h-4 w-4 transition-all duration-600 group-hover:-translate-y-2 text-blue-400 animate-pulse delay-75"
                  >
                    <path d="m5 12 7-7 7 7"></path>
                    <path d="M12 19V5"></path>
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-arrow-up h-4 w-4 transition-all duration-600 group-hover:-translate-y-1 text-violet-400 animate-pulse delay-150"
                  >
                    <path d="m5 12 7-7 7 7"></path>
                    <path d="M12 19V5"></path>
                  </svg>
                </span>
              </div>
            </div>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-3xl blur opacity-30 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-black/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-gray-800/50 space-y-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
                    <div className="flex items-start gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mt-0.5 flex-shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="font-medium">Access Restricted</p>
                        <p className="text-red-300/80 mt-1">{error}</p>
                      </div>
                      <button
                        onClick={clearError}
                        className="text-red-400 hover:text-red-300 transition-colors"
                        aria-label="Dismiss error"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
                <div className="relative flex items-center gap-2">
                  <SignInButton mode="modal">
                    <button
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-background shadow-sm hover:text-accent-foreground h-9 px-4 py-2 w-full text-sm font-normal relative overflow-hidden group bg-gradient-to-tr from-slate-950/80 to-gray-900/80 dark:from-gray-900/80 dark:to-slate-950/80 border border-white/10 backdrop-blur-sm hover:border-white/20 hover:bg-slate-900/90 transition-all duration-300"
                      type="button"
                      disabled={buttonDisabled}
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute inset-0">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
                        <div className="absolute right-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent"></div>
                      </div>
                      <div className="relative z-10 flex items-center justify-center">
                        {buttonDisabled ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                            <span className="text-white/80">Preparing...</span>
                          </>
                        ) : (
                          <>
                            <svg
                              stroke="currentColor"
                              fill="currentColor"
                              strokeWidth="0"
                              version="1.1"
                              x="0px"
                              y="0px"
                              viewBox="0 0 48 48"
                              enableBackground="new 0 0 48 48"
                              className="mr-2 size-5"
                              height="1em"
                              width="1em"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                fill="#FFC107"
                                d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                              ></path>
                              <path
                                fill="#FF3D00"
                                d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                              ></path>
                              <path
                                fill="#4CAF50"
                                d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                              ></path>
                              <path
                                fill="#1976D2"
                                d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                              ></path>
                            </svg>
                            <span className="text-white/80">
                              Continue with Google
                            </span>
                          </>
                        )}
                      </div>
                    </button>
                  </SignInButton>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600">
              By continuing, you agree to our{" "}
              <a
                href="#"
                className="text-violet-400 hover:text-violet-300 transition-colors duration-300"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-violet-400 hover:text-violet-300 transition-colors duration-300"
              >
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login


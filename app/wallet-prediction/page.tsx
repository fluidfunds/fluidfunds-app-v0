'use client'

import Link from 'next/link'

export default function WalletPrediction() {
  return (
    <div className="min-h-screen bg-fluid-bg text-fluid-white">
      <main className="relative z-10 flex flex-col items-center px-6 pt-8 pb-[100px]">
        <div className="w-full max-w-7xl">
          <div className="mb-8">
            <Link 
              href="/"
              className="inline-flex items-center text-fluid-white-70 hover:text-fluid-white transition-colors"
            >
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 20 20" 
                fill="none" 
                stroke="currentColor" 
                className="mr-2"
              >
                <path 
                  d="M15.833 10H4.167M4.167 10L10 4.167M4.167 10L10 15.833" 
                  strokeWidth="1.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                />
              </svg>
              Back to Home
            </Link>
          </div>

          <div className="flex flex-col items-center justify-center py-20">
            <h1 className="text-4xl font-bold text-fluid-white mb-4">
              Wallet Prediction
            </h1>
            <p className="text-xl text-fluid-white-70">
              Coming Soon
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
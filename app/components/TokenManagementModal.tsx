import { useState } from 'react'
import { motion } from 'framer-motion'

interface TokenManagementModalProps {
  isOpen: boolean
  onClose: () => void
  whitelistedTokens: string[]
  onWhitelist: (token: string, status: boolean) => Promise<void>
  onBatchWhitelist: () => Promise<void>
}

export function TokenManagementModal({
  isOpen,
  onClose,
  whitelistedTokens,
  onWhitelist,
  onBatchWhitelist
}: TokenManagementModalProps) {
  const [tokenAddress, setTokenAddress] = useState('')
  const [batchTokens, setBatchTokens] = useState('')
  const [processingBatch, setProcessingBatch] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl p-6 rounded-xl bg-[#0A0A0A] border border-white/[0.08]"
      >
        <h2 className="text-xl font-medium mb-6">Token Management</h2>

        {/* Single Token Whitelist */}
        <div className="space-y-4 mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Token Address"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.05] 
                       text-white placeholder-white/40 focus:outline-none focus:border-fluid-primary 
                       transition-all duration-200"
            />
            <button
              onClick={() => {
                onWhitelist(tokenAddress, true)
                setTokenAddress('')
              }}
              className="px-4 py-3 rounded-lg bg-fluid-primary text-white font-medium 
                       hover:bg-fluid-primary/90 transition-all duration-200 flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              Whitelist
            </button>
          </div>
        </div>

        {/* Batch Token Whitelist */}
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            <h3 className="text-sm font-medium mb-2">Batch Whitelist Tokens</h3>
            <textarea
              placeholder="Enter token addresses (one per line)"
              value={batchTokens}
              onChange={(e) => setBatchTokens(e.target.value)}
              className="w-full h-32 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.08] 
                       text-white placeholder-white/40 focus:outline-none focus:border-fluid-primary 
                       transition-all duration-200 mb-3"
            />
            <button
              onClick={async () => {
                setProcessingBatch(true)
                await onBatchWhitelist()
                setBatchTokens('')
                setProcessingBatch(false)
              }}
              disabled={!batchTokens.trim() || processingBatch}
              className="w-full px-4 py-2 rounded-lg bg-fluid-primary text-white font-medium 
                       hover:bg-fluid-primary/90 transition-all duration-200 disabled:opacity-50 
                       disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processingBatch ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  Batch Whitelist
                </>
              )}
            </button>
          </div>

          {/* Whitelisted Tokens List */}
          {whitelistedTokens.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Whitelisted Tokens</h3>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {whitelistedTokens.map((token, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]"
                  >
                    <span className="text-sm">{token.slice(0, 6)}...{token.slice(-4)}</span>
                    <button
                      onClick={() => onWhitelist(token, false)}
                      className="text-red-500 hover:text-red-400 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/[0.05] text-white font-medium 
                     hover:bg-white/[0.08] transition-all duration-200"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
} 
'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSuperfluid } from '@/app/hooks/useSuperfluid'

interface CreateStreamModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateStream: (receiver: string, flowRate: string) => Promise<void>
}

export function CreateStreamModal({ isOpen, onClose, onCreateStream }: CreateStreamModalProps) {
  const [receiver, setReceiver] = useState('')
  const [flowRate, setFlowRate] = useState('')
  const [loading, setLoading] = useState(false)

  const { createStream } = useSuperfluid()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onCreateStream(receiver, flowRate)
      onClose()
    } catch (error) {
      console.error('Failed to create stream:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-6 rounded-xl bg-[#0A0A0A] border border-white/[0.08]"
      >
        <h2 className="text-xl font-medium mb-4">Create New Stream</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Receiver Address</label>
            <input
              type="text"
              value={receiver}
              onChange={(e) => setReceiver(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08]"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Flow Rate (USDCx per month)</label>
            <input
              type="number"
              value={flowRate}
              onChange={(e) => setFlowRate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08]"
              required
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-fluid-primary text-white font-medium hover:bg-fluid-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Stream'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
} 
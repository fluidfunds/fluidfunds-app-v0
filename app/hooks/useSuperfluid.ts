import { useCallback, useState } from 'react'

interface Stream {
  receiver: string
  flowRate: string
  token: string
  timestamp: string
}

export function useSuperfluid() {
  const [activeStreams] = useState<Stream[]>([])
  const [usdcxBalance] = useState('0')
  const [loading] = useState(false)
  const [error] = useState<string | null>(null)

  // Return dummy functions for now
  const createStream = useCallback(async () => {
    console.log('Streaming functionality temporarily disabled')
  }, [])

  const deleteStream = useCallback(async () => {
    console.log('Streaming functionality temporarily disabled')
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fetchFlowInfo = useCallback(async () => {
    console.log('Flow info functionality temporarily disabled')
    return null
  }, [])

  return {
    createStream,
    deleteStream,
    activeStreams,
    usdcxBalance,
    loading,
    error,
    retry: useCallback(async () => {
      console.log('Retry functionality temporarily disabled')
    }, [])
  }
} 
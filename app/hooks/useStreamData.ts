import { useCallback, useState, useEffect } from 'react'

interface Stream {
  id: string
  currentFlowRate: string
  streamedUntilUpdatedAt: string
  updatedAtTimestamp: string
  token: {
    id: string
    symbol: string
    decimals: string
  }
  sender: {
    id: string
  }
  receiver: {
    id: string
  }
}

interface ProcessedStream extends Stream {
  currentAmount: number
  flowRatePerDay: number
  flowRatePerSecond: number  // Added for animation
}

export function useStreamData(fundAddress?: `0x${string}`) {
  const [activeStreams, setActiveStreams] = useState<ProcessedStream[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const formatWithDecimals = (value: string | bigint, decimals: number): number => {
    const bigintValue = typeof value === 'string' ? BigInt(value) : value
    return Number(bigintValue) / (10 ** decimals)
  }

  const processStream = useCallback((stream: Stream): ProcessedStream => {
    const flowRate = BigInt(stream.currentFlowRate)
    const decimals = Number(stream.token.decimals)
    const now = Math.floor(Date.now() / 1000)
    const startTime = Number(stream.updatedAtTimestamp)
    const secondsSinceUpdate = now - startTime
    
    // Calculate flow rate per second with proper decimal handling
    const flowRatePerSecond = Number(flowRate) / (10 ** decimals)
    
    // Calculate streamed amount since last update
    const streamedSinceUpdate = flowRatePerSecond * secondsSinceUpdate
    
    // Calculate daily flow rate (86400 seconds in a day)
    const flowRatePerDay = flowRatePerSecond * 86400

    console.log('Stream details:', {
      id: stream.id,
      token: stream.token.symbol,
      rawFlowRate: stream.currentFlowRate,
      decimals,
      flowRatePerSecond,
      streamedSinceUpdate,
      flowRatePerDay,
      secondsSinceUpdate,
      startTime,
      now
    })

    return {
      ...stream,
      currentAmount: streamedSinceUpdate,
      flowRatePerDay,
      flowRatePerSecond // Adding this for animation
    }
  }, [])

  const fetchActiveStreams = useCallback(async () => {
    if (!fundAddress) return

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/superfluid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetActiveStreams($fund: String!) {
              account(id: $fund) {
                inflows(
                  where: { currentFlowRate_gt: "0" }
                  orderBy: currentFlowRate
                  orderDirection: desc
                ) {
                  id
                  currentFlowRate
                  streamedUntilUpdatedAt
                  updatedAtTimestamp
                  token {
                    id
                    symbol
                    decimals
                    name
                  }
                  sender {
                    id
                  }
                }
              }
            }
          `,
          variables: {
            fund: fundAddress.toLowerCase()
          }
        })
      })

      const result = await response.json()
      
      if (result.errors) {
        throw new Error(result.errors[0]?.message || 'GraphQL Error')
      }

      const streams = result.data?.account?.inflows || []
      console.log('Raw streams data:', JSON.stringify(streams, null, 2))

      const processedStreams = streams.map(processStream)
      console.log('Processed streams:', processedStreams)
      
      setActiveStreams(processedStreams)
      return processedStreams

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch stream data'
      setError(message)
      console.error('Error fetching stream data:', error)
      return []
    } finally {
      setLoading(false)
    }
  }, [fundAddress, processStream])

  useEffect(() => {
    fetchActiveStreams()
    // Update every second for smoother animation
    const interval = setInterval(fetchActiveStreams, 1000)
    return () => clearInterval(interval)
  }, [fetchActiveStreams])

  return {
    activeStreams,
    loading,
    error,
    refetch: fetchActiveStreams
  }
}
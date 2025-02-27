"use client";
import { useCallback, useState, useEffect } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { SUPERFLUID_ADDRESSES, CFAv1ForwarderABI, USDCxABI, SUPERFLUID_QUERY_URL } from '@/app/config/superfluid';
import { type PublicClient, formatEther } from 'viem';
import { logger } from '@/app/utils/logger';

interface Stream {
  id: string;
  receiver: string;
  flowRate: string;
  token: { id: string; symbol: string; decimals: number };
  streamedUntilUpdatedAt?: string;
  updatedAtTimestamp?: string;
}

interface AggregatedStreamData {
  totalDailyFlow: string; // Total daily flow rate in USDCx/day, formatted as string
  totalStreamed: string;  // Total streamed amount in USDCx, formatted as string
}

// Update the GraphQL types to match the schema
interface GraphQLResponse {
  data?: {
    streams?: {
      id: string;
      currentFlowRate: string;
      token: { 
        id: string; 
        symbol: string; 
        decimals: string 
      };
      sender: { 
        id: string 
      };
      receiver: { 
        id: string 
      };
      streamedUntilUpdatedAt: string;
      updatedAtTimestamp: string;
    }[];
  };
  error?: { message: string };
}

export function useSuperfluid(fundAddress?: `0x${string}`) {
  const { data: walletClient } = useWalletClient();
  const client = usePublicClient();
  const publicClient = client as PublicClient;

  const [activeStreams, setActiveStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usdcxBalance, setUsdcxBalance] = useState('0');
  const [aggregatedStreamData, setAggregatedStreamData] = useState<AggregatedStreamData | null>(null);

  const fetchActiveStreams = useCallback(async () => {
    if (!fundAddress) {
      logger.log('No fundAddress provided', { timestamp: Date.now() });
      return;
    }

    try {
      // Updated query to match Superfluid subgraph schema
      const query = `
        query FlowingStreams($fund: String!) {
          streams(
            where: {
              receiver: $fund,
              currentFlowRate_gt: "0"
            }
          ) {
            id
            currentFlowRate
            token {
              id
              symbol
              decimals
            }
            sender {
              id
            }
            receiver {
              id
            }
            streamedUntilUpdatedAt
            updatedAtTimestamp
          }
        }
      `;

      const response = await fetch(SUPERFLUID_QUERY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: { fund: fundAddress.toLowerCase() }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = (await response.json()) as GraphQLResponse;
      logger.log('Raw subgraph response:', data);

      if (!data.data?.streams) {
        throw new Error('No streams data received');
      }

      const streams = data.data.streams.map(stream => ({
        id: stream.id,
        receiver: stream.receiver.id,
        flowRate: stream.currentFlowRate,
        token: {
          id: stream.token.id,
          symbol: stream.token.symbol,
          decimals: Number(stream.token.decimals),
        },
        streamedUntilUpdatedAt: stream.streamedUntilUpdatedAt,
        updatedAtTimestamp: stream.updatedAtTimestamp,
      }));

      // Calculate total daily flow from stream rates (convert from wei/second to tokens/day)
      const totalDailyFlow = streams.reduce((total, stream) => {
        // Convert wei/second to tokens/day
        const flowRatePerSecond = Number(stream.flowRate) / 1e18;
        const dailyFlow = flowRatePerSecond * 86400; // 86400 seconds in a day
        return total + dailyFlow;
      }, 0).toFixed(6);

      // Calculate total streamed amount (including current ongoing streams)
      const calculateTotalStreamed = (streams: Stream[]): string => {
        const now = Math.floor(Date.now() / 1000);
        
        return streams.reduce((total, stream) => {
          // Get base amount streamed until last update
          const baseStreamed = BigInt(stream.streamedUntilUpdatedAt || '0');
          
          // Calculate additional amount streamed since last update
          const lastUpdateTime = Number(stream.updatedAtTimestamp || '0');
          const timeElapsed = BigInt(now - lastUpdateTime);
          const flowRate = BigInt(stream.flowRate);
          const additionalStreamed = timeElapsed * flowRate;
          
          return total + baseStreamed + additionalStreamed;
        }, BigInt(0)).toString();
      };

      const totalStreamed = calculateTotalStreamed(streams);

      logger.log('Processed streams:', { 
        streams, 
        totalDailyFlow, 
        totalStreamed,
        timestamp: Date.now()
      });

      setActiveStreams(streams);
      setAggregatedStreamData({
        totalDailyFlow,
        totalStreamed: formatEther(BigInt(totalStreamed))
      });

      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch streams';
      setError(errorMsg);
      logger.error('Error fetching streams:', err);
    } finally {
      setLoading(false);
    }
  }, [fundAddress]);

  const calculateFlowRate = useCallback((monthlyAmount: number): string => {
    const monthlyAmountInWei = BigInt(Math.floor(monthlyAmount * 1e18));
    const secondsInMonth = BigInt(30 * 24 * 60 * 60);
    return (monthlyAmountInWei / secondsInMonth).toString();
  }, []);

  const fetchUSDCxBalance = useCallback(async () => {
    if (!walletClient?.account || !publicClient) {
      logger.log('Skipping USDCx balance fetch: wallet not connected', { timestamp: Date.now() });
      return;
    }

    try {
      const balance = await publicClient.readContract({
        address: SUPERFLUID_ADDRESSES.USDCx,
        abi: USDCxABI,
        functionName: 'realtimeBalanceOf',
        args: [walletClient.account.address, BigInt(Math.floor(Date.now() / 1000))],
      });

      const formattedBalance = formatEther(balance[0] >= 0 ? BigInt(balance[0]) : BigInt(0));
      setUsdcxBalance(formattedBalance);
      logger.log('Fetched USDCx balance:', { formattedBalance, timestamp: Date.now() });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch balance';
      setError(errorMsg);
      logger.error('Error fetching USDCx balance:', { error: err, timestamp: Date.now() });
    }
  }, [walletClient?.account, publicClient]);

  const createStream = useCallback(
    async (receiverAddress: `0x${string}`, monthlyAmount: string): Promise<`0x${string}`> => {
      if (!walletClient || !publicClient) throw new Error('Wallet not connected');
      try {
        const flowRate = calculateFlowRate(parseFloat(monthlyAmount));
        logger.log('Creating stream with flowRate:', { flowRate, to: receiverAddress, timestamp: Date.now() });
        const { request } = await publicClient.simulateContract({
          address: SUPERFLUID_ADDRESSES.CFAv1Forwarder,
          abi: CFAv1ForwarderABI,
          functionName: 'createFlow',
          args: [
            SUPERFLUID_ADDRESSES.USDCx,
            walletClient.account.address,
            receiverAddress,
            BigInt(flowRate),
            '0x',
          ],
          account: walletClient.account,
        });

        const hash = await walletClient.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash });

        logger.log('Stream created, tx hash:', { hash, timestamp: Date.now() });
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await fetchActiveStreams();

        return hash;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to create stream';
        setError(errorMsg);
        logger.error('Error creating stream:', { error: err, timestamp: Date.now() });
        throw err;
      }
    },
    [publicClient, walletClient, fetchActiveStreams, calculateFlowRate]
  );

  const deleteStream = useCallback(
    async (receiverAddress: `0x${string}`): Promise<`0x${string}`> => {
      if (!walletClient || !publicClient) throw new Error('Wallet not connected');
      try {
        logger.log('Deleting stream to:', { receiverAddress, timestamp: Date.now() });
        const { request } = await publicClient.simulateContract({
          address: SUPERFLUID_ADDRESSES.CFAv1Forwarder,
          abi: CFAv1ForwarderABI,
          functionName: 'createFlow',
          args: [
            SUPERFLUID_ADDRESSES.USDCx,
            walletClient.account.address,
            receiverAddress,
            BigInt(0),
            '0x',
          ],
          account: walletClient.account,
        });

        const hash = await walletClient.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash });

        logger.log('Stream deleted, tx hash:', { hash, timestamp: Date.now() });
        await new Promise((resolve) => setTimeout(resolve, 5000));
        await fetchActiveStreams();

        return hash;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to delete stream';
        setError(errorMsg);
        logger.error('Error deleting stream:', { error: err, timestamp: Date.now() });
        throw err;
      }
    },
    [publicClient, walletClient, fetchActiveStreams]
  );

  useEffect(() => {
    if (!fundAddress) {
      logger.log('Skipping fetch: fundAddress missing', { timestamp: Date.now() });
      return;
    }

    fetchActiveStreams();
    const interval = setInterval(() => {
      fetchActiveStreams();
    }, 10000); // 10s interval
    return () => clearInterval(interval);
  }, [fundAddress, fetchActiveStreams]);

  useEffect(() => {
    if (!walletClient?.account) {
      logger.log('Skipping balance fetch: wallet not connected', { timestamp: Date.now() });
      return;
    }

    fetchUSDCxBalance();
    const interval = setInterval(fetchUSDCxBalance, 10000); // 10s interval
    return () => clearInterval(interval);
  }, [walletClient?.account, fetchUSDCxBalance]);

  return {
    createStream,
    deleteStream,
    activeStreams,
    loading,
    error,
    fetchActiveStreams,
    usdcxBalance,
    fetchUSDCxBalance,
    aggregatedStreamData, 
  };
}
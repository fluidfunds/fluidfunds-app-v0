"use client";
import { useCallback, useState, useEffect, useRef } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { SUPERFLUID_ADDRESSES, CFAv1ForwarderABI, USDCxABI } from '@/app/config/superfluid';
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

interface GraphQLResponse {
  data?: {
    account?: {
      inflows?: {
        id: string;
        currentFlowRate: string;
        token: { id: string; symbol: string; decimals: string };
        sender: { id: string };
        streamedUntilUpdatedAt: string;
        updatedAtTimestamp: string;
      }[];
    };
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
  const streamsRef = useRef<Stream[]>([]);
  const isMounted = useRef(false);

  const fetchActiveStreams = useCallback(async () => {
    if (!fundAddress) {
      logger.log('No fundAddress provided', { timestamp: Date.now() });
      return;
    }

    if (!isMounted.current) {
      setLoading(true);
      logger.log('Initial fetch started:', { fundAddress, timestamp: Date.now() });
    }

    try {
      const query = `
        query FlowingStreams($fund: String!) {
          account(id: $fund) {
            inflows(where: { currentFlowRate_gt: "0" }) {
              id
              currentFlowRate
              token { id symbol decimals }
              sender { id }
              streamedUntilUpdatedAt
              updatedAtTimestamp
            }
          }
        }
      `;
      const requestBody = JSON.stringify({ query, variables: { fund: fundAddress.toLowerCase() } });
      const headers = { 'Content-Type': 'application/json' };

      logger.log('Fetching streams for fundAddress:', { fundAddress, timestamp: Date.now() });

      const response = await fetch('/api/superfluid', {
        method: 'POST',
        headers,
        body: requestBody,
        credentials: 'omit',
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('API fetch failed with status:', { status: response.status, response: errorText, timestamp: Date.now() });
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as GraphQLResponse;
      logger.log('Raw subgraph response:', JSON.stringify(data, null, 2));

      if (data.error) throw new Error(data.error.message);

      const inflows = data.data?.account?.inflows || [];
      logger.log('Raw inflows:', inflows);

      const streams = inflows.map((flow) => ({
        id: flow.id,
        receiver: flow.sender.id,
        flowRate: flow.currentFlowRate,
        token: {
          id: flow.token.id,
          symbol: flow.token.symbol,
          decimals: Number(flow.token.decimals),
        },
        streamedUntilUpdatedAt: flow.streamedUntilUpdatedAt,
        updatedAtTimestamp: flow.updatedAtTimestamp,
      }));

      logger.log('Processed streams:', { streams, timestamp: Date.now() });
      streamsRef.current = streams;
      setActiveStreams((prev) => {
        const isDifferent = JSON.stringify(prev) !== JSON.stringify(streams);
        logger.log('Updating activeStreams:', { isDifferent, timestamp: Date.now() });
        return isDifferent ? streams : prev;
      });
      setError(null); // Clear error on success
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch streams';
      setError(errorMsg);
      logger.error('Error fetching streams:', { error: err, timestamp: Date.now() });
    } finally {
      setLoading(false); // Always resolve loading, even on polling
      isMounted.current = true;
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
  };
}
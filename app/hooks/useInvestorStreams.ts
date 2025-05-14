'use client';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAccount } from 'wagmi';
import { SUPERFLUID_QUERY_URL } from '@/app/config/superfluid';
import { formatEther } from 'viem';
import { logger } from '@/app/utils/logger';

interface InvestorStream {
  id: string;
  sender: string;
  receiver: string;
  flowRate: string;
  token: { id: string; symbol: string; decimals: number };
  streamedUntilUpdatedAt: string;
  updatedAtTimestamp: string;
}

interface GraphQLResponse {
  data?: {
    streams?: {
      id: string;
      currentFlowRate: string;
      token: {
        id: string;
        symbol: string;
        decimals: string;
      };
      sender: {
        id: string;
      };
      receiver: {
        id: string;
      };
      streamedUntilUpdatedAt: string;
      updatedAtTimestamp: string;
    }[];
  };
  error?: { message: string };
}

export function useInvestorStreams(fundAddress?: `0x${string}`) {
  const [stream, setStream] = useState<InvestorStream | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalStreamedAmount, setTotalStreamedAmount] = useState<bigint>(BigInt(0));
  const [dailyFlowRate, setDailyFlowRate] = useState<string>('0');
  const { address: walletAddress } = useAccount();
  const isFetching = useRef(false);

  // Memoize addresses to prevent unnecessary re-renders
  const addresses = useMemo(
    () => ({
      fund: fundAddress?.toLowerCase(),
      wallet: walletAddress?.toLowerCase(),
    }),
    [fundAddress, walletAddress]
  );

  const fetchInvestorStream = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetching.current) return;
    isFetching.current = true;

    if (!addresses.fund || !addresses.wallet) {
      logger.log('Missing address data', {
        fundAddress: addresses.fund,
        walletAddress: addresses.wallet,
      });
      isFetching.current = false;
      return;
    }

    setLoading(true);

    try {
      // Query for streams from this wallet to the fund
      const query = `
        query InvestorStream($investor: String!, $fund: String!) {
          streams(
            where: {
              sender: $investor,
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
          variables: {
            investor: addresses.wallet,
            fund: addresses.fund,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const result: GraphQLResponse = await response.json();
      logger.log('Investor stream query result:', result);

      if (result.error) {
        throw new Error(result.error.message);
      }

      const streams = result.data?.streams || [];

      if (streams.length === 0) {
        // No active streams found
        setStream(null);
        setTotalStreamedAmount(BigInt(0));
        setDailyFlowRate('0');
        setError(null);
        return;
      }

      // We expect only one stream from an investor to a fund
      const investorStream = streams[0];

      const mappedStream = {
        id: investorStream.id,
        sender: investorStream.sender.id,
        receiver: investorStream.receiver.id,
        flowRate: investorStream.currentFlowRate,
        token: {
          id: investorStream.token.id,
          symbol: investorStream.token.symbol,
          decimals: Number(investorStream.token.decimals),
        },
        streamedUntilUpdatedAt: investorStream.streamedUntilUpdatedAt,
        updatedAtTimestamp: investorStream.updatedAtTimestamp,
      };

      setStream(mappedStream);

      // Calculate total streamed amount including real-time updates
      const now = Math.floor(Date.now() / 1000);
      const baseStreamed = BigInt(investorStream.streamedUntilUpdatedAt || '0');
      const lastUpdateTime = Number(investorStream.updatedAtTimestamp || '0');
      const timeElapsed = BigInt(now - lastUpdateTime);
      const flowRate = BigInt(investorStream.currentFlowRate);
      const additionalStreamed = timeElapsed * flowRate;

      const totalStreamed = baseStreamed + additionalStreamed;
      setTotalStreamedAmount(totalStreamed);

      // Calculate daily flow rate (tokens per day)
      const flowRatePerSecond = Number(flowRate) / 1e18;
      const dailyFlow = (flowRatePerSecond * 86400).toFixed(6); // 86400 seconds in a day
      setDailyFlowRate(dailyFlow);

      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch investor stream';
      setError(errorMsg);
      logger.error('Error fetching investor stream:', err);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [addresses]);

  // Make a single call when the component mounts or addresses change
  useEffect(() => {
    if (addresses.fund && addresses.wallet) {
      fetchInvestorStream();
    }
  }, [addresses.fund, addresses.wallet, fetchInvestorStream]);

  // Memoize return values to prevent unnecessary re-renders
  return useMemo(
    () => ({
      stream,
      loading,
      error,
      totalStreamedAmount,
      formattedTotalStreamed: formatEther(totalStreamedAmount),
      dailyFlowRate,
      refresh: fetchInvestorStream,
    }),
    [stream, loading, error, totalStreamedAmount, dailyFlowRate, fetchInvestorStream]
  );
}

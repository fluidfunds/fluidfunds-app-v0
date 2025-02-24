"use client";
import { useState, useEffect, useCallback } from 'react';
import { FLUID_FUNDS_SUBGRAPH_URL } from '@/app/config/contracts';
import { logger } from '@/app/utils/logger';

interface SubgraphFund {
  id: string;
  fundAddress: string;
  manager: string;
  name: string;
  fee: string; // BigInt as string from subgraph
  startTime: string; // BigInt as string from subgraph
  duration: string; // BigInt as string from subgraph
  blockNumber: string; // BigInt as string from subgraph
  blockTimestamp: string; // BigInt as string from subgraph
  transactionHash: string;
}

interface FundInfo {
  id: string;
  address: `0x${string}`; // fundAddress from subgraph
  name: string;
  manager: `0x${string}`; // manager from subgraph
  fee: bigint;
  startTime: number;
  duration: bigint;
  blockNumber: number;
  blockTimestamp: number;
  transactionHash: `0x${string}`;
}

interface FundManagerData {
  funds: FundInfo[];
  loading: boolean;
  error: string | null;
}

export function useFluidFundsSubgraphManager(pollInterval: number = 120000) {
  const [data, setData] = useState<FundManagerData>({
    funds: [],
    loading: false,
    error: null,
  });

  const fetchFunds = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true }));
    try {
      const query = `
        query Funds {
          fundCreateds(first: 10, orderBy: blockTimestamp, orderDirection: desc) {
            id
            fundAddress
            manager
            name
            fee
            startTime
            duration
            blockNumber
            blockTimestamp
            transactionHash
          }
        }
      `;

      const response = await fetch(FLUID_FUNDS_SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Subgraph request failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      const funds: SubgraphFund[] = result.data?.fundCreateds || [];
      logger.log('Subgraph funds fetched:', { funds, timestamp: Date.now() });

      const formattedFunds: FundInfo[] = funds.map((fund) => ({
        id: fund.id,
        address: fund.fundAddress as `0x${string}`,
        name: fund.name,
        manager: fund.manager as `0x${string}`,
        fee: BigInt(fund.fee), // Convert string to BigInt
        startTime: Number(fund.startTime), // Convert string to number (seconds)
        duration: BigInt(fund.duration), // Convert string to BigInt
        blockNumber: Number(fund.blockNumber), // Convert string to number
        blockTimestamp: Number(fund.blockTimestamp), // Convert string to number (seconds)
        transactionHash: fund.transactionHash as `0x${string}`,
      }));

      setData({ funds: formattedFunds, loading: false, error: null });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch funds';
      logger.error('Error fetching funds:', { error: err, timestamp: Date.now() });
      setData((prev) => ({ ...prev, loading: false, error: errorMsg }));
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let intervalId: NodeJS.Timeout | null = null;

    fetchFunds();

    intervalId = setInterval(() => {
      if (mounted) fetchFunds();
    }, pollInterval);

    return () => {
      mounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchFunds, pollInterval]);

  return { ...data };
}
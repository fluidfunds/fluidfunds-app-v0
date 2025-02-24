"use client";
import { useState, useEffect } from 'react';
import { FLUID_FUNDS_SUBGRAPH_URL } from '@/app/config/contracts';
import { logger } from '@/app/utils/logger';

interface FundDetails {
  id: string;
  address: `0x${string}`;
  name: string;
  manager: `0x${string}`;
  fee: bigint;
  startTime: number;
  duration: bigint;
  blockNumber: number;
  blockTimestamp: number;
  transactionHash: `0x${string}`;
}

interface FundDetailsData {
  fund: FundDetails | null;
  loading: boolean;
  error: string | null;
}

export function useFluidFundDetails(fundAddress: `0x${string}`) {
  const [data, setData] = useState<FundDetailsData>({
    fund: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    const fetchFundDetails = async () => {
      setData(prev => ({ ...prev, loading: true }));
      
      try {
        const query = `
          query FundDetails($fundAddress: String!) {
            fundCreateds(
              where: { fundAddress: $fundAddress }
              first: 1
            ) {
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
          body: JSON.stringify({
            query,
            variables: { fundAddress: fundAddress.toLowerCase() }
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        const fundData = result.data?.fundCreateds[0];

        if (!fundData) {
          throw new Error('Fund not found');
        }

        const formattedFund: FundDetails = {
          id: fundData.id,
          address: fundData.fundAddress as `0x${string}`,
          name: fundData.name,
          manager: fundData.manager as `0x${string}`,
          fee: BigInt(fundData.fee),
          startTime: Number(fundData.startTime),
          duration: BigInt(fundData.duration),
          blockNumber: Number(fundData.blockNumber),
          blockTimestamp: Number(fundData.blockTimestamp),
          transactionHash: fundData.transactionHash as `0x${string}`,
        };

        setData({
          fund: formattedFund,
          loading: false,
          error: null
        });

      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch fund details';
        logger.error('Error fetching fund details:', { error: err, timestamp: Date.now() });
        setData(prev => ({
          ...prev,
          loading: false,
          error: errorMsg
        }));
      }
    };

    fetchFundDetails();
  }, [fundAddress]);

  return data;
}
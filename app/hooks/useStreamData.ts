import { useCallback, useEffect, useState } from 'react'
import { SUPERFLUID_SUBGRAPH_URL, SUPERFLUID_ADDRESSES } from '../config/contracts'

interface StreamData {
  currentFlowRate: string;
  updatedAtTimestamp: string;
  token: {
    symbol: string;
  };
}

export function useStreamData(fundAddress: `0x${string}`) {
  const [streamData, setStreamData] = useState<StreamData>({
    currentFlowRate: '0',
    token: { symbol: 'USDCx' }, // Changed from FUDCx to USDCx
    updatedAtTimestamp: (Date.now() / 1000).toString()
  });

  const fetchStreamData = useCallback(async () => {
    try {
      const query = `
        query($fund: ID!, $token: ID!) {
          streams(
            where: {
              receiver: $fund,
              token: $token,
              currentFlowRate_gt: "0"
            }
          ) {
            currentFlowRate
            streamedUntilUpdatedAt
            updatedAtTimestamp
            token {
              id
              symbol
            }
          }
        }
      `;

      const response = await fetch(SUPERFLUID_SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          variables: {
            fund: fundAddress.toLowerCase(),
            token: SUPERFLUID_ADDRESSES.usdcx.toLowerCase()
          }
        })
      });

      const data = await response.json();
      console.log('Raw GraphQL Response:', JSON.stringify(data, null, 2));

      if (data.data?.streams?.length > 0) {
        const totalFlowRate = data.data.streams.reduce(
          (sum: bigint, stream: any) => sum + BigInt(stream.currentFlowRate),
          BigInt(0)
        );

        const latestTimestamp = Math.max(
          ...data.data.streams.map((s: any) => parseInt(s.updatedAtTimestamp))
        );

        setStreamData({
          currentFlowRate: totalFlowRate.toString(),
          updatedAtTimestamp: latestTimestamp.toString(),
          token: { symbol: 'USDCx' }
        });
      }
    } catch (error) {
      console.error('Error fetching stream data:', error);
    }
  }, [fundAddress]);

  useEffect(() => {
    fetchStreamData();
    const interval = setInterval(fetchStreamData, 5000);
    return () => clearInterval(interval);
  }, [fetchStreamData]);

  return streamData;
}
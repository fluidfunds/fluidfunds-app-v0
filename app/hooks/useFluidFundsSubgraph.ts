"use client";
import { useState, useEffect } from 'react';
import { FLUID_FUNDS_SUBGRAPH_URL } from '@/app/config/contracts';
import { logger } from '@/app/utils/logger';

interface Stream {
  id: string;
  flowRate: string;
  updatedAtTimestamp: string;
}

interface FundData {
  activeStreams: Stream[];
  totalFlowRate: bigint;
  earliestStartDate: Date;
}

export function useFluidFundsSubgraph(fundAddress?: `0x${string}`) {
  const [data, setData] = useState<FundData>({
    activeStreams: [],
    totalFlowRate: BigInt(0),
    earliestStartDate: new Date(),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!fundAddress) return;

    const fetchSubgraphData = async () => {
      setLoading(true);
      try {
        const query = `
          query FundStreams($address: String!) {
            account(id: $address) {
              inflows(where: { currentFlowRate_gt: "0" }) {
                id
                currentFlowRate
                updatedAtTimestamp
              }
            }
          }
        `;

        const response = await fetch(FLUID_FUNDS_SUBGRAPH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            variables: { address: fundAddress.toLowerCase() },
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Subgraph request failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        const inflows = result.data?.account?.inflows || [];
        logger.log('Subgraph data fetched:', { fundAddress, inflows, timestamp: Date.now() });

        const activeStreams = inflows.map((inflow: { id: string; currentFlowRate: string; updatedAtTimestamp: string }) => ({
          id: inflow.id,
          flowRate: inflow.currentFlowRate,
          updatedAtTimestamp: inflow.updatedAtTimestamp,
        }));

        const totalFlowRate = activeStreams.reduce((sum: bigint, stream: Stream) => sum + BigInt(stream.flowRate), BigInt(0));
        const earliestStartDate = activeStreams.length
          ? activeStreams.reduce((earliest: Date, stream: Stream) => {
              const streamDate = new Date(Number(stream.updatedAtTimestamp) * 1000);
              return streamDate < earliest ? streamDate : earliest;
            }, new Date(Number(activeStreams[0].updatedAtTimestamp) * 1000))
          : new Date();

        setData({ activeStreams, totalFlowRate, earliestStartDate });
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch subgraph data';
        setError(errorMsg);
        logger.error('Error fetching subgraph:', { error: err, timestamp: Date.now() });
      } finally {
        setLoading(false);
      }
    };

    fetchSubgraphData();
    const interval = setInterval(fetchSubgraphData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [fundAddress]);

  return { ...data, loading, error };
}
import { useEffect, useState } from 'react';
import { createPublicClient, http, parseAbi } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CFA_FORWARDER_ADDRESS, SUPERFLUID_ADDRESSES } from '@/app/config/contracts';

// Simplified ABI based on streme implementation
const cfaV1ForwarderAbi = parseAbi([
  'function getFlowInfo(address token, address sender, address receiver) external view returns' +
  '(uint256 lastUpdated, int96 flowRate, uint256 deposit, uint256 owedDeposit)'
]);

const client = createPublicClient({
  chain: baseSepolia,
  transport: http()
});

interface StreamInfo {
  flowRate: bigint;
  timestamp: number;
  isActive: boolean;
}

export function useStreamData(sender?: `0x${string}`, receiver?: `0x${string}`) {
  const [streamInfo, setStreamInfo] = useState<StreamInfo>({
    flowRate: BigInt(0),
    timestamp: 0,
    isActive: false
  });

  useEffect(() => {
    if (!sender || !receiver) return;

    const fetchStreamInfo = async () => {
      try {
        const flowInfo = await client.readContract({
          address: CFA_FORWARDER_ADDRESS,
          abi: cfaV1ForwarderAbi,
          functionName: 'getFlowInfo',
          args: [SUPERFLUID_ADDRESSES.usdcx, sender, receiver]
        });

        const [lastUpdated, flowRate] = flowInfo;
        
        setStreamInfo({
          flowRate: BigInt(flowRate),
          timestamp: Number(lastUpdated),
          isActive: BigInt(flowRate) > BigInt(0)
        });
      } catch (error) {
        console.error('Error fetching stream info:', error);
        setStreamInfo({
          flowRate: BigInt(0),
          timestamp: Date.now(),
          isActive: false
        });
      }
    };

    fetchStreamInfo();
    const interval = setInterval(fetchStreamInfo, 5000);

    return () => clearInterval(interval);
  }, [sender, receiver]);

  return streamInfo;
}
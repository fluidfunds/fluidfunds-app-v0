"use client";
import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useFlowingBalance } from '@/app/hooks/useFlowingBalance';
import { formatEther } from 'viem';
import { DollarSign } from 'lucide-react';
import { logger } from '@/app/utils/logger';


const ANIMATION_MINIMUM_STEP_TIME = 100; // Match useFlowingBalance

const absoluteValue = (n: bigint) => (n >= BigInt(0) ? n : -n);

const toFixedUsingString = (numStr: string, decimalPlaces: number): string => {
  const [wholePart, decimalPart] = numStr.split('.');
  if (!decimalPart || decimalPart.length <= decimalPlaces) {
    return numStr.padEnd(wholePart.length + 1 + decimalPlaces, '0');
  }
  const decimalPartBigInt = BigInt(`${decimalPart.slice(0, decimalPlaces)}${decimalPart[decimalPlaces] >= '5' ? '1' : '0'}`);
  return `${wholePart}.${decimalPartBigInt.toString().padStart(decimalPlaces, '0')}`;
};

const useSignificantFlowingDecimal = (flowRate: bigint, animationStepTimeInMs: number): number | undefined =>
  useMemo(() => {
    if (flowRate === BigInt(0)) return undefined;

    const ticksPerSecond = 1000 / animationStepTimeInMs;
    const flowRatePerTick = flowRate / BigInt(ticksPerSecond);
    const formatted = formatEther(flowRatePerTick);
    const [beforeEtherDecimal, afterEtherDecimal] = formatted.split('.');

    const isFlowingInWholeNumbers = absoluteValue(BigInt(beforeEtherDecimal)) > BigInt(0);
    if (isFlowingInWholeNumbers) return 0;

    const numberAfterDecimalWithoutLeadingZeroes = BigInt(afterEtherDecimal || '0');
    const lengthToFirstSignificantDecimal = afterEtherDecimal
      ?.toString()
      .replace(numberAfterDecimalWithoutLeadingZeroes.toString(), '').length || 0;

    return Math.min(lengthToFirstSignificantDecimal + 2, 18);
  }, [flowRate, animationStepTimeInMs]);

interface Stream {
  id: string;
  receiver: string;
  flowRate: string;
  token: { id: string; symbol: string; decimals: number };
  streamedUntilUpdatedAt?: string;
  updatedAtTimestamp?: string;
}

interface StreamItemProps {
  stream: Stream;
  fundAddress: `0x${string}`;
}

const StreamItem = memo(({ stream, fundAddress }: StreamItemProps) => {
  const startingBalanceDate = useMemo(() => new Date(Number(stream.updatedAtTimestamp) * 1000), [stream.updatedAtTimestamp]);
  const currentBalance = useFlowingBalance(BigInt(0), startingBalanceDate, BigInt(stream.flowRate));
  const decimalPlaces = useSignificantFlowingDecimal(BigInt(stream.flowRate), ANIMATION_MINIMUM_STEP_TIME);

  const formatValue = (value: bigint) => {
    const formattedEther = formatEther(value);
    const formatted = decimalPlaces !== undefined
      ? toFixedUsingString(formattedEther, decimalPlaces)
      : formattedEther;
    logger.log('StreamItem formatted value:', {
      fundAddress,
      streamId: stream.id,
      rawValue: value.toString(),
      formatted,
      timestamp: Date.now(),
    });
    return `${formatted} USDCx`;
  };

  console.log('StreamItem rendered:', { 
    fundAddress, 
    streamId: stream.id, 
    currentBalance: currentBalance.toString(), 
    timestamp: Date.now() 
  });

  return (
    <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.08]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <motion.div
            className="w-10 h-10 rounded-full bg-fluid-primary/10 flex-shrink-0 flex items-center justify-center border border-fluid-primary/20"
            initial={{ scale: 0.9, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <DollarSign className="w-5 h-5 text-fluid-primary" />
          </motion.div>
          <div>
            <div className="text-white font-medium">
              {stream.token.symbol.replace('fUSDCx', 'USDCx')}
            </div>
            <div className="text-sm text-white/60 mt-0.5">
              From: {stream.receiver.slice(0, 6)}...{stream.receiver.slice(-4)}
            </div>
          </div>
        </div>
        <motion.div
          className="text-sm text-fluid-primary/80 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeInOut" }}
        >
          {(Number(stream.flowRate) / 10 ** stream.token.decimals * 86400).toFixed(2)}/day
        </motion.div>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-white/60">Total</div>
        <span className="text-lg font-bold text-fluid-primary">
          {formatValue(currentBalance)}
        </span>
      </div>

      <div className="relative h-0.5 bg-fluid-primary/5 rounded-full overflow-hidden mt-3">
        <motion.div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-fluid-primary/30 to-fluid-primary/50"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 3, // Slowed from 2s to 3s for a calmer effect
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) =>
  prevProps.stream.id === nextProps.stream.id &&
  prevProps.stream.flowRate === nextProps.stream.flowRate &&
  prevProps.stream.updatedAtTimestamp === nextProps.stream.updatedAtTimestamp &&
  prevProps.fundAddress === nextProps.fundAddress
);

StreamItem.displayName = 'StreamItem';
export default StreamItem;
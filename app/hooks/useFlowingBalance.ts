'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { logger } from '@/app/utils/logger';

const ANIMATION_MINIMUM_STEP_TIME = 250; //

export function useFlowingBalance(
  startingBalance: bigint,
  startingBalanceDate: Date,
  flowRate: bigint
) {
  const [flowingBalance, setFlowingBalance] = useState(startingBalance);
  const startingBalanceTime = useMemo(() => startingBalanceDate.getTime(), [startingBalanceDate]);
  const lastAnimationTimestampRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);
  const previousBalanceRef = useRef<bigint>(startingBalance);

  useEffect(() => {
    if (flowRate === BigInt(0)) {
      setFlowingBalance(startingBalance);
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      return;
    }

    const animationStep = (currentAnimationTimestamp: number) => {
      if (
        currentAnimationTimestamp - lastAnimationTimestampRef.current <
        ANIMATION_MINIMUM_STEP_TIME
      ) {
        animationFrameIdRef.current = requestAnimationFrame(animationStep);
        return;
      }

      const elapsedTimeInMs = BigInt(Date.now() - startingBalanceTime);
      const newFlowingBalance = startingBalance + (flowRate * elapsedTimeInMs) / BigInt(1000);

      // Only update if the balance has changed significantly
      if (newFlowingBalance > previousBalanceRef.current) {
        setFlowingBalance(newFlowingBalance);
        previousBalanceRef.current = newFlowingBalance;
        logger.log('useFlowingBalance update:', {
          elapsedTimeInMs: elapsedTimeInMs.toString(),
          flowRate: flowRate.toString(),
          newFlowingBalance: newFlowingBalance.toString(),
          timestamp: Date.now(),
        });
      }

      lastAnimationTimestampRef.current = currentAnimationTimestamp;
      animationFrameIdRef.current = requestAnimationFrame(animationStep);
    };

    lastAnimationTimestampRef.current = 0;
    animationFrameIdRef.current = requestAnimationFrame(animationStep);

    return () => {
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [startingBalance, startingBalanceTime, flowRate]);

  return flowingBalance;
}

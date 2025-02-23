"use client";
import { useState, useEffect, useRef } from 'react';
import { logger } from '@/app/utils/logger';

const ANIMATION_MINIMUM_STEP_TIME = 100; // Increased from 40ms to 100ms for slower, fluid updates

export function useFlowingBalance(
  startingBalance: bigint,
  startingBalanceDate: Date,
  flowRate: bigint
) {
  const [flowingBalance, setFlowingBalance] = useState(startingBalance);
  const startingBalanceTime = startingBalanceDate.getTime();
  const lastAnimationTimestampRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (flowRate === BigInt(0)) {
      setFlowingBalance(startingBalance);
      if (animationFrameIdRef.current !== null) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      return;
    }

    const animationStep = (currentAnimationTimestamp: number) => {
      animationFrameIdRef.current = requestAnimationFrame(animationStep);

      if (currentAnimationTimestamp - lastAnimationTimestampRef.current >= ANIMATION_MINIMUM_STEP_TIME) {
        const elapsedTimeInMs = BigInt(Date.now() - startingBalanceTime);
        const newFlowingBalance = startingBalance + (flowRate * elapsedTimeInMs) / BigInt(1000);

        setFlowingBalance(newFlowingBalance);
        logger.log('useFlowingBalance update:', {
          elapsedTimeInMs: elapsedTimeInMs.toString(),
          flowRate: flowRate.toString(),
          newFlowingBalance: newFlowingBalance.toString(),
          timestamp: Date.now(),
        });

        lastAnimationTimestampRef.current = currentAnimationTimestamp;
      }
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
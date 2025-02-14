import React, { useEffect, useState, memo } from 'react';
import { formatEther } from 'viem';

// Types
interface FlowingBalanceProps {
  startingBalance: bigint;
  startingBalanceDate: Date;
  flowRate: bigint;
  className?: string;
}

// Constants
const ANIMATION_MINIMUM_STEP_TIME = 100;

// Component
const FlowingBalance = memo(({ 
  startingBalance, 
  startingBalanceDate, 
  flowRate, 
  className 
}: FlowingBalanceProps) => {
  const [currentBalance, setCurrentBalance] = useState(startingBalance);

  useEffect(() => {
    if (flowRate === BigInt(0)) {
      setCurrentBalance(startingBalance);
      return;
    }

    let lastAnimationTimestamp = 0;

    const updateBalance = (timestamp: number) => {
      if (timestamp - lastAnimationTimestamp >= ANIMATION_MINIMUM_STEP_TIME) {
        const timeDelta = BigInt(Date.now() - startingBalanceDate.getTime());
        const newBalance = startingBalance + (flowRate * timeDelta) / BigInt(1000);
        setCurrentBalance(newBalance);
        lastAnimationTimestamp = timestamp;
      }
      requestAnimationFrame(updateBalance);
    };

    const animationFrame = requestAnimationFrame(updateBalance);
    return () => cancelAnimationFrame(animationFrame);
  }, [startingBalance, startingBalanceDate, flowRate]);

  return (
    <div className={`flowing-balance ${className || ''}`}>
      {formatEther(currentBalance)} USDCx
      <div className="text-sm text-white/50">
        {formatEther(flowRate)} USDCx/second
      </div>
    </div>
  );
});

FlowingBalance.displayName = 'FlowingBalance';

export default FlowingBalance;
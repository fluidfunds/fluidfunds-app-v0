import React, { useEffect, useState, memo } from 'react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { formatEther } from 'viem';

// Types
interface FlowingBalanceProps {
  startingBalance: bigint;
  startingBalanceDate: Date;
  flowRate: bigint;
  formatValue: (value: bigint) => string;
  className?: string;
}

// Component
const FlowingBalance = memo(({ 
  startingBalance, 
  startingBalanceDate, 
  flowRate, 
  formatValue,
  className 
}: FlowingBalanceProps) => {
  const [currentBalance, setCurrentBalance] = useState<bigint>(startingBalance);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  useEffect(() => {
    if (flowRate === BigInt(0)) {
      setCurrentBalance(startingBalance);
      return;
    }

    let frameId: number;

    const updateBalance = (timestamp: number) => {
      const deltaTime = timestamp - lastUpdate;
      setLastUpdate(timestamp);
      
      const streamedAmount = (flowRate * BigInt(Math.floor(deltaTime))) / BigInt(1000);
      setCurrentBalance(prev => prev + streamedAmount);
      
      frameId = requestAnimationFrame(updateBalance);
    };

    // Initial calculation
    const initialElapsed = Date.now() - startingBalanceDate.getTime();
    const initialStreamed = (flowRate * BigInt(Math.floor(initialElapsed))) / BigInt(1000);
    setCurrentBalance(startingBalance + initialStreamed);

    frameId = requestAnimationFrame(updateBalance);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startingBalance, startingBalanceDate, flowRate]);

  // Simplified return without flow rate display
  return (
    <div className={`flowing-balance ${className || ''}`}>
      {formatValue(currentBalance)}
    </div>
  );
});

FlowingBalance.displayName = 'FlowingBalance';

export default FlowingBalance;
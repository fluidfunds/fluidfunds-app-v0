'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { useFluidFundsSubgraphManager } from './useFluidFundsSubgraphManager';

export type UserRole = 'manager' | 'investor';

export function useUserRole(fundAddress?: `0x${string}`) {
  const { address, isConnected } = useAccount();
  const [role, setRole] = useState<UserRole>('investor');
  const [isLoading, setIsLoading] = useState(true);

  // Get all funds from the subgraph
  const { funds, loading: fundsLoading } = useFluidFundsSubgraphManager();

  // Determine user role based on subgraph data
  const determineRole = useCallback(() => {
    if (!isConnected || !address || !fundAddress) {
      setRole('investor');
      setIsLoading(false);
      return;
    }

    // Check if we're still loading fund data
    if (fundsLoading) {
      return;
    }

    // 1. Find the current fund in our data
    const currentFund = funds.find(
      fund => fund.address.toLowerCase() === fundAddress.toLowerCase()
    );

    // 2. Check if the current user is the manager of this specific fund
    if (currentFund && currentFund.manager.toLowerCase() === address.toLowerCase()) {
      console.log('User is the manager of this specific fund');
      setRole('manager');
      setIsLoading(false);
      return;
    }

    // 3. Check if the user has created any other funds
    const userManagedFunds = funds.filter(
      fund => fund.manager.toLowerCase() === address.toLowerCase()
    );

    if (userManagedFunds.length > 0) {
      console.log('User is a fund manager (manages other funds):', userManagedFunds.length);
      // Even though they manage other funds, they are still an investor for this fund
      setRole('investor');
      setIsLoading(false);
      return;
    }

    // Default: user is an investor
    console.log('User is an investor (does not manage any funds)');
    setRole('investor');
    setIsLoading(false);
  }, [address, isConnected, fundAddress, funds, fundsLoading]);

  useEffect(() => {
    determineRole();
  }, [determineRole]);

  // Debug information
  const debugInfo = {
    currentFundDetails: fundAddress
      ? funds.find(fund => fund.address.toLowerCase() === fundAddress.toLowerCase())
      : null,
    userManagedFunds:
      isConnected && address
        ? funds.filter(fund => fund.manager.toLowerCase() === address.toLowerCase())
        : [],
    isCurrentFundManager:
      fundAddress && isConnected && address
        ? !!funds.find(
            fund =>
              fund.address.toLowerCase() === fundAddress.toLowerCase() &&
              fund.manager.toLowerCase() === address.toLowerCase()
          )
        : false,
  };

  return {
    role,
    isLoading: isLoading || fundsLoading,
    isManager: role === 'manager',
    // Add debug info
    debug: debugInfo,
  };
}

"use client";
import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useWalletClient, usePublicClient } from 'wagmi';
import { FLUID_FUNDS_ADDRESS, FLUID_FUNDS_ABI } from '@/app/config/contracts';
import { logger } from '@/app/utils/logger'; // Assuming you have a logger utility

interface CreateFundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFundCreated: () => void; // Callback to notify DashboardPage
}

// Updated accepted token for Sepolia (USDCx)
const ACCEPTED_TOKEN_ADDRESS = '0xb598E6C621618a9f63788816ffb50Ee2862D443B'; // USDCx on Sepolia

export function CreateFundModal({ isOpen, onClose, onFundCreated }: CreateFundModalProps) {
  const [name, setName] = useState('');
  const [profitSharingPercentage, setProfitSharingPercentage] = useState('');
  const [subscriptionEndDate, setSubscriptionEndDate] = useState('');
  const [fundDuration, setFundDuration] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletClient?.account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!publicClient) {
      toast.error('Network client not initialized');
      return;
    }

    setLoading(true);

    try {
      const creatingToast = toast.loading('Creating fund...');

      // Convert profitSharingPercentage to basis points (e.g., 30% -> 3000)
      const profitSharingBasisPoints = BigInt(parseInt(profitSharingPercentage) * 100);
      const fundDurationInSeconds = BigInt(parseInt(fundDuration) * 24 * 60 * 60);
      const subscriptionEndTimestamp = BigInt(Math.floor(new Date(subscriptionEndDate).getTime() / 1000));

      logger.log('Creating fund with params:', {
        name,
        profitSharingBasisPoints,
        subscriptionEndTimestamp,
        fundDurationInSeconds,
        acceptedToken: ACCEPTED_TOKEN_ADDRESS,
        sender: walletClient.account.address,
      });

      const { request } = await publicClient.simulateContract({
        address: FLUID_FUNDS_ADDRESS,
        abi: FLUID_FUNDS_ABI,
        functionName: 'createFund',
        args: [
          name,
          profitSharingBasisPoints, // Use basis points (e.g., 30% = 3000)
          subscriptionEndTimestamp,
          fundDurationInSeconds,
          ACCEPTED_TOKEN_ADDRESS, // Updated USDCx address for Sepolia
        ],
        account: walletClient.account,
      });

      const hash = await walletClient.writeContract(request);
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      logger.log('Fund created successfully:', { hash, receipt });
      toast.success('Fund created successfully!', { id: creatingToast });
      onFundCreated(); // Notify DashboardPage to refetch funds without navigation
      onClose(); // Close modal without triggering reload
    } catch (error) {
      console.error('Error creating fund:', error);
      let errorMessage = 'Failed to create fund: Unknown error';
      if (error instanceof Error) {
        errorMessage = `Failed to create fund: ${error.message}`;
        // Try to parse revert reason if available (e.g., from EVM revert data)
        if (error.cause && typeof error.cause === 'object' && 'data' in error.cause) {
          logger.error('Contract revert data:', { data: error.cause.data });
          toast.error(`Contract reverted: ${error.message}. Check logs for details.`);
        }
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [walletClient, publicClient, name, profitSharingPercentage, subscriptionEndDate, fundDuration, onFundCreated, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setProfitSharingPercentage('');
      setSubscriptionEndDate('');
      setFundDuration('');
      setLoading(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full max-w-2xl p-6 rounded-xl bg-[#0A0A0A] border border-white/[0.08]"
      >
        <h2 className="text-xl font-medium mb-6 text-white">Create New Fund</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Fund Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/40 focus:outline-none focus:border-fluid-primary transition-colors"
                placeholder="Enter fund name"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Profit Sharing (%)</label>
              <input
                type="number"
                value={profitSharingPercentage}
                onChange={(e) => setProfitSharingPercentage(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/40 focus:outline-none focus:border-fluid-primary transition-colors"
                placeholder="e.g., 20"
                min="0"
                max="100"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Subscription End Date</label>
              <input
                type="datetime-local"
                value={subscriptionEndDate}
                onChange={(e) => setSubscriptionEndDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white focus:outline-none focus:border-fluid-primary transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Fund Duration (days)</label>
              <input
                type="number"
                value={fundDuration}
                onChange={(e) => setFundDuration(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/40 focus:outline-none focus:border-fluid-primary transition-colors"
                min="1"
                required
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-white/[0.05] text-white hover:bg-white/[0.08] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 rounded-lg bg-fluid-primary text-white font-medium hover:bg-fluid-primary/90 transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Fund'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
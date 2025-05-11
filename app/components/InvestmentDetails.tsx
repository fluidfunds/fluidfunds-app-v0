import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Copy } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { toast } from 'sonner';
import { useSuperfluid } from '@/app/hooks/useSuperfluid';
import { copyToClipboard, formatAddress } from '../utils/common';

interface AddressRowProps {
  label: string;
  address: string;
  showFull?: boolean;
}

const AddressRow = ({ label, address, showFull = false }: AddressRowProps) => (
  <div className="flex flex-col space-y-1 border-b border-white/[0.05] py-3">
    <span className="text-sm text-white/60">{label}</span>
    <div className="group flex items-center justify-between gap-2 rounded-lg bg-black/20 p-2">
      <code className="break-all font-mono text-xs text-white/90 sm:text-sm">
        {showFull ? address : formatAddress(address)}
      </code>
      <button
        onClick={() => copyToClipboard(address, 'Address copied to clipboard')}
        className="flex-shrink-0 rounded-md p-1.5 opacity-50 transition-colors hover:bg-white/10 group-hover:opacity-100"
        title="Copy address"
      >
        <Copy className="h-3 w-3 text-white" />
      </button>
    </div>
  </div>
);

interface InvestmentDetailsProps {
  fundAddress: `0x${string}`;
  fundDetails: {
    name: string;
    manager: `0x${string}`;
    profitSharingPercentage: number;
    subscriptionEndTime: number;
  } | null;
  isConnected: boolean;
}

export function InvestmentDetails({
  fundAddress,
  fundDetails,
  isConnected,
}: InvestmentDetailsProps) {
  const [streamAmount, setStreamAmount] = useState('');
  const { createStream, loading: isStreaming, usdcxBalance } = useSuperfluid(fundAddress);

  const handleCreateStream = async () => {
    if (!streamAmount || parseFloat(streamAmount) <= 0) {
      toast.error('Please enter a valid stream amount');
      return;
    }

    try {
      const result = await createStream(fundAddress, streamAmount);
      if (result) {
        toast.success('Stream created successfully!');
        setStreamAmount('');
      }
    } catch (error: unknown) {
      console.error('Error creating stream:', error);
      toast.error('Failed to create stream. Please ensure you have enough USDCx balance.');
    }
  };

  const AddressDisplay = useMemo(
    () => (
      <div className="space-y-2 rounded-lg bg-black/20 p-4">
        <AddressRow label="Fund Address" address={fundAddress} />
        {fundDetails?.manager && <AddressRow label="Fund Manager" address={fundDetails.manager} />}
        <div className="flex items-center justify-between pt-3">
          <span className="text-white/60">Fund Fee</span>
          <span className="font-medium text-white">
            {fundDetails ? `${fundDetails.profitSharingPercentage}%` : '--'}
          </span>
        </div>
      </div>
    ),
    [fundAddress, fundDetails]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-24 rounded-xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-sm"
    >
      <div className="mb-6 flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-white">Investment Details</h3>
        <div className="flex w-fit items-center gap-2 rounded-full bg-green-400/10 px-2 py-1 text-sm text-green-400">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
          <span>Open</span>
        </div>
      </div>

      <div className="space-y-2">
        {AddressDisplay}

        {!isConnected ? (
          <div className="py-6 text-center">
            <Wallet className="mx-auto mb-3 h-12 w-12 text-fluid-primary" />
            <h4 className="mb-2 font-medium text-white">Connect Your Wallet</h4>
            <p className="mb-4 text-sm text-white/60">Connect your wallet to start investing</p>
            <div className="flex justify-center">
              <ConnectButton
                chainStatus="icon"
                showBalance={false}
                accountStatus={{
                  smallScreen: 'avatar',
                  largeScreen: 'full',
                }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between px-1 text-sm text-white/60">
              <span>Balance:</span>
              <span>{parseFloat(usdcxBalance).toFixed(2)} USDCx</span>
            </div>

            <div>
              <label htmlFor="streamAmount" className="mb-2 block px-1 text-sm text-white/60">
                Monthly Investment Amount
              </label>
              <div className="relative">
                <input
                  id="streamAmount"
                  type="number"
                  value={streamAmount}
                  onChange={e => setStreamAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="h-12 w-full rounded-lg border border-white/10 bg-black/20 px-4 text-white placeholder-white/40 transition-colors focus:border-fluid-primary focus:outline-none"
                  min="0"
                  step="0.01"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/40">
                  USDC/month
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateStream}
              disabled={isStreaming || !streamAmount}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-fluid-primary font-semibold text-white transition-all duration-200 hover:bg-fluid-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isStreaming ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white"
                  />
                  <span>Processing...</span>
                </>
              ) : (
                'Invest Now'
              )}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

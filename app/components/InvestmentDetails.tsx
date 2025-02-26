import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Copy } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { toast } from 'sonner';
import { useSuperfluid } from '@/app/hooks/useSuperfluid';

interface AddressRowProps {
  label: string;
  address: string;
  showFull?: boolean;
}

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

  const formatAddress = (address: string): string => 
    `${address.slice(0, 6)}...${address.slice(-4)}`;

  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Address copied to clipboard');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err: unknown) {
      toast.error('Failed to copy address');
    }
  };

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

  const AddressRow = ({ label, address, showFull = false }: AddressRowProps) => (
    <div className="flex flex-col py-3 border-b border-white/[0.05] space-y-1">
      <span className="text-white/60 text-sm">{label}</span>
      <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 group">
        <code className="text-white/90 text-xs sm:text-sm font-mono break-all">
          {showFull ? address : formatAddress(address)}
        </code>
        <button
          onClick={() => copyToClipboard(address)}
          className="p-1.5 hover:bg-white/10 rounded-md transition-colors flex-shrink-0 opacity-50 group-hover:opacity-100"
          title="Copy address"
        >
          <Copy className="w-3 h-3 text-white" />
        </button>
      </div>
    </div>
  );

  const AddressDisplay = useMemo(() => (
    <div className="bg-black/20 rounded-lg p-4 space-y-2">
      <AddressRow label="Fund Address" address={fundAddress} showFull={true} />
      {fundDetails?.manager && (
        <AddressRow label="Fund Manager" address={fundDetails.manager} />
      )}
      <div className="flex justify-between items-center pt-3">
        <span className="text-white/60">Fund Fee</span>
        <span className="text-white font-medium">
          {fundDetails ? `${fundDetails.profitSharingPercentage}%` : '--'}
        </span>
      </div>
    </div>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [fundAddress, fundDetails, formatAddress, copyToClipboard]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] rounded-xl p-6 backdrop-blur-sm border border-white/[0.08] sticky top-24"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white">Investment Details</h3>
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span>Open for Investment</span>
        </div>
      </div>

      <div className="space-y-6">
        {AddressDisplay}

        {!isConnected ? (
          <div className="text-center py-6">
            <Wallet className="w-12 h-12 text-fluid-primary mx-auto mb-3" />
            <h4 className="text-white font-medium mb-2">Connect Your Wallet</h4>
            <p className="text-white/60 text-sm mb-4">
              Connect your wallet to start investing
            </p>
            <div className="flex justify-center">
              <ConnectButton 
                chainStatus="icon"
                showBalance={false}
                accountStatus={{
                  smallScreen: "avatar",
                  largeScreen: "full",
                }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-white/60 flex justify-between items-center">
              <span>Available Balance:</span>
              <span>{parseFloat(usdcxBalance).toFixed(2)} USDCx</span>
            </div>

            <div>
              <label htmlFor="streamAmount" className="block text-sm text-white/60 mb-2">
                Monthly Investment Amount
              </label>
              <div className="relative">
                <input
                  id="streamAmount"
                  type="number"
                  value={streamAmount}
                  onChange={(e) => setStreamAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full h-12 px-4 rounded-lg bg-black/20 border border-white/10 
                          text-white placeholder-white/40 focus:outline-none focus:border-fluid-primary
                          transition-colors"
                  min="0"
                  step="0.01"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">
                  USDC/month
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateStream}
              disabled={isStreaming || !streamAmount}
              className="w-full h-12 rounded-lg bg-fluid-primary text-white font-semibold
                      hover:bg-fluid-primary/90 transition-all duration-200 disabled:opacity-50
                      disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isStreaming ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
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
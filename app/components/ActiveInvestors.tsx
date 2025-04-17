'use client';

import { Wallet, Copy, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StreamInfo {
  id: string;
  sender: {
    id: string;
  };
  flowRatePerDay: number;
  currentAmount: number;
}

interface ActiveInvestorsProps {
  streams: StreamInfo[];
  loading: boolean;
}

export const ActiveInvestors = ({ streams, loading }: ActiveInvestorsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);

  const formatAddress = useCallback(
    (address: string): string => `${address.slice(0, 6)}...${address.slice(-4)}`,
    []
  );

  const copyToClipboard = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Address copied to clipboard');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err: unknown) {
      toast.error('Failed to copy address');
    }
  };

  return (
    <div className="mt-8">
      <div className="relative">
        {/* Dropdown Header */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-white backdrop-blur-sm transition-colors hover:bg-white/[0.05]"
        >
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-fluid-primary" />
            <span className="font-semibold">Active Investors ({streams.length})</span>
          </div>
          <ChevronDown
            className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-white/[0.08] bg-gray-900/95 shadow-xl backdrop-blur-sm"
            >
              {loading ? (
                <div className="p-4 text-center text-white/60">
                  <div className="mx-auto mb-2 h-5 w-5 animate-spin rounded-full border-2 border-fluid-primary border-t-transparent" />
                  Loading investors...
                </div>
              ) : streams.length === 0 ? (
                <div className="p-4 text-center text-white/60">No active investors yet</div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  {streams.map(stream => (
                    <div key={stream.id}>
                      <button
                        onClick={() =>
                          setSelectedStream(selectedStream === stream.id ? null : stream.id)
                        }
                        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-white/[0.05]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-fluid-primary/10">
                            <Wallet className="h-4 w-4 text-fluid-primary" />
                          </div>
                          <div>
                            <code className="font-mono text-sm text-white/90">
                              {formatAddress(stream.sender.id)}
                            </code>
                            <p className="text-sm text-white/60">
                              {stream.flowRatePerDay.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 2,
                              })}{' '}
                              / day
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            selectedStream === stream.id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      <AnimatePresence>
                        {selectedStream === stream.id && (
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: 'auto' }}
                            exit={{ height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="space-y-4 bg-black/20 p-4 pl-14 pt-0">
                              <div className="space-y-2">
                                <span className="text-sm text-white/60">Full Address:</span>
                                <div className="group flex items-center gap-2 rounded-lg bg-black/20 p-2">
                                  <code className="break-all font-mono text-xs text-white/90 sm:text-sm">
                                    {stream.sender.id}
                                  </code>
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      copyToClipboard(stream.sender.id);
                                    }}
                                    className="flex-shrink-0 rounded-md p-1.5 opacity-50 transition-colors hover:bg-white/10 group-hover:opacity-100"
                                  >
                                    <Copy className="h-3 w-3 text-white" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg bg-white/[0.02] p-3">
                                  <p className="mb-1 text-sm text-white/60">Daily Flow</p>
                                  <p className="font-medium text-white">
                                    {stream.flowRatePerDay.toLocaleString('en-US', {
                                      style: 'currency',
                                      currency: 'USD',
                                      minimumFractionDigits: 2,
                                    })}
                                  </p>
                                </div>
                                <div className="rounded-lg bg-white/[0.02] p-3">
                                  <p className="mb-1 text-sm text-white/60">Total Invested</p>
                                  <p className="font-medium text-white">
                                    {stream.currentAmount.toLocaleString('en-US', {
                                      style: 'currency',
                                      currency: 'USD',
                                      minimumFractionDigits: 2,
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

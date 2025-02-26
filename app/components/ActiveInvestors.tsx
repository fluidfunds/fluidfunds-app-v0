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

  const formatAddress = useCallback((address: string): string => 
    `${address.slice(0, 6)}...${address.slice(-4)}`, []);

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
          className="w-full bg-white/[0.02] rounded-xl backdrop-blur-sm border border-white/[0.08] p-4 flex items-center justify-between text-white hover:bg-white/[0.05] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-fluid-primary" />
            <span className="font-semibold">
              Active Investors ({streams.length})
            </span>
          </div>
          <ChevronDown
            className={`w-5 h-5 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Content */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 bg-gray-900/95 rounded-xl border border-white/[0.08] shadow-xl backdrop-blur-sm overflow-hidden"
            >
              {loading ? (
                <div className="p-4 text-center text-white/60">
                  <div className="animate-spin w-5 h-5 border-2 border-fluid-primary border-t-transparent rounded-full mx-auto mb-2" />
                  Loading investors...
                </div>
              ) : streams.length === 0 ? (
                <div className="p-4 text-center text-white/60">
                  No active investors yet
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto">
                  {streams.map((stream) => (
                    <div key={stream.id}>
                      <button
                        onClick={() => setSelectedStream(selectedStream === stream.id ? null : stream.id)}
                        className="w-full p-4 flex items-center justify-between hover:bg-white/[0.05] transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-fluid-primary/10 flex items-center justify-center">
                            <Wallet className="w-4 h-4 text-fluid-primary" />
                          </div>
                          <div>
                            <code className="text-white/90 text-sm font-mono">
                              {formatAddress(stream.sender.id)}
                            </code>
                            <p className="text-sm text-white/60">
                              {stream.flowRatePerDay.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                                minimumFractionDigits: 2,
                              })} / day
                            </p>
                          </div>
                        </div>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
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
                            <div className="p-4 pt-0 pl-14 space-y-4 bg-black/20">
                              <div className="space-y-2">
                                <span className="text-white/60 text-sm">Full Address:</span>
                                <div className="bg-black/20 rounded-lg p-2 flex items-center gap-2 group">
                                  <code className="text-white/90 text-xs sm:text-sm font-mono break-all">
                                    {stream.sender.id}
                                  </code>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(stream.sender.id);
                                    }}
                                    className="p-1.5 hover:bg-white/10 rounded-md transition-colors flex-shrink-0 opacity-50 group-hover:opacity-100"
                                  >
                                    <Copy className="w-3 h-3 text-white" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/[0.02] rounded-lg p-3">
                                  <p className="text-sm text-white/60 mb-1">Daily Flow</p>
                                  <p className="text-white font-medium">
                                    {stream.flowRatePerDay.toLocaleString('en-US', {
                                      style: 'currency',
                                      currency: 'USD',
                                      minimumFractionDigits: 2,
                                    })}
                                  </p>
                                </div>
                                <div className="bg-white/[0.02] rounded-lg p-3">
                                  <p className="text-sm text-white/60 mb-1">Total Invested</p>
                                  <p className="text-white font-medium">
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
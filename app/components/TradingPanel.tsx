/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown, Info, AlertTriangle, TrendingUp } from 'lucide-react';
import { Address, formatEther, formatUnits } from 'viem';
import { useTrading } from '@/app/hooks/useTrading';
import { TokenSelect } from './TokenSelect';
import { AVAILABLE_TOKENS, type Token } from '@/app/types/trading';
import { toast } from 'sonner';

// Token price mapping
const TOKEN_PRICES: Record<string, number> = {
  fUSDC: 1.0,
  fDAI: 1.01,
  LTC: 91.9987,
  ETH: 2239.96,
  BTC: 101879.0,
  AAVE: 31.9997,
  DOGE: 0.36996,
};

interface TradingPanelProps {
  fundAddress: Address;
}

const formatBalance = (balance: bigint | undefined, decimals: number = 18): string => {
  if (!balance) return '0';

  const rawNumber = formatUnits(balance, decimals);
  const num = parseFloat(rawNumber);

  // Format based on token type and amount size
  if (num < 0.000001) {
    return '< 0.000001';
  }

  switch (decimals) {
    case 8: // BTC
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 8,
      });
    case 18: // DOGE, LTC
      if (num < 1) {
        // For small numbers, show more decimals
        return num.toLocaleString(undefined, {
          minimumFractionDigits: 8,
          maximumFractionDigits: 8,
        });
      }
      // For larger numbers, show fewer decimals
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      });
    default:
      return num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 6,
      });
  }
};

const parseTokenAmount = (amount: string, decimals: number): bigint => {
  try {
    // Remove any trailing dots to handle partial inputs
    const sanitizedAmount = amount.replace(/\.?0+$/, '');

    // Split on decimal point
    const [whole, fraction = ''] = sanitizedAmount.split('.');

    // Combine whole and fraction, padding with zeros
    const paddedFraction = fraction.padEnd(decimals, '0');
    const combinedAmount = `${whole}${paddedFraction}`;

    // Remove leading zeros
    const trimmedAmount = combinedAmount.replace(/^0+/, '') || '0';

    return BigInt(trimmedAmount);
  } catch (error) {
    console.error('Error parsing amount:', error);
    throw new Error('Invalid amount format');
  }
};

export const TradingPanel = ({ fundAddress }: TradingPanelProps) => {
  const {
    swap,
    USDCBalance,
    USDCRegularBalance,
    USDCxBalance,
    DAIBalance,
    LTCBalance,
    ETHBalance,
    BTCBalance,
    AAVEBalance,
    DOGEBalance,
    isLoadingBalances,
    tokenBalances,
  } = useTrading(fundAddress);

  const [amount, setAmount] = useState<string>('');
  const [tokenIn, setTokenIn] = useState<Token | null>(null);
  const [tokenOut, setTokenOut] = useState<Token | null>(null);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);
  const [showBalanceInfo, setShowBalanceInfo] = useState<boolean>(false);
  const [slippage, setSlippage] = useState<number>(0.5); // Default 0.5% slippage

  // Set default tokens on load
  useEffect(() => {
    if (AVAILABLE_TOKENS.length >= 2) {
      const defaultTokenIn =
        AVAILABLE_TOKENS.find(t => t.symbol === 'fUSDC') || AVAILABLE_TOKENS[0];
      const defaultTokenOut = AVAILABLE_TOKENS.find(t => t.symbol === 'BTC') || AVAILABLE_TOKENS[1];

      setTokenIn(defaultTokenIn);
      setTokenOut(defaultTokenOut);
    }
  }, []);

  const getBalance = (token: Token | null): bigint => {
    if (!token) return 0n;

    switch (token.symbol) {
      case 'fUSDC':
        return BigInt(USDCBalance?.toString() ?? '0');
      case 'fDAI':
        return BigInt(DAIBalance?.toString() ?? '0');
      case 'LTC':
        return BigInt(LTCBalance?.toString() ?? '0');
      case 'ETH':
        return BigInt(ETHBalance?.toString() ?? '0');
      case 'BTC':
        return BigInt(BTCBalance?.toString() ?? '0');
      case 'AAVE':
        return BigInt(AAVEBalance?.toString() ?? '0');
      case 'DOGE':
        return BigInt(DOGEBalance?.toString() ?? '0');
      default:
        // Try tokenBalances as fallback
        return tokenBalances[token.address.toLowerCase()] || 0n;
    }
  };

  // Calculate max amount user can input based on balance
  const maxAmount = (token: Token | null): string => {
    if (!token) return '0';
    const balance = getBalance(token);
    return formatUnits(balance, token.decimals || 18);
  };

  const handleSetMaxAmount = () => {
    if (tokenIn) {
      setAmount(maxAmount(tokenIn));
    }
  };

  const handleTokenInChange = (token: Token | null) => {
    setTokenIn(token);
  };

  const handleTokenOutChange = (token: Token | null) => {
    setTokenOut(token);
  };

  // Calculate estimated output amount based on token prices
  const calculateEstimatedOutput = (): string => {
    if (!amount || !tokenIn || !tokenOut) return '';

    // Get token prices
    const inputPrice = TOKEN_PRICES[tokenIn.symbol] || 1;
    const outputPrice = TOKEN_PRICES[tokenOut.symbol] || 1;

    // Calculate based on price ratio with slippage
    const inputAmount = parseFloat(amount);
    const estimatedOutput = ((inputAmount * inputPrice) / outputPrice) * (1 - slippage / 100);

    return estimatedOutput.toFixed(6);
  };

  // Calculate dollar value
  const calculateDollarValue = (tokenAmount: string, tokenSymbol: string): string => {
    if (!tokenAmount || !tokenSymbol) return '$0.00';
    const amount = parseFloat(tokenAmount);
    const price = TOKEN_PRICES[tokenSymbol] || 0;
    return `$${(amount * price).toFixed(2)}`;
  };

  const handleSwap = async () => {
    if (!amount || !tokenIn || !tokenOut) {
      toast.error('Please select tokens and enter an amount');
      return;
    }

    // Check if amount exceeds balance
    const inputAmount = parseTokenAmount(amount, tokenIn.decimals || 18);
    const balance = getBalance(tokenIn);
    if (inputAmount > balance) {
      toast.error(
        `Insufficient balance. Max: ${formatBalance(balance, tokenIn.decimals || 18)} ${tokenIn.symbol}`
      );
      return;
    }

    try {
      setIsSwapping(true);

      // Prepare swap parameters
      const swapParams = {
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        amountIn: inputAmount,
        poolFee: 3000,
      };

      const txHash = await swap(swapParams);

      toast.success(
        <div className="flex flex-col gap-1">
          <div className="font-medium">Trade submitted!</div>
          <div className="text-xs">
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              View on Etherscan
            </a>
          </div>
        </div>
      );

      setAmount('');
    } catch (error) {
      console.error('Trade failed:', error);
      toast.error(error instanceof Error ? error.message : 'Trade failed. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  // Display token balances with streaming info when applicable
  const BalanceDisplay = ({ token }: { token: Token }) => {
    if (token.symbol === 'fUSDC') {
      return (
        <div className="flex items-center gap-1">
          <div className="text-xs text-white/60">
            {formatBalance(USDCBalance, token.decimals || 18)} {token.symbol}
          </div>
          <button
            onClick={() => setShowBalanceInfo(!showBalanceInfo)}
            className="rounded-full p-1 hover:bg-white/10"
          >
            <Info size={12} className="text-blue-300" />
          </button>
        </div>
      );
    }

    return (
      <div className="text-xs text-white/60">
        {formatBalance(getBalance(token), token.decimals || 18)} {token.symbol}
      </div>
    );
  };

  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/80 p-6 shadow-xl backdrop-blur-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Swap Tokens</h3>
        <div className="flex items-center gap-2">
          <div className="text-xs text-white/60">Slippage: </div>
          <select
            value={slippage}
            onChange={e => setSlippage(parseFloat(e.target.value))}
            className="rounded bg-white/10 px-2 py-1 text-xs text-white outline-none"
          >
            <option value="0.1">0.1%</option>
            <option value="0.5">0.5%</option>
            <option value="1">1.0%</option>
            <option value="2">2.0%</option>
          </select>
        </div>
      </div>

      {/* Info panel for streaming tokens */}
      {showBalanceInfo && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-4 rounded-lg border border-blue-500/20 bg-blue-900/20 p-3"
        >
          <div className="flex items-start gap-2">
            <Info size={16} className="mt-0.5 text-blue-400" />
            <div>
              <h4 className="text-sm font-medium text-blue-200">Balance Breakdown</h4>
              <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="text-blue-300">Regular fUSDC:</div>
                <div className="text-white">{formatBalance(USDCRegularBalance)} fUSDC</div>

                <div className="text-blue-300">Streaming fUSDCx:</div>
                <div className="text-white">{formatBalance(USDCxBalance)} fUSDCx</div>
              </div>
              <p className="mt-2 text-xs text-blue-300">
                The streaming balance (fUSDCx) will automatically be converted to regular tokens
                during trades.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        {/* Input Token */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-white/70">From</label>
            {tokenIn && (
              <div className="flex items-center gap-2">
                <div className="text-xs text-white/60">Balance:</div>
                <BalanceDisplay token={tokenIn} />
                <button
                  onClick={handleSetMaxAmount}
                  className="rounded bg-white/10 px-2 py-0.5 text-xs text-blue-400 transition-colors hover:bg-white/20"
                >
                  MAX
                </button>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-white/5 bg-black/30 p-4">
            <div className="flex items-center gap-4">
              <div className="w-1/3">
                <TokenSelect
                  value={tokenIn}
                  onChange={handleTokenInChange}
                  tokens={AVAILABLE_TOKENS.filter(t => t.address !== tokenOut?.address)}
                />
              </div>

              <div className="flex-1">
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="w-full bg-transparent text-right text-2xl text-white outline-none"
                />
                {amount && tokenIn && (
                  <div className="mt-1 text-right text-xs text-gray-400">
                    {calculateDollarValue(amount, tokenIn.symbol)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Swap Direction Button */}
        <div className="relative flex justify-center">
          <button
            onClick={() => {
              const tempIn = tokenIn;
              setTokenIn(tokenOut);
              setTokenOut(tempIn);
            }}
            className="absolute -mt-2 rounded-full border border-white/10 bg-gray-700 p-2 shadow-lg transition-colors hover:bg-gray-600"
          >
            <ArrowUpDown className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Output Token */}
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm text-white/70">To (estimated)</label>
            {tokenOut && (
              <div className="flex items-center gap-2">
                <div className="text-xs text-white/60">Balance:</div>
                <BalanceDisplay token={tokenOut} />
              </div>
            )}
          </div>

          <div className="rounded-lg border border-white/5 bg-black/30 p-4">
            <div className="flex items-center gap-4">
              <div className="w-1/3">
                <TokenSelect
                  value={tokenOut}
                  onChange={handleTokenOutChange}
                  tokens={AVAILABLE_TOKENS.filter(t => t.address !== tokenIn?.address)}
                />
              </div>

              <div className="flex-1 text-right">
                <div className="text-2xl text-white">{calculateEstimatedOutput() || '0.0'}</div>
                {amount && tokenIn && tokenOut && (
                  <div className="mt-1 text-xs text-gray-400">
                    {calculateDollarValue(calculateEstimatedOutput(), tokenOut.symbol)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Trading details */}
        {tokenIn && tokenOut && amount && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-white/80">Trade Details</span>
              {slippage > 1 && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <AlertTriangle size={12} />
                  <span className="text-xs">High Slippage</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Rate</span>
                <span className="text-white">
                  1 {tokenIn.symbol} ={' '}
                  {(TOKEN_PRICES[tokenIn.symbol] / TOKEN_PRICES[tokenOut.symbol]).toFixed(8)}{' '}
                  {tokenOut.symbol}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Network Fee</span>
                <span className="text-white">0.3%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Slippage Tolerance</span>
                <span className="text-white">{slippage}%</span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Minimum Received</span>
                <span className="text-white">
                  {(parseFloat(calculateEstimatedOutput()) * (1 - slippage / 100)).toFixed(6)}{' '}
                  {tokenOut.symbol}
                </span>
              </div>
            </div>

            <div className="mt-3 border-t border-white/10 pt-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">Expected Output</span>
                <div className="flex items-center">
                  <TrendingUp size={12} className="mr-1 text-green-400" />
                  <span className="font-medium text-white">
                    {calculateEstimatedOutput()} {tokenOut.symbol}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={isSwapping || !amount || !tokenIn || !tokenOut || isLoadingBalances}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 font-medium text-white shadow-lg shadow-blue-900/30 transition-all hover:from-blue-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:from-gray-700 disabled:to-gray-800 disabled:text-gray-400"
        >
          {isSwapping ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="h-4 w-4 rounded-full border-2 border-white/20 border-t-white"
              />
              <span>Processing Swap...</span>
            </>
          ) : isLoadingBalances ? (
            'Loading Balances...'
          ) : !amount ? (
            'Enter an Amount'
          ) : parseTokenAmount(amount, tokenIn?.decimals || 18) > getBalance(tokenIn) ? (
            'Insufficient Balance'
          ) : (
            'Swap Tokens'
          )}
        </button>

        {/* Additional info about the fund and trading */}
        <div className="mt-4 text-center">
          <button
            onClick={() => window.open('https://docs.superfluid.finance/', '_blank')}
            className="text-xs text-blue-400 transition-colors hover:text-blue-300"
          >
            Learn more about streaming tokens
          </button>
        </div>
      </div>
    </div>
  );
};

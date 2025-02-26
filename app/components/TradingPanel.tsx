import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUpDown } from 'lucide-react';
import { Address, formatEther } from 'viem';
import { useTrading } from '@/app/hooks/useTrading';
import { TokenSelect } from './TokenSelect';
import { AVAILABLE_TOKENS, type Token } from '@/app/types/trading';
import { toast } from 'sonner';


interface TradingPanelProps {
  fundAddress: Address;
}

const formatBalance = (balance: bigint | undefined): string => {
  if (!balance) return '0';
  return formatEther(balance);
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
  // @ts-expect-error names
  const { swap, fUSDCBalance, fDAIBalance } = useTrading(fundAddress);
  const [amount, setAmount] = useState<string>('');
  const [tokenIn, setTokenIn] = useState<Token | null>(null);
  const [tokenOut, setTokenOut] = useState<Token | null>(null);
  const [isSwapping, setIsSwapping] = useState<boolean>(false);

  const getBalance = (token: Token): bigint => {
    if (!token) return 0n;
    
    switch (token.symbol) {
      case 'fUSDCx':
        return BigInt(fUSDCBalance?.toString() ?? '0');
      case 'fDAIx':
        return BigInt(fDAIBalance?.toString() ?? '0');
      default:
        return 0n;
    }
  };

  const handleTokenInChange = (token: Token | null) => {
    setTokenIn(token);
  };

  const handleTokenOutChange = (token: Token | null) => {
    setTokenOut(token);
  };

  const handleSwap = async () => {
    if (!amount || !tokenIn || !tokenOut) {
      toast.error('Please select tokens and enter an amount');
      return;
    }

    try {
      setIsSwapping(true);
      
      // Convert amount to proper base units
      // @ts-expect-error tokenIn may be null
      const decimals = tokenIn.decimals || 18;
      const amountInBaseUnits = parseTokenAmount(amount, decimals);
      
      console.log('Trade parameters:', {
        input: amount,
        decimals,
        baseUnits: amountInBaseUnits.toString()
      });

      // Prepare swap parameters for executeTrade
      const swapParams = {
        tokenIn: '0xe72f289584eDA2bE69Cfe487f4638F09bAc920Db',  // fUSDCx address
        tokenOut: '0x9Ce2062b085A2268E8d769fFC040f6692315fd2c', // fDaix address
        amountIn: amountInBaseUnits,                            // Amount in base units
        minAmountOut: 0n,                                       // 0 for testnet
        poolFee: 3000                                          // Fixed 0.3% fee
      };

      // Log the exact parameters being sent to contract
      console.log('Executing trade with params:', {
        tokenIn: swapParams.tokenIn,
        tokenOut: swapParams.tokenOut,
        amountIn: swapParams.amountIn.toString(),
        minAmountOut: '0',
        poolFee: swapParams.poolFee
      });

      //@ts-expect-error tokenIn may be null

      const txHash = await swap(swapParams);
      toast.success(`Trade transaction submitted! Hash: ${txHash}`);
      setAmount('');
    } catch (error) {
      console.error('Trade failed:', error);
      toast.error(error instanceof Error ? error.message : 'Trade failed. Please try again.');
    } finally {
      setIsSwapping(false);
    }
  };

  return (
    <div className="bg-white/[0.02] rounded-xl p-6 backdrop-blur-sm border border-white/[0.08]">
      <h3 className="text-lg font-semibold text-white mb-6">Swap Tokens</h3>
      
      <div className="space-y-4">
        {/* Input Token */}
        <div className="space-y-2">
          <label className="text-sm text-white/60">From</label>
          <div className="flex items-center gap-2 bg-black/20 rounded-lg p-3">
            <div className="flex-1">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="w-full bg-transparent text-white outline-none"
                disabled={!tokenIn || !tokenOut}
              />
            </div>
            <div className="flex items-center gap-2">
              <TokenSelect
                value={tokenIn}
                onChange={handleTokenInChange}
                tokens={AVAILABLE_TOKENS.filter(t => t.address !== tokenOut?.address)}
              />
              {tokenIn && (
                <div className="text-xs text-white/60">
                  Balance: {formatBalance(getBalance(tokenIn))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Swap Direction Button */}
        <button
          onClick={() => {
            setTokenIn(tokenOut);
            setTokenOut(tokenIn);
          }}
          className="mx-auto block p-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <ArrowUpDown className="w-5 h-5 text-white/60" />
        </button>

        {/* Output Token */}
        <div className="space-y-2">
          <label className="text-sm text-white/60">To (estimated)</label>
          <div className="flex items-center gap-2 bg-black/20 rounded-lg p-3">
            <div className="flex-1">
              <input
                type="text"
                value={amount ? (Number(amount) * 0.98).toFixed(6) : ''}
                disabled
                placeholder="0.0"
                className="w-full bg-transparent text-white outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <TokenSelect
                value={tokenOut}
                onChange={handleTokenOutChange}
                tokens={AVAILABLE_TOKENS.filter(t => t.address !== tokenIn?.address)}
              />
              {tokenOut && (
                <div className="text-xs text-white/60">
                  Balance: {formatBalance(getBalance(tokenOut))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={isSwapping || !amount || !tokenIn || !tokenOut}
          className="w-full h-12 rounded-lg bg-fluid-primary text-white font-medium
                    disabled:opacity-50 disabled:cursor-not-allowed hover:bg-fluid-primary/90
                    transition-colors flex items-center justify-center gap-2"
        >
          {isSwapping ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full"
              />
              <span>Swapping...</span>
            </>
          ) : (
            'Swap Tokens'
          )}
        </button>
      </div>
    </div>
  );
};
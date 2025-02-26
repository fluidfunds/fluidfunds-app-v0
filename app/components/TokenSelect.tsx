import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Token } from '@/app/types/trading';

interface TokenSelectProps {
  value: Token | null;
  onChange: (token: Token | null) => void;
  tokens: readonly Token[];
}

export const TokenSelect = ({ value, onChange, tokens }: TokenSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
      >
        <span className="text-white font-medium">
          {value ? value.symbol : 'Select Token'}
        </span>
        <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-gray-900 rounded-lg border border-white/10 shadow-xl z-10">
          {tokens.map((token) => (
            <button
              key={token.address}
              type="button"
              onClick={() => {
                onChange(token);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2 text-left hover:bg-white/5 transition-colors ${
                token.address === value?.address ? 'text-fluid-primary' : 'text-white'
              }`}
            >
              {token.symbol}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
import { toast } from 'sonner';

export const formatAddress = (address: string, start = 6, end = 4) => {
  return address.slice(0, start) + '...' + address.slice(-end);
};

export const copyToClipboard = (text: string, successMessage: string = 'Copied to clipboard') => {
  navigator.clipboard.writeText(text);
  toast.success(successMessage);
};

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

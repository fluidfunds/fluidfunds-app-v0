import { useQuery } from '@tanstack/react-query';

export const useGetPnL = (address: string, currency?: string) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pnl', address, currency],
    queryFn: () => getPnL(address, currency),
  });

  const getPnL = async (address: string, currency?: string) => {
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_ZERION_BEARER_TOKEN}`,
      },
    };
    const response = await fetch(
      `https://api.zerion.io/v1/wallets/${address}/pnl/?currency=${currency || 'usd'}`,
      options
    );
    return response.json();
  };

  return { data, isLoading, error };
};

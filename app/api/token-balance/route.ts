import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getAddress } from 'viem';
import { sepolia } from 'viem/chains';

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  }
] as const;

// Create Viem client with the proper RPC URL using Alchemy key
const client = createPublicClient({
  chain: sepolia,
  transport: http(`https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`)
});

export async function GET(request: NextRequest) {
  try {
    // Get query params
    const searchParams = request.nextUrl.searchParams;
    const tokenAddress = searchParams.get('tokenAddress');
    const account = searchParams.get('account');
    
    if (!tokenAddress || !account) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing tokenAddress or account' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Format addresses
    const formattedTokenAddress = getAddress(tokenAddress);
    const formattedAccount = getAddress(account);
    
    console.log(`Fetching balance for token ${formattedTokenAddress}, account ${formattedAccount}`);
    
    // Get balance with explicit type
    try {
      const balance = await client.readContract({
        address: formattedTokenAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [formattedAccount],
      }) as bigint;
      
      console.log(`Balance for ${formattedTokenAddress}: ${balance.toString()}`);
      return NextResponse.json({ balance: balance.toString() });
    } catch (contractError) {
      console.error(`Contract error for ${formattedTokenAddress}:`, contractError);
      // Return 0 for balance instead of error for better UX
      return NextResponse.json({ balance: '0' });
    }
    
  } catch (error) {
    console.error('Error fetching token balance:', error);
    // Return 0 for balance instead of error for better UX
    return NextResponse.json({ balance: '0' });
  }
}
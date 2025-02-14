import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const response = await fetch(
      'https://api.thegraph.com/subgraphs/name/superfluid-finance/protocol-v1-base-sepolia',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      }
    )

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Subgraph proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch from subgraph' }, 
      { status: 500 }
    )
  }
}
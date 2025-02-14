import { NextResponse } from 'next/server'

const SUBGRAPH_URL = 'https://subgraph-endpoints.superfluid.dev/base-sepolia/protocol-v1'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = await fetch(SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    })

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Superfluid API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' }, 
      { status: 500 }
    )
  }
}
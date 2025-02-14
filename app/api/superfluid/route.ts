import { NextResponse } from 'next/server'

const SUPERFLUID_SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUPERFLUID_SUBGRAPH_URL!

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Querying for address:', body.variables.fund)
    
    const response = await fetch(SUPERFLUID_SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetActiveStreams($fund: String!) {
            account(id: $fund) {
              inflows(
                where: { currentFlowRate_gt: "0" }
                orderBy: currentFlowRate
                orderDirection: desc
              ) {
                id
                currentFlowRate
                streamedUntilUpdatedAt
                updatedAtTimestamp
                token {
                  id
                  symbol
                  decimals
                }
                sender {
                  id
                }
              }
            }
          }
        `,
        variables: {
          fund: body.variables.fund
        }
      })
    })

    const data = await response.json()
    console.log('Raw stream data:', JSON.stringify(data, null, 2))
    return NextResponse.json(data)
  } catch (error) {
    console.error('Superfluid API error:', error)
    return NextResponse.json({ error: 'Failed to fetch streams' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
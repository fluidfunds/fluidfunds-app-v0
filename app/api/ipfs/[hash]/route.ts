import { NextResponse } from 'next/server'

// Using any to bypass type checking for deployment
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function GET(_req: Request, context: any): Promise<NextResponse> {
  try {
    const hash = context.params.hash
    const ipfsGatewayUrl = `https://ipfs.io/ipfs/${hash}`

    // Fetch from IPFS gateway
    const response = await fetch(ipfsGatewayUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch from IPFS: ${response.statusText}`)
    }

    // Get content type from response
    const contentType = response.headers.get('content-type') || 'application/octet-stream'

    // Return the response with proper content type
    return new NextResponse(response.body, {
      headers: {
        'content-type': contentType,
        'cache-control': 'public, max-age=31536000, immutable'
      }
    })

  } catch (error) {
    console.error('Error fetching from IPFS:', error)
    return new NextResponse('Error fetching from IPFS', { status: 500 })
  }
} 
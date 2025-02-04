import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'
const PINATA_JWT = process.env.PINATA_JWT

interface RouteParams {
  params: {
    hash: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { hash } = params
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
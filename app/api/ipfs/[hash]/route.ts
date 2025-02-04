import { NextResponse } from 'next/server'
import axios from 'axios'

const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/'
const PINATA_JWT = process.env.PINATA_JWT

export async function GET(
  request: Request,
  { params }: { params: { hash: string } }
) {
  const hash = params.hash

  try {
    const pinataUrl = `${PINATA_GATEWAY}${hash}`
    const response = await axios.get(pinataUrl, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    })

    if (response.data) {
      if (response.data.image) {
        const imageHash = response.data.image.replace('ipfs://', '')
        response.data.image = `${PINATA_GATEWAY}${imageHash}`
      }
      return NextResponse.json(response.data)
    }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // Try fallback gateways silently without logging
    const FALLBACK_GATEWAYS = [
      'https://cloudflare-ipfs.com/ipfs/',
      'https://ipfs.io/ipfs/',
      'https://nftstorage.link/ipfs/'
    ]

    for (const gateway of FALLBACK_GATEWAYS) {
      try {
        const url = `${gateway}${hash}`
        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json'
          }
        })

        if (response.data) {
          // Transform image URLs
          if (response.data.image) {
            const imageHash = response.data.image.replace('ipfs://', '')
            response.data.image = `${PINATA_GATEWAY}${imageHash}`
          }
          return NextResponse.json(response.data)
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        continue
      }
    }
  }

  return NextResponse.json({
    name: 'Untitled Fund',
    description: 'Fund details temporarily unavailable',
    image: '',
    manager: '',
    strategy: '',
    socialLinks: {},
    performanceMetrics: {
      tvl: '0',
      returns: '0',
      investors: 0
    },
    updatedAt: Date.now()
  }, { status: 200 })
} 
import { NextResponse } from 'next/server'
import axios from 'axios'

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT
const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'

export async function POST(request: Request) {
  if (!PINATA_JWT) {
    console.error('NEXT_PUBLIC_PINATA_JWT not found')
    return NextResponse.json(
      { error: 'Pinata configuration missing' },
      { status: 500 }
    )
  }

  try {
    // Get metadata from request body
    const metadata = await request.json()

    console.log('Uploading metadata to Pinata:', metadata)

    // Upload JSON to Pinata
    const response = await axios.post(PINATA_API_URL, metadata, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    })

    console.log('Pinata response:', response.data)

    return NextResponse.json({
      hash: response.data.IpfsHash,
      url: `ipfs://${response.data.IpfsHash}`
    })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error uploading metadata:', {
      message: error.message,
      response: error.response?.data
    })
    return NextResponse.json(
      { error: 'Failed to upload metadata', details: error.message },
      { status: 500 }
    )
  }
}

// Handle OPTIONS requests for CORS
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function OPTIONS(request: Request) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
} 
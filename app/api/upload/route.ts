import { NextResponse } from 'next/server'
import FormData from 'form-data'
import axios from 'axios'

const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT
const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS'

export async function POST(request: Request) {
  if (!PINATA_JWT) {
    console.error('NEXT_PUBLIC_PINATA_JWT not found')
    return NextResponse.json(
      { error: 'Pinata configuration missing' },
      { status: 500 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer())
    
    // Create form data for Pinata
    const pinataFormData = new FormData()
    pinataFormData.append('file', buffer, {
      filename: file.name,
      contentType: file.type,
    })

    console.log('Uploading to Pinata...', {
      filename: file.name,
      size: buffer.length
    })

    // Upload to Pinata
    const response = await axios.post(PINATA_API_URL, pinataFormData, {
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        ...pinataFormData.getHeaders()
      },
      maxBodyLength: Infinity
    })

    console.log('Pinata response:', response.data)

    return NextResponse.json({
      hash: response.data.IpfsHash,
      url: `ipfs://${response.data.IpfsHash}`
    })

  } catch (error: any) {
    console.error('Error uploading to IPFS:', {
      message: error.message,
      response: error.response?.data
    })
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    )
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: Request) {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
} 
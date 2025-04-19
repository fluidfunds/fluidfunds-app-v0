import { NextResponse } from 'next/server';
import { logger } from '@/app/utils/logger';
import { SUPERFLUID_QUERY_URL } from '@/app/config/superfluid';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    logger.log('API request body:', body);
    const response = await fetch(SUPERFLUID_QUERY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: body.query,
        variables: body.variables,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Subgraph fetch failed:', response.status, errorText);
      return NextResponse.json(
        { error: `Subgraph fetch failed: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    if (data.errors) {
      logger.error('Subgraph errors:', data.errors);
      return NextResponse.json({ error: data.errors[0].message }, { status: 400 });
    }
    logger.log('Subgraph response:', data);
    return NextResponse.json(data);
  } catch (error) {
    logger.error('Failed to fetch streams from subgraph:', error);
    return NextResponse.json({ error: 'Failed to fetch streams' }, { status: 500 });
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
  });
}

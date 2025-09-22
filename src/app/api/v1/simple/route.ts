import { NextRequest, NextResponse } from 'next/server';

// GET /api/v1/simple - Direct test endpoint without middleware
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('Authorization');

  return NextResponse.json({
    success: true,
    message: 'Direct endpoint works!',
    hasAuth: !!authHeader,
    authHeader: authHeader ? authHeader.substring(0, 30) + '...' : null,
    timestamp: new Date().toISOString(),
  });
}
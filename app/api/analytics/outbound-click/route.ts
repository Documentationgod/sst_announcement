import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit, generalLimiterOptions } from '@/lib/middleware/rateLimit';
import { getDb } from '@/lib/config/db';
import { outboundClickTracking } from '@/lib/schema';

export async function POST(request: NextRequest) {
  try {
    await applyRateLimit(request, generalLimiterOptions);

    const { url, referrer } = await request.json();

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    // Extract domain from URL
    let domain: string;
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Get user info (may be null for anonymous users)
    let user = null;
    try {
      const { requireAuth } = await import('@/lib/middleware/auth');
      user = await requireAuth(request, { enforceDomain: false });
    } catch (authError) {
      // User is not authenticated, continue with null user
      console.log('Anonymous user tracking outbound click to:', domain);
    }

    const db = getDb();

    // Track the outbound click
    await db.insert(outboundClickTracking).values({
      userId: user?.id || null,
      url,
      domain,
      referrer: referrer || null,
      userAgent: request.headers.get('user-agent') || null,
    });

    return NextResponse.json({
      success: true,
      message: 'Outbound click tracked successfully'
    });

  } catch (error: any) {
    console.error('Error tracking outbound click:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: error.status || 500 }
    );
  }
}
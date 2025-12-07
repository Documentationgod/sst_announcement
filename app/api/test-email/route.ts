import { NextRequest, NextResponse } from 'next/server';
import { sendAnnouncementEmail } from '@/lib/services/email';
import { requireAuth, requireAdmin } from '@/lib/middleware/auth';

export async function POST(request: NextRequest) {
  try {
    // Require admin access for testing
    const user = await requireAuth(request);
    requireAdmin(user);

    const body = await request.json();
    const { testEmail } = body;

    if (!testEmail) {
      return NextResponse.json(
        { success: false, error: 'testEmail is required' },
        { status: 400 }
      );
    }

    const result = await sendAnnouncementEmail({
      title: 'Test Email - SST Announcement System',
      description: 'This is a test email to verify that your Resend configuration is working properly. If you receive this email, everything is set up correctly!',
      category: 'college',
      recipientEmails: ['mohammed.24bcs10278@sst.scaler.com'],
      expiryDate: null,
      scheduledAt: null,
    });

    return NextResponse.json({
      success: true,
      data: {
        emailSent: result.success,
        message: result.message || result.error,
        testEmail,
      },
    });

  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send test email',
      },
      { status: error.status || 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Test email endpoint is available. Use POST with { "testEmail": "your@email.com" }',
  });
}

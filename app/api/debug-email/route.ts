import { NextRequest, NextResponse } from 'next/server';
import { getEnvConfig } from '@/lib/config/env';

export async function GET(request: NextRequest) {
  try {
    const env = getEnvConfig();
    
    const emailConfig = {
      hasResendApiKey: !!env.RESEND_API_KEY,
      resendApiKeyLength: env.RESEND_API_KEY ? env.RESEND_API_KEY.length : 0,
      resendApiKeyPrefix: env.RESEND_API_KEY ? env.RESEND_API_KEY.substring(0, 3) : 'none',
      fromEmail: env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      hardcodedRecipient: 'mohammed.24bcs10278@sst.scaler.com'
    };

    return NextResponse.json({
      success: true,
      message: 'Email configuration debug info',
      config: emailConfig,
      issues: [
        !env.RESEND_API_KEY && 'RESEND_API_KEY is missing from environment variables',
        env.RESEND_API_KEY && !env.RESEND_API_KEY.startsWith('re_') && 'RESEND_API_KEY should start with "re_"'
      ].filter(Boolean)
    });

  } catch (error: any) {
    console.error('Debug email error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to check email configuration',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sendAnnouncementEmail } = await import('@/lib/services/email');
    
    const result = await sendAnnouncementEmail({
      title: 'Debug Test Email',
      description: 'This is a debug test email to verify email functionality is working with the hardcoded recipient.',
      category: 'college',
      recipientEmails: ['mohammed.24bcs10278@sst.scaler.com'],
      expiryDate: null,
      scheduledAt: null,
    });

    return NextResponse.json({
      success: true,
      emailResult: result,
      message: result.success 
        ? 'Test email sent successfully to mohammed.24bcs10278@sst.scaler.com' 
        : 'Failed to send test email'
    });

  } catch (error: any) {
    console.error('Debug email send error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send debug email',
      },
      { status: 500 }
    );
  }
}

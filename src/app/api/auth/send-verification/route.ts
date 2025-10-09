import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, verificationCode, name }: { email: string; verificationCode: string; name: string } = await request.json();

    // In production, replace this with your actual email service
    // For demo purposes, we'll just log the verification code
    console.log(`Verification code for ${name} (${email}): ${verificationCode}`);

    // Here you would integrate with your email service:
    // - SendGrid: https://sendgrid.com/
    // - Mailgun: https://www.mailgun.com/
    // - Firebase Functions with Nodemailer
    // - etc.

    // Example with console logging (for development only):
    console.log(`
      📧 VERIFICATION EMAIL SENT

      To: ${name} <${email}>
      Subject: Verify your JapanHaul account

      Hi ${name},

      Your verification code is: ${verificationCode}

      Enter this code to complete your registration.

      Best regards,
      JapanHaul Team
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send verification email' },
      { status: 500 }
    );
  }
}

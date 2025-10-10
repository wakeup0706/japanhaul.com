import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, verificationCode, name }: { email: string; verificationCode: string; name: string } = await request.json();

    // Use Resend to send OTP emails (simple setup, no Firebase CLI needed)
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'JapanHaul <noreply@japanihaul.firebaseapp.com>',
        to: [email],
        subject: 'Verify your JapanHaul account',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to JapanHaul!</h2>
            <p>Hi ${name},</p>
            <p>Your verification code is:</p>
            <div style="background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #333; letter-spacing: 3px; font-size: 32px;">${verificationCode}</h1>
            </div>
            <p>Enter this code to complete your registration.</p>
            <p><strong>This code expires in 10 minutes.</strong></p>
            <p>Best regards,<br>JapanHaul Team</p>
          </div>
        `
      })
    });

    if (resendResponse.ok) {
      console.log(`✅ OTP verification email sent to ${email}`);
      return NextResponse.json({ success: true });
    } else {
      console.error('Resend API error:', await resendResponse.text());
      return NextResponse.json(
        { success: false, error: 'Failed to send OTP email' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Failed to send OTP email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send OTP email' },
      { status: 500 }
    );
  }
}

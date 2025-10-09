// Email service for sending verification codes
// Note: In production, use a proper email service like SendGrid, Mailgun, or Firebase Functions

export interface EmailVerificationData {
  email: string;
  verificationCode: string;
  name: string;
}

export async function sendVerificationEmail(data: EmailVerificationData): Promise<boolean> {
  try {
    // For demo purposes, we'll use a simple approach
    // In production, replace this with your email service

    const response = await fetch('/api/auth/send-verification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return false;
  }
}

// Generate a 6-digit verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

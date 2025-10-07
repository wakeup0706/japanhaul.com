import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email') || '';
  // Redirect to Auth0 universal password reset page. Auth0 must be configured to allow password reset.
  // This will show a form that sends a secret reset link to the provided email.
  const domain = process.env.AUTH0_ISSUER_BASE_URL || '';
  const clientId = process.env.AUTH0_CLIENT_ID || '';
  const url = `${domain}/lo/reset?client_id=${encodeURIComponent(clientId)}&email=${encodeURIComponent(email)}`;
  return NextResponse.redirect(url);
}



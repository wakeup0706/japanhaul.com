import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Check if Stripe secret key is available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY not found. Payment processing will be disabled.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2024-10-28.acacia',
}) : null;

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing not configured. Please add STRIPE_SECRET_KEY to environment variables.' },
        { status: 503 }
      );
    }

    const { amount, currency = 'usd', metadata = {} } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency,
      metadata: metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}

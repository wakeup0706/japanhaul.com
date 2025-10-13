import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Check if Stripe credentials are available
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Only initialize Stripe if credentials are available
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-09-30.clover',
}) : null;

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is properly configured
    if (!stripe || !endpointSecret) {
      console.warn('Stripe webhook not configured - missing credentials');
      return NextResponse.json({ error: 'Stripe webhook not configured' }, { status: 503 });
    }

    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);

        // Here you could:
        // - Update order status in database
        // - Send confirmation email
        // - Trigger fulfillment process

        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', failedPayment.id);

        // Here you could:
        // - Update order status to failed
        // - Send failure notification

        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

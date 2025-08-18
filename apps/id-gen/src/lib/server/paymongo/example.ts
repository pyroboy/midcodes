// Example usage of PayMongo client
// This demonstrates the API structure and capabilities

import { PayMongoClient, PayMongoAPIError, type PayMongoCheckoutSessionRequest } from './client';

// This is just an example - in practice this would be called from your SvelteKit routes
export async function createExampleCheckoutSession() {
  const client = new PayMongoClient();
  
  const sessionRequest: PayMongoCheckoutSessionRequest = {
    line_items: [
      {
        currency: 'PHP',
        amount: 500, // ₱500.00 in PHP (will be converted to centavos automatically)
        name: 'Premium ID Generator License',
        quantity: 1
      }
    ],
    payment_method_types: ['gcash', 'paymaya', 'card', 'online_banking'],
    success_url: 'https://your-app.com/checkout/success',
    cancel_url: 'https://your-app.com/checkout/cancel',
    description: 'Premium ID Generator License Purchase',
    send_email_receipt: true,
    metadata: {
      user_id: '12345',
      subscription_type: 'premium'
    }
  };

  try {
    // Create checkout session
    const session = await client.createCheckoutSession(sessionRequest);
    
    // Returns { id: 'cs_...', checkout_url: 'https://checkout.paymongo.com/...' }
    console.log('Created checkout session:', session.id);
    console.log('Redirect user to:', session.checkout_url);
    
    // Later, retrieve session details
    const sessionDetails = await client.retrieveCheckoutSession(session.id);
    console.log('Session status:', sessionDetails.status);
    
    return session;
  } catch (error) {
    if (error instanceof PayMongoAPIError) {
      console.error('PayMongo API Error:', error.code, error.message);
      console.error('Error details:', error.details);
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}

// Example of alternative Payment Intent flow
export async function createExamplePaymentIntent() {
  const client = new PayMongoClient();
  
  try {
    const paymentIntent = await client.createPaymentIntent({
      amount: 500, // ₱500.00
      currency: 'PHP',
      payment_method_allowed: ['gcash', 'card'],
      description: 'Alternative flow payment',
      metadata: { order_id: '67890' }
    });
    
    console.log('Created payment intent:', paymentIntent.id);
    console.log('Client key for frontend:', paymentIntent.client_key);
    
    return paymentIntent;
  } catch (error) {
    console.error('Payment intent creation failed:', error);
    throw error;
  }
}

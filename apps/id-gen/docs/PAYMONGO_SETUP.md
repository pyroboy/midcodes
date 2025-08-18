# PayMongo Environment Setup Guide

This guide explains how to configure PayMongo environment variables for both local development and Vercel deployment.

## Overview

PayMongo integration requires several environment variables that must be configured correctly to ensure security:

- **Server-only secrets**: Never exposed to the client (secret key, webhook secret)
- **Public variables**: Safe for client-side use (public key, app URL)
- **Configuration paths**: Redirect URLs for checkout success/cancel

## Environment Variables Required

### Server-Only Variables (Secret)

```bash
PAYMONGO_SECRET_KEY=sk_test_...           # Test: sk_test_xxx, Live: sk_live_xxx
PAYMONGO_WEBHOOK_SECRET=whsec_...         # Webhook signing secret
```

### Public Variables (Safe for Client)

```bash
PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_...    # Test: pk_test_xxx, Live: pk_live_xxx
PUBLIC_APP_URL=https://yourdomain.com    # Your application's base URL
```

### Configuration Paths

```bash
PAYMONGO_CHECKOUT_SUCCESS_PATH=/account/billing/success
PAYMONGO_CHECKOUT_CANCEL_PATH=/pricing?canceled=1
```

## Local Development Setup

### Step 1: Create Local Environment File

Create a `.env.local` file in your project root:

```bash
# Copy from .env.example
cp .env.example .env.local
```

### Step 2: Get PayMongo Credentials

1. Sign up at [PayMongo Dashboard](https://dashboard.paymongo.com/)
2. Go to **Developers** section
3. Copy your test credentials:
   - **Secret Key** (starts with `sk_test_`)
   - **Public Key** (starts with `pk_test_`)
4. Create a webhook endpoint and copy the **Webhook Secret** (starts with `whsec_`)

### Step 3: Configure .env.local

```bash
# PayMongo Test Credentials
PAYMONGO_SECRET_KEY=sk_test_your_actual_secret_key_here
PAYMONGO_WEBHOOK_SECRET=whsec_your_actual_webhook_secret_here

# Public Configuration
PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_your_actual_public_key_here
PUBLIC_APP_URL=http://localhost:5173

# Checkout Paths (customize as needed)
PAYMONGO_CHECKOUT_SUCCESS_PATH=/account/billing/success
PAYMONGO_CHECKOUT_CANCEL_PATH=/pricing?canceled=1
```

### Step 4: Test Configuration

Run your development server:

```bash
npm run dev
```

The application will validate environment variables on startup. Any missing or incorrectly formatted variables will show clear error messages.

## Vercel Deployment Setup

### Step 1: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables for **Production**, **Preview**, and **Development**:

#### Production Environment Variables

```bash
# Server-only (keep these secret!)
PAYMONGO_SECRET_KEY=sk_live_your_live_secret_key
PAYMONGO_WEBHOOK_SECRET=whsec_your_webhook_secret

# Public variables
PUBLIC_PAYMONGO_PUBLIC_KEY=pk_live_your_live_public_key
PUBLIC_APP_URL=https://yourdomain.com

# Configuration paths
PAYMONGO_CHECKOUT_SUCCESS_PATH=/account/billing/success
PAYMONGO_CHECKOUT_CANCEL_PATH=/pricing?canceled=1
```

#### Preview/Development Environment Variables

Use the same variables but with **test** credentials:

```bash
PAYMONGO_SECRET_KEY=sk_test_your_test_secret_key
PAYMONGO_WEBHOOK_SECRET=whsec_your_test_webhook_secret
PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_your_test_public_key
PUBLIC_APP_URL=https://your-preview-domain.vercel.app
```

### Step 2: Configure Webhook Endpoint

1. In PayMongo Dashboard, go to **Webhooks**
2. Create a new webhook endpoint:
   - **URL**: `https://yourdomain.com/api/paymongo/webhook`
   - **Events**: Select relevant events (payment_intent.succeeded, etc.)
3. Copy the generated webhook secret to your `PAYMONGO_WEBHOOK_SECRET` environment variable

### Step 3: Deploy and Test

```bash
# Deploy to Vercel
vercel --prod

# Or if using CI/CD, push to your main branch
git push origin main
```

## Environment Variable Reference

| Variable                         | Type        | Required | Description                                 |
| -------------------------------- | ----------- | -------- | ------------------------------------------- |
| `PAYMONGO_SECRET_KEY`            | Server-only | ✅       | PayMongo secret API key (sk*test*/sk*live*) |
| `PAYMONGO_WEBHOOK_SECRET`        | Server-only | ✅       | Webhook signature verification secret       |
| `PUBLIC_PAYMONGO_PUBLIC_KEY`     | Public      | ✅       | PayMongo public key (pk*test*/pk*live*)     |
| `PUBLIC_APP_URL`                 | Public      | ✅       | Base URL of your application                |
| `PAYMONGO_CHECKOUT_SUCCESS_PATH` | Server-only | ✅       | Relative path for successful payments       |
| `PAYMONGO_CHECKOUT_CANCEL_PATH`  | Server-only | ✅       | Relative path for cancelled payments        |

## Security Best Practices

### 🔒 Never Expose Secrets to Client

- Server-only variables are only accessible in server-side code
- The `assertServerContext()` function prevents accidental client-side usage
- Environment validation ensures proper variable formats

### 🛡️ Validate Environment on Startup

The application automatically validates:

- Required variables are present
- Correct key formats (sk*\*, pk*_, whsec\__)
- Proper URL formats

### 🔄 Use Different Keys for Different Environments

- **Development**: `sk_test_*` and `pk_test_*`
- **Production**: `sk_live_*` and `pk_live_*`
- **Webhooks**: Separate webhook endpoints and secrets per environment

### 🌐 Environment-Specific URLs

- **Local**: `http://localhost:5173`
- **Preview**: `https://your-app-git-branch.vercel.app`
- **Production**: `https://yourdomain.com`

## Troubleshooting

### Common Issues

1. **"PayMongo credentials not configured"**
   - Check that all required environment variables are set
   - Verify variable names match exactly (case-sensitive)

2. **"Environment validation failed"**
   - Check that secret key starts with `sk_test_` or `sk_live_`
   - Check that public key starts with `pk_test_` or `pk_live_`
   - Check that webhook secret starts with `whsec_`

3. **Webhook signature verification fails**
   - Ensure webhook secret matches exactly with PayMongo dashboard
   - Check that webhook URL is accessible from internet
   - Verify webhook endpoint is configured correctly

4. **Environment variables not updating**
   - Redeploy your Vercel application after changing environment variables
   - Clear browser cache and restart development server locally

### Testing Environment Setup

You can test your environment configuration by running:

```bash
# This will validate all environment variables
npm run dev
```

Any configuration issues will be displayed with clear error messages during startup.

## Next Steps

After setting up environment variables:

1. ✅ Configure payment methods in your PayMongo dashboard
2. ✅ Set up webhook endpoints for your application
3. ✅ Test payment flows in development environment
4. ✅ Deploy and test in production environment
5. ✅ Monitor webhook deliveries and payment transactions

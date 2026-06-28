# Sandbox Payment Setup

This project uses Stripe Checkout in sandbox/test mode behind `services/payment-gateway.js`.

## Environment

Copy `.env.example` to `.env` and set:

```env
PAYMENT_GATEWAY_MODE=sandbox
PAYMENT_GATEWAY_PUBLIC_KEY=your_sandbox_public_key_here
PAYMENT_GATEWAY_SECRET_KEY=your_sandbox_secret_key_here
PAYMENT_GATEWAY_WEBHOOK_SECRET=your_sandbox_webhook_secret_here
PAYMENT_GATEWAY_API_BASE_URL=https://api.stripe.com
SITE_URL=http://127.0.0.1:4177
WHATSAPP_NUMBER=971553271712
```

Never commit `.env`. It is ignored by `.gitignore`.

## Run

```bash
npm install
npm run dev
```

For the current local demo, open `http://127.0.0.1:4177`.

## Demo Flow

1. Add a product to cart.
2. Open `/cart`.
3. Click `Proceed to Checkout`.
4. Fill the checkout form.
5. Choose `Online Payment`.
6. Click `Pay Securely`.
7. Complete Stripe test checkout.
8. Return to `/payment/success`.
9. Confirm the order appears in `/admin/orders`.

Stripe common test card:

```text
4242 4242 4242 4242
Any future expiry
Any CVC
Any ZIP/postcode
```

## Webhook

Webhook endpoint:

```text
POST /api/payment-webhook
```

For local webhook testing, use the Stripe CLI and set `PAYMENT_GATEWAY_WEBHOOK_SECRET`.
The webhook is the preferred source of truth for paid/failed status; the success redirect also verifies the session for demo convenience.

## Live Mode

To switch later:

1. Replace test keys with live keys in production environment variables.
2. Set `PAYMENT_GATEWAY_MODE=live`.
3. Set `SITE_URL` to the production domain.
4. Configure the live webhook endpoint in Stripe.
5. Do not expose secret keys in frontend code.

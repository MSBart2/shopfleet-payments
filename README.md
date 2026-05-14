# ShopFleet Payments Service

Payment processing with mock Stripe-style API for ShopFleet.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/intents` | Create payment intent |
| POST | `/intents/:id/confirm` | Confirm payment |
| GET | `/:id` | Get payment by ID |
| GET | `/` | List payments (filter by orderId) |
| POST | `/:id/refund` | Refund payment |
| GET | `/health` | Service health check |

## Payment Flow

1. Create intent → returns `clientSecret`
2. Client confirms with card details
3. Payment transitions: `pending` → `processing` → `succeeded`/`failed`
4. Refund if needed: `succeeded` → `refunded`

## Development

```bash
npm install
npm run dev
```

Runs on port 3004 by default.

## Part of ShopFleet

This service handles payment processing for the ShopFleet microservices demo.

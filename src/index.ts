import express from 'express';
import type { Payment, PaymentIntent, PaymentStatus } from '@shopfleet/shared';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

// In-memory store
const payments = new Map<string, Payment>();

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'payments', paymentCount: payments.size });
});

// Create payment intent (mock Stripe-style)
app.post('/intents', (req, res) => {
  const { orderId, amount, currency = 'USD' } = req.body;
  
  const paymentId = `pay_${crypto.randomUUID().slice(0, 8)}`;
  const clientSecret = `pi_${crypto.randomUUID()}_secret_${crypto.randomUUID().slice(0, 8)}`;
  
  const payment: Payment = {
    id: paymentId,
    orderId,
    amount,
    currency,
    status: 'pending',
    method: 'card',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  payments.set(paymentId, payment);
  
  const intent: PaymentIntent = {
    clientSecret,
    paymentId,
    amount,
    currency,
  };
  
  res.status(201).json(intent);
});

// Confirm payment (simulate card processing)
app.post('/intents/:paymentId/confirm', async (req, res) => {
  const { paymentId } = req.params;
  const { last4 = '4242' } = req.body;
  
  const payment = payments.get(paymentId);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  
  if (payment.status !== 'pending') {
    return res.status(400).json({ error: `Cannot confirm payment in ${payment.status} status` });
  }
  
  // Simulate processing delay
  payment.status = 'processing';
  payment.updatedAt = new Date().toISOString();
  payments.set(paymentId, payment);
  
  // Simulate async confirmation (90% success rate)
  setTimeout(() => {
    const success = Math.random() > 0.1;
    payment.status = success ? 'succeeded' : 'failed';
    payment.last4 = last4;
    payment.updatedAt = new Date().toISOString();
    payments.set(paymentId, payment);
  }, 1000);
  
  res.json(payment);
});

// Get payment
app.get('/:paymentId', (req, res) => {
  const payment = payments.get(req.params.paymentId);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  res.json(payment);
});

// List payments by order
app.get('/', (req, res) => {
  const { orderId } = req.query;
  let results = Array.from(payments.values());
  if (orderId) {
    results = results.filter(p => p.orderId === orderId);
  }
  res.json({ payments: results, total: results.length });
});

// Refund payment
app.post('/:paymentId/refund', (req, res) => {
  const payment = payments.get(req.params.paymentId);
  if (!payment) {
    return res.status(404).json({ error: 'Payment not found' });
  }
  
  if (payment.status !== 'succeeded') {
    return res.status(400).json({ error: `Cannot refund payment in ${payment.status} status` });
  }
  
  payment.status = 'refunded';
  payment.updatedAt = new Date().toISOString();
  payments.set(payment.id, payment);
  
  res.json(payment);
});

app.listen(PORT, () => {
  console.log(`💳 ShopFleet Payments service running on port ${PORT}`);
});

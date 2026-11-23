import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import userRoutes from './routes/user.routes.js';
import shopRoutes from './routes/shop.routes.js';
import sttRoutes from './routes/stt.routes.js';
import orderRoutes from './routes/order.routes.js';
import productRoutes from './routes/product.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import invoiceRoutes from './routes/invoice.routes.js';
import customerRoutes from './routes/customer.routes.js';
import { paymentReceipt, stripeWebhook } from './controllers/payment.controller.js';


const app = express();

// Render (and anyone else) pings this to see that the server is up. It sits before the logger so the pings don't fill the log.
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use(morgan(':date[iso] :method :url :status :response-time ms'));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
// Stripe's webhook needs the body exactly as sent (to check the signature), so it comes BEFORE express.json()
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
app.get('/api/stripe/session/:sessionId', paymentReceipt);
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.use('/api/users', userRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/stt', sttRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/customers', customerRoutes);


const PORT = env.PORT;


async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer()
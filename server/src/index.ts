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


const app = express();

app.use(morgan(':date[iso] :method :url :status :response-time ms'));
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
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


const PORT = env.PORT;


async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer()
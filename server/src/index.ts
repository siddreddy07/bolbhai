import express from 'express';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';


const app = express();

app.get('/', (req, res) => {
  res.send('Hello, World!');
});


const PORT = env.PORT;


async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer()
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { globalLimiter } from './middlewares/rateLimiter.middleware.js';
import { prisma } from './db/index.js';

const app = express();

app.set('trust proxy', 1);
app.use(globalLimiter);
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.send('Health check passed!');
});


// import routers
import messagesRouter from './modules/messages/router.js';

// use routers
app.use('/api/v1/messages', messagesRouter);

app.use(errorMiddleware);
export default app;
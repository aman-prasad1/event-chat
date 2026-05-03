import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { prisma } from './db/index.js';

const app = express();

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
import authRouter from './modules/auth/router.js';
import messagesRouter from './modules/messages/router.js';
import { error } from 'console';

// use routers
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/messages', messagesRouter);

app.use(errorMiddleware);
export default app;
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { prisma } from './db/index.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.send('Health check passed!');
});


// import routers
import authRouter from './models/auth/router.js';
import { error } from 'console';

// use routers
app.use('/api/v1/auth', authRouter);

app.use(errorMiddleware);
export default app;
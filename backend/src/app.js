import express from 'express';
import cors from 'cors';
import { prisma } from './db/index.js';

const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/users', async (req, res) => {
  const { email, name, password } = req.body ?? {};

  if (!email || !password) {
    return res.status(400).json({
      message: 'email and password are required',
    });
  }

  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(201).json(user);
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ message: 'email already exists' });
    }

    if (error?.code === 'ECONNREFUSED') {
      return res.status(503).json({
        message: 'database is unavailable, please try again',
      });
    }

    console.error('create user failed:', {
      code: error?.code,
      message: error?.message,
    });

    return res.status(500).json({ message: 'failed to create user' });
  }
});

app.get('/health', (req, res) => {
  res.send('Health check passed!');
});


export default app;
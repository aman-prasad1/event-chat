import express from 'express';
import cors from 'cors';
import { prisma } from './db/index.js';

const app = express();

app.use(cors());
app.use(express.json());


app.get('/health', (req, res) => {
  res.send('Health check passed!');
});


export default app;
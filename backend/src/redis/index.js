import Redis from 'ioredis';

export const publishClient = new Redis(process.env.REDIS_URL);
export const subscribeClient = new Redis(process.env.REDIS_URL);
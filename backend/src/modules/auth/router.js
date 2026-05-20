import { Router } from 'express';
import { 
    register,
    login,
    refreshTokens
} from './controller.js';
import { authLimiter, registerLimiter } from '../../middlewares/rateLimiter.middleware.js';

const router = Router();

router.post('/register', registerLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh-tokens', refreshTokens);

export default router;
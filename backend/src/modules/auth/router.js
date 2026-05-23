import { Router } from 'express';
import { 
    register,
    login,
    refreshTokens,
    logout
} from './controller.js';
import { authLimiter, registerLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { authenticateAccessToken } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', registerLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh-tokens', refreshTokens);
router.post('/logout', authenticateAccessToken, logout);

export default router;
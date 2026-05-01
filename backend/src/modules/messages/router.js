import { Router } from 'express';
import { authenticateAccessToken } from '../../middlewares/auth.middleware.js';
import { createDirectConversation } from './controller.js';

const router = Router();

router.post('/conversations/direct', authenticateAccessToken, createDirectConversation);

export default router;
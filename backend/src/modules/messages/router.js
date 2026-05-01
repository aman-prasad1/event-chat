import { Router } from 'express';
import { authenticateAccessToken } from '../../middlewares/auth.middleware.js';
import { 
    createDirectConversation,
    getConverstionMessages
 } from './controller.js';

const router = Router();

router.post('/conversations/direct', authenticateAccessToken, createDirectConversation);
router.get('/conversations/:conversationId/messages', authenticateAccessToken, getConverstionMessages);

export default router;
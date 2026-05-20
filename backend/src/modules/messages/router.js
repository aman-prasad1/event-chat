import { Router } from 'express';
import { authenticateAccessToken } from '../../middlewares/auth.middleware.js';
import { upload } from '../../middlewares/multer.middleware.js';
import { messageLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { 
    createDirectConversation,
    getConverstionMessages,
    createConversationMessage,
    getRecentConversations
 } from './controller.js';

const router = Router();

router.post('/conversations/direct', authenticateAccessToken, createDirectConversation);
router.post('/', messageLimiter, authenticateAccessToken, upload.single('file'), createConversationMessage);
router.get('/conversation-messages/:conversationId', authenticateAccessToken, getConverstionMessages);
router.get('/recent-conversations', authenticateAccessToken, getRecentConversations);

export default router;
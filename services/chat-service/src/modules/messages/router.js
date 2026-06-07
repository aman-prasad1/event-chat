import { Router } from 'express';
import { authenticateAccessToken } from '../../middlewares/auth.middleware.js';
import { uploadFile } from '../../middlewares/multer.middleware.js';
import { messageLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { 
    createDirectConversation,
    getConverstionMessages,
    createConversationMessage,
    getRecentConversations,
    getFileUrl
 } from './controller.js';

const router = Router();

router.post('/conversations/direct', authenticateAccessToken, createDirectConversation);
router.post('/', messageLimiter, authenticateAccessToken, uploadFile.single('file'), createConversationMessage);
router.get('/conversation-messages/:conversationId', authenticateAccessToken, getConverstionMessages);
router.get('/recent-conversations', authenticateAccessToken, getRecentConversations);
router.get('/file-url', authenticateAccessToken, getFileUrl);


export default router;
import { Router } from 'express';
import { authenticateAccessToken } from '../../middlewares/auth.middleware.js';
import { upload } from '../../middlewares/multer.middleware.js';
import { 
    createDirectConversation,
    getConverstionMessages,
    createConversationMessage
 } from './controller.js';

const router = Router();

router.post('/conversations/direct', authenticateAccessToken, createDirectConversation);
router.post('/', authenticateAccessToken, upload.single('file'), createConversationMessage);
router.get('/:conversationId', authenticateAccessToken, getConverstionMessages);

export default router;
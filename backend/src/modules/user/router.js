import { Router } from 'express';
import { authenticateAccessToken } from '../../middlewares/auth.middleware.js'
import {
    getUserProfile,
    searchUsers
} from './controller.js';


const router = Router();

router.get('/profile', authenticateAccessToken, getUserProfile);
router.get('/search', authenticateAccessToken, searchUsers);

export default router;
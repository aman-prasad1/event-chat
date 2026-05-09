import { Router } from 'express';
import { authenticateAccessToken } from '../../middlewares/auth.middleware.js'
import {
    getUserProfile,
} from './controller.js';


const router = Router();

router.get('/profile', authenticateAccessToken, getUserProfile);

export default router;
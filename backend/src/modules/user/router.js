import { Router } from 'express';
import { authenticateAccessToken } from '../../middlewares/auth.middleware.js'
import { uploadAvatar } from '../../middlewares/multer.middleware.js';
import {
    getUserProfile,
    searchUsers,
    updateUserProfile
} from './controller.js';


const router = Router();

router
    .get('/profile', authenticateAccessToken, getUserProfile)
    .patch('/profile', authenticateAccessToken, uploadAvatar.single('avatar'), updateUserProfile)


router.get('/search', authenticateAccessToken, uploadAvatar.single('avatar'), searchUsers);

export default router;
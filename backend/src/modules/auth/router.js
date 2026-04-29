import { Router } from 'express';
import { upload } from '../../middlewares/multer.middleware.js';
import { 
    register,
    login,
    refreshTokens
} from './controller.js';

const router = Router();

router.post('/register', upload.single('avatar'), register);
router.post('/login', login);
router.post('/refresh-tokens', refreshTokens);

export default router;
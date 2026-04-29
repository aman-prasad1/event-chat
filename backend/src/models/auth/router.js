import { Router } from 'express';
import { upload } from '../../middlewares/multer.middleware.js';
import { 
    register,
    login
} from './controller.js';

const router = Router();

router.post('/register', upload.single('avatar'), register);
router.post('/login', login);


export default router;
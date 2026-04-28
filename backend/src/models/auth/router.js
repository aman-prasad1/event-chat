import { Router } from 'express';
import { upload } from '../../middlewares/multer.middleware.js';
import { register } from './controller.js';

const router = Router();

router.post('/register', upload.single('avatar'), register);

export default router;
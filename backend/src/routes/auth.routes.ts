import { Router } from 'express';
import { signUp, signIn, getProfile, updateAvatar } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.post('/signup', signUp);
router.post('/signin', signIn);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.put('/avatar', authMiddleware, updateAvatar);

export default router;
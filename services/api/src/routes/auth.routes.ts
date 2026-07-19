import { Router } from 'express';
import { authRateLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validation.js';
import { registerSchema, loginSchema } from '../utils/validators.js';
import { register, login, refreshToken, getMe } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/register', authRateLimiter, validateBody(registerSchema), register);
router.post('/login', authRateLimiter, validateBody(loginSchema), login);
router.post('/refresh', authMiddleware, refreshToken);
router.get('/me', authMiddleware, getMe);

export default router;

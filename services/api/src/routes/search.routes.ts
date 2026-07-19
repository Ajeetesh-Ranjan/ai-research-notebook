import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { searchSchema } from '../utils/validators.js';
import { search, getSuggestions } from '../controllers/search.controller.js';

const router = Router();

router.post('/', authMiddleware, validateBody(searchSchema), search);
router.get('/suggestions', authMiddleware, getSuggestions);

export default router;

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { aiRateLimiter } from '../middleware/rateLimit.js';
import { validateBody } from '../middleware/validation.js';
import { chatMessageSchema, summarySchema, searchSchema } from '../utils/validators.js';
import {
  createConversation,
  sendMessage,
  getConversation,
  listConversations,
  deleteConversation,
  generateSummary,
  semanticSearch,
} from '../controllers/ai.controller.js';

const router = Router();

router.post('/conversations', authMiddleware, createConversation);
router.get('/conversations/project/:projectId', authMiddleware, listConversations);
router.get('/conversations/:id', authMiddleware, getConversation);
router.delete('/conversations/:id', authMiddleware, deleteConversation);
router.post('/conversations/:id/messages', authMiddleware, aiRateLimiter, validateBody(chatMessageSchema), sendMessage);
router.post('/summarize', authMiddleware, aiRateLimiter, validateBody(summarySchema), generateSummary);
router.post('/search', authMiddleware, aiRateLimiter, validateBody(searchSchema), semanticSearch);

export default router;

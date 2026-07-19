import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getBoardState,
  saveBoardState,
} from '../controllers/board.controller.js';

const router = Router({ mergeParams: true });

router.get('/', authMiddleware, getBoardState);
router.post('/', authMiddleware, saveBoardState);

export default router;

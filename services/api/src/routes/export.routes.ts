import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { exportSchema } from '../utils/validators.js';
import {
  createExport,
  getExport,
  downloadExport,
} from '../controllers/export.controller.js';

const router = Router();

router.post('/', authMiddleware, validateBody(exportSchema), createExport);
router.get('/:id', authMiddleware, getExport);
router.get('/:id/download', authMiddleware, downloadExport);

export default router;

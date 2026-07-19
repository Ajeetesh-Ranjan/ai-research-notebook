import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { createAnnotationSchema, updateAnnotationSchema } from '../utils/validators.js';
import {
  listAnnotations,
  createAnnotation,
  updateAnnotation,
  deleteAnnotation,
} from '../controllers/annotation.controller.js';

const router = Router({ mergeParams: true });

router.get('/', authMiddleware, listAnnotations);
router.post('/', authMiddleware, validateBody(createAnnotationSchema), createAnnotation);
router.patch('/:id', authMiddleware, validateBody(updateAnnotationSchema), updateAnnotation);
router.delete('/:id', authMiddleware, deleteAnnotation);

export default router;

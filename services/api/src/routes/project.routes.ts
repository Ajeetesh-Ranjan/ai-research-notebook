import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { createProjectSchema, updateProjectSchema } from '../utils/validators.js';
import {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject,
} from '../controllers/project.controller.js';

const router = Router();

router.get('/', authMiddleware, listProjects);
router.post('/', authMiddleware, validateBody(createProjectSchema), createProject);
router.get('/:id', authMiddleware, getProject);
router.patch('/:id', authMiddleware, validateBody(updateProjectSchema), updateProject);
router.delete('/:id', authMiddleware, deleteProject);

export default router;

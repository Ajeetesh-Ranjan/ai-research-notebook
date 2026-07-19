import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { createNodeSchema, createEdgeSchema } from '../utils/validators.js';
import {
  listNodes,
  createNode,
  getNode,
  updateNode,
  deleteNode,
  listEdges,
  createEdge,
  deleteEdge,
} from '../controllers/graph.controller.js';

const router = Router({ mergeParams: true });

// Nodes
router.get('/nodes', authMiddleware, listNodes);
router.post('/nodes', authMiddleware, validateBody(createNodeSchema), createNode);
router.get('/nodes/:id', authMiddleware, getNode);
router.patch('/nodes/:id', authMiddleware, updateNode);
router.delete('/nodes/:id', authMiddleware, deleteNode);

// Edges
router.get('/edges', authMiddleware, listEdges);
router.post('/edges', authMiddleware, validateBody(createEdgeSchema), createEdge);
router.delete('/edges/:id', authMiddleware, deleteEdge);

export default router;

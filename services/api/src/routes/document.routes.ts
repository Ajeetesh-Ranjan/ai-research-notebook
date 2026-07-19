import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { uploadPDF } from '../middleware/upload.js';
import {
  uploadDocument,
  listDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
  getDocumentContent,
} from '../controllers/document.controller.js';

const router = Router({ mergeParams: true });

router.post('/', authMiddleware, uploadPDF, uploadDocument);
router.get('/', authMiddleware, listDocuments);
router.get('/:id', authMiddleware, getDocument);
router.patch('/:id', authMiddleware, updateDocument);
router.delete('/:id', authMiddleware, deleteDocument);
router.get('/:id/download', authMiddleware, downloadDocument);
router.get('/:id/content', authMiddleware, getDocumentContent);

export default router;

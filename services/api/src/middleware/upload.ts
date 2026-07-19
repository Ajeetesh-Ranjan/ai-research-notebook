import multer from 'multer';
import { env } from '../config/env.js';
import { ValidationError } from '../utils/errors.js';

/**
 * Memory storage for PDF uploads.
 * Files are buffered in memory then written to disk by the controller.
 */
const storage = multer.memoryStorage();

/**
 * File filter to only accept PDFs.
 */
function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new ValidationError('Only PDF files are allowed'));
  }
}

/**
 * Multer upload middleware configuration.
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: env.MAX_FILE_SIZE,
    files: 1,
  },
});

/**
 * Single PDF file upload middleware.
 */
export const uploadPDF = upload.single('file');

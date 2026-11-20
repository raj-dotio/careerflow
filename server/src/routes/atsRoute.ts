import { Router } from 'express';
import { analyzeResume, uploadAndAnalyze } from '../controllers/atsController.js';
import upload from '../middlewares/multer.js';

const router = Router();

// Text/JSON-based ATS analysis
router.post('/analyze', analyzeResume);

// File-upload based ATS analysis (PDF / DOCX / TXT)
router.post('/upload', upload.single('resume'), uploadAndAnalyze);

export default router;

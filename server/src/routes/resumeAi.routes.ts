import { Router } from 'express';
import { handleResumeAiChat, handleResumeAiParse } from '../controllers/resumeAi.controller.js';
import { optionalAuth } from '../middlewares/isAuth.js';
import upload from '../middlewares/multer.js';

const router = Router();

// POST /api/resume-ai/chat - AI Guided Resume Writer conversation endpoint
router.post('/chat', optionalAuth, handleResumeAiChat);

// POST /api/resume-ai/parse - Parse PDF/DOCX/TXT into structured resume
router.post('/parse', optionalAuth, upload.single('resume'), handleResumeAiParse);

export default router;

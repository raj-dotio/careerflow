import { Router } from 'express';
import {
  startInterview,
  submitAnswer,
  getNextQuestion,
  finishInterview,
  getInterviewReport,
  getMyInterviews,
  uploadResumeForInterview,
  generateTts,
  transcribeAnswerAudio,
} from '../controllers/interview.controller.js';
import { optionalAuth } from '../middlewares/isAuth.js';
import upload from '../middlewares/multer.js';

const router = Router();

// Upload resume file for interview personalization
router.post('/upload-resume', optionalAuth, upload.single('resume'), uploadResumeForInterview);

// Synthesize spoken interviewer audio via Gemini TTS
router.post('/tts', optionalAuth, generateTts);

// Transcribe candidate microphone audio via Gemini Multimodal STT
router.post('/transcribe', optionalAuth, transcribeAnswerAudio);

// Start interview session & generate 5 questions plan + round 1 question
router.post('/start', optionalAuth, startInterview);

// Submit candidate voice/text answer and get dynamic next question
router.post('/answer', optionalAuth, submitAnswer);

// Advance to next question (or skip)
router.post('/next', optionalAuth, getNextQuestion);

// Finish interview & compute report metrics
router.post('/finish', optionalAuth, finishInterview);
router.post('/end', optionalAuth, finishInterview);

// Get report by ID
router.get('/report/:id', optionalAuth, getInterviewReport);

// Get history of interviews
router.get('/my-interviews', optionalAuth, getMyInterviews);

export default router;

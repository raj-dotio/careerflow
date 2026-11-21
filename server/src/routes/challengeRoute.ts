import { Router } from 'express';
import {
  startChallenge,
  getChallengeSession,
  submitAnswer,
  getChallengeResults,
} from '../controllers/challengeController.js';
import upload from '../middlewares/multer.js';

const router = Router();

// Start a new challenge (supports optional resume file upload or JSON body)
router.post('/start', upload.single('resume'), startChallenge);

// Get challenge session state (for live interview and reload restoration)
router.get('/:id', getChallengeSession);

// Submit answer to the active question (Gemini processes answer and adaptively returns next question or completes)
router.post('/:id/answer', submitAnswer);

// Get final detailed evaluation results
router.get('/:id/results', getChallengeResults);

export default router;

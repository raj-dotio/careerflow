import { Router } from 'express';
import {
  getActiveRoadmap,
  createOrGenerateRoadmap,
  updateTopicProgress,
  getRoadmapRecommendations,
  refreshRoadmapRecommendations,
  resetRoadmap,
} from '../controllers/roadmapController.js';
import { optionalAuth } from '../middlewares/isAuth.js';

const router = Router();

// All roadmap routes use optionalAuth so both authenticated students and guest sessions work smoothly
router.use(optionalAuth);

// Active roadmap and stats
router.get('/', getActiveRoadmap);

// Generate / create roadmap
router.post('/generate', createOrGenerateRoadmap);

// Update single topic progress (checkbox, confidence, notes, status)
router.patch('/topics/:topicId', updateTopicProgress);

// Smart AI Recommendations
router.get('/recommendations', getRoadmapRecommendations);
router.post('/recommendations/refresh', refreshRoadmapRecommendations);

// Reset roadmap
router.post('/reset', resetRoadmap);

export default router;

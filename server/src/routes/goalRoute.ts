import { Router } from 'express';
import {
  getGoals,
  createGoal,
  updateGoal,
  deleteGoal,
  updateGoalProgress,
  getGoalStats,
} from '../controllers/goalController.js';

const router = Router();

// Routes for Goals & Streak Analytics
router.get('/', getGoals);
router.get('/stats', getGoalStats);
router.post('/', createGoal);
router.put('/:id', updateGoal);
router.delete('/:id', deleteGoal);
router.post('/:id/progress', updateGoalProgress);

export default router;

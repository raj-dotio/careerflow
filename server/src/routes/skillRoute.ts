import { Router } from 'express';
import {
  getSkills,
  getSkillStats,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
  verifySkillProof,
} from '../controllers/skillController.js';

const router = Router();

router.get('/', getSkills);
router.get('/stats', getSkillStats);
router.post('/verify-proof', verifySkillProof);
router.get('/:id', getSkillById);
router.post('/', createSkill);
router.put('/:id', updateSkill);
router.delete('/:id', deleteSkill);

export default router;

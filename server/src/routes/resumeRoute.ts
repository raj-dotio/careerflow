import { Router } from 'express';
import {
  getResumes,
  getResumeById,
  createResume,
  updateResume,
  deleteResume,
  duplicateResume,
  getSampleResume,
} from '../controllers/resumeController.js';

const router = Router();

router.get('/', getResumes);
router.get('/sample', getSampleResume);
router.get('/:id', getResumeById);
router.post('/', createResume);
router.put('/:id', updateResume);
router.delete('/:id', deleteResume);
router.post('/:id/duplicate', duplicateResume);

export default router;

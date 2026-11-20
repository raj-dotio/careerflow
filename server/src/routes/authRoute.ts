import { Router } from 'express';
import { googleAuth, logOut } from '../controllers/authController.js';
import { getCurrentUser } from '../controllers/userController.js';
import isAuth from '../middlewares/isAuth.js';

const router = Router();

// Google Authentication
router.post('/google', googleAuth);

// Logout
router.post('/logout', logOut);

// Get currently logged-in user profile
router.get('/me', isAuth, getCurrentUser);
router.get('/current-user', isAuth, getCurrentUser);

export default router;

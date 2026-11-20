import { Response } from 'express';
import { AuthRequest } from '../middlewares/isAuth.js';
import User from '../models/user.model.js';

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ message: 'User ID missing from request' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: `Failed to get Current User Error : ${error}` });
  }
};

import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

const genToken = (userId: string | Types.ObjectId): string => {
  const secret = process.env.JWT_SECRET || 'careerflow_super_secret_jwt_key_2026';
  return jwt.sign({ userId: userId.toString() }, secret, {
    expiresIn: '7d',
  });
};

export default genToken;

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

export interface AuthRequest extends Request {
  userId?: string;
}

interface DecodedToken extends JwtPayload {
  userId?: string;
  id?: string;
}

const isAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : undefined);

    if (!token) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const secret = process.env.JWT_SECRET || 'careerflow_super_secret_jwt_key_2026';
    const decoded = jwt.verify(token, secret) as DecodedToken;

    req.userId = decoded.userId || decoded.id;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : undefined);

    if (token) {
      const secret = process.env.JWT_SECRET || 'careerflow_super_secret_jwt_key_2026';
      const decoded = jwt.verify(token, secret) as DecodedToken;
      req.userId = decoded.userId || decoded.id;
    }
  } catch {
    // Ignore invalid token for optional auth
  }
  next();
};

export default isAuth;

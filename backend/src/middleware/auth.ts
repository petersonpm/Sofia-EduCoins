import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'sofia_super_secret_key_123!';

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      parentId: decoded.parentId,
    };
    return next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido ou expirado.' });
  }
};

export const requireParent = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'PARENT') {
    return res.status(403).json({ error: 'Acesso negado. Apenas pais podem realizar esta ação.' });
  }
  return next();
};

export const requireChild = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'CHILD') {
    return res.status(403).json({ error: 'Acesso negado. Apenas crianças podem realizar esta ação.' });
  }
  return next();
};

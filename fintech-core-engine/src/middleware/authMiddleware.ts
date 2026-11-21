import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_super_segura_fintech';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Acceso no autorizado: falta el token Bearer en la cabecera Authorization.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({
      error: 'Token inválido o expirado.',
    });
  }
}
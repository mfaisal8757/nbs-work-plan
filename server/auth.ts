import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { db } from './db.js';
import { User, Role } from '../src/types.js';

// In-memory token store with 24-hour expiration
interface Session {
  userId: string;
  expiresAt: number;
}

const activeSessions = new Map<string, Session>();

export function createToken(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  activeSessions.set(token, { userId, expiresAt });
  return token;
}

export function revokeToken(token: string): void {
  activeSessions.delete(token);
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  const token = authHeader.split(' ')[1];
  const session = activeSessions.get(token);

  if (!session) {
    return res.status(401).json({ error: 'Session expired or invalid. Please sign in again.' });
  }

  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }

  const userWithSecrets = db.getUserById(session.userId);
  if (!userWithSecrets || !userWithSecrets.is_active) {
    activeSessions.delete(token);
    return res.status(401).json({ error: 'User account is inactive or not found.' });
  }

  const { password_hash, salt, ...safeUser } = userWithSecrets;
  req.user = safeUser;
  next();
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized for this operation.`
      });
    }

    next();
  };
}

export function enforceDepartmentAccess(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  // Administrator and Management Viewer have organization-wide visibility (read-only for Management)
  if (req.user.role === 'Administrator' || req.user.role === 'Management Viewer') {
    return next();
  }

  // Departmental Desk Officer MUST have an assigned department
  if (req.user.role === 'Departmental Desk Officer') {
    if (!req.user.department_id) {
      return res.status(403).json({
        error: 'Security exception: Desk Officer profile has no assigned department.'
      });
    }
  }

  next();
}

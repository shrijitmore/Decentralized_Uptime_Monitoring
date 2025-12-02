import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { jwt_public_key } from '../config.js';

export default function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' });
  }
  
  try {
    // Extract token from "Bearer <token>"
    const token = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token using Clerk's public key
    const decoded = jwt.verify(token, jwt_public_key, {
      algorithms: ['RS256'], // Clerk uses RS256 algorithm
    }) as jwt.JwtPayload;

    // Extract user ID from the token payload
    // Clerk JWT tokens have 'sub' field containing the user ID
    const userId = decoded.sub;
    
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found in token' });
    }
    
    // Set userId on request object for use in route handlers
    (req as any).userId = userId;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error instanceof jwt.NotBeforeError) {
      return res.status(401).json({ error: 'Token not active yet' });
    }
    
    console.error('JWT verification error:', error);
    return res.status(401).json({ error: 'Token verification failed' });
  }
}

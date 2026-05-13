import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = '7d';

if (!SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

interface JWTPayload {
  userId: string;
  email: string;
}

export const signToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
};

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, SECRET) as JWTPayload;
};

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JwtPayload } from '@cloudcart/shared';
import { env } from '../config/env';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
}

class TokenService {
  // ─── Generate tokens ────────────────────────────────────────────────────

  generateAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES as jwt.SignOptions['expiresIn'],
    });
  }

  generateRefreshToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES as jwt.SignOptions['expiresIn'],
    });
  }

  generateTokenPair(payload: Omit<JwtPayload, 'iat' | 'exp'>): TokenPair {
    return {
      accessToken:  this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  // ─── Verify tokens ───────────────────────────────────────────────────────

  verifyAccessToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('ACCESS_TOKEN_EXPIRED');
      }
      throw new Error('ACCESS_TOKEN_INVALID');
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('REFRESH_TOKEN_EXPIRED');
      }
      throw new Error('REFRESH_TOKEN_INVALID');
    }
  }

  // ─── Hash / compare ──────────────────────────────────────────────────────
  // We hash the refresh token before storing it in the database.
  // This means even with DB access, an attacker cannot use stolen tokens.

  async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10); // 10 rounds is enough for token hashes (they're already random)
  }

  async compareTokenHash(token: string, hash: string): Promise<boolean> {
    return bcrypt.compare(token, hash);
  }

  // ─── Cookie config ───────────────────────────────────────────────────────

  getAccessTokenCookieOptions(): CookieOptions {
    return {
      httpOnly: true,                               // not accessible via JS
      secure: false,      // HTTPS only in prod
      sameSite: 'lax',                              // CSRF protection
      maxAge:   15 * 60 * 1000,                     // 15 minutes in ms
    };
  }

  getRefreshTokenCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge:   7 * 24 * 60 * 60 * 1000,           // 7 days in ms
    };
  }

  clearCookieOptions() {
    return {
      httpOnly: true,
secure: false,
      sameSite: 'lax' as const,
      maxAge:   0,                                   // expire immediately
    };
  }
}

export const tokenService = new TokenService();

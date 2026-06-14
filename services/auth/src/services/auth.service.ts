import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User.model';
import { tokenService, TokenPair } from './token.service';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '@cloudcart/shared';
import { env } from '../config/env';

// What we return after login/register — never the raw IUser
export interface AuthResult {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  tokens: TokenPair;
}

class AuthService {

  // ─── Register ────────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<AuthResult> {
    // Check if email already exists
    const existingUser = await User.findOne({ email: dto.email });
    if (existingUser) {
      throw new ValidationError('An account with this email already exists');
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(dto.password, env.BCRYPT_ROUNDS);

    // Create the user
    const user = await User.create({
      firstName:    dto.firstName,
      lastName:     dto.lastName,
      email:        dto.email,
      passwordHash,
      role:         'customer',
    });

    // Generate tokens
    const tokens = tokenService.generateTokenPair({
      userId: user._id.toString(),
      email:  user.email,
      role:   user.role,
    });

    // Store the refresh token hash
    user.refreshTokenHash = await tokenService.hashToken(tokens.refreshToken);
    await user.save();

    return {
      user: this.sanitiseUser(user),
      tokens,
    };
  }

  // ─── Login ───────────────────────────────────────────────────────────────

  async login(dto: LoginDto): Promise<AuthResult> {
    // Fetch user WITH passwordHash (it's select: false by default)
    const user = await User.findOne({ email: dto.email }).select(
      '+passwordHash +refreshTokenHash'
    );

    // IMPORTANT: Use identical error message for "not found" and "wrong password"
    // This prevents user enumeration attacks
    const INVALID_CREDENTIALS = 'Invalid email or password';

    if (!user) {
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated');
    }

    const isPasswordValid = await user.comparePassword(dto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError(INVALID_CREDENTIALS);
    }

    // Generate fresh tokens
    const tokens = tokenService.generateTokenPair({
      userId: user._id.toString(),
      email:  user.email,
      role:   user.role,
    });

    // Rotate refresh token — store new hash, invalidate old one
    user.refreshTokenHash = await tokenService.hashToken(tokens.refreshToken);
    await user.save();

    return {
      user: this.sanitiseUser(user),
      tokens,
    };
  }

  // ─── Refresh tokens ──────────────────────────────────────────────────────

  async refreshTokens(refreshToken: string): Promise<AuthResult> {
    // Verify the JWT structure and signature first
    let payload;
    try {
      payload = tokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Load user with their stored refresh token hash
    const user = await User.findById(payload.userId).select('+refreshTokenHash');
    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedError('Session not found. Please log in again.');
    }

    // Compare incoming token against stored hash
    const isTokenValid = await tokenService.compareTokenHash(
      refreshToken,
      user.refreshTokenHash
    );
    if (!isTokenValid) {
      // Token reuse detected — could be a stolen token being replayed
      // Invalidate all sessions by clearing the stored hash
      user.refreshTokenHash = null;
      await user.save();
      throw new UnauthorizedError('Token reuse detected. Please log in again.');
    }

    // Issue a new token pair (rotation)
    const tokens = tokenService.generateTokenPair({
      userId: user._id.toString(),
      email:  user.email,
      role:   user.role,
    });

    user.refreshTokenHash = await tokenService.hashToken(tokens.refreshToken);
    await user.save();

    return {
      user: this.sanitiseUser(user),
      tokens,
    };
  }

  // ─── Logout ──────────────────────────────────────────────────────────────

  async logout(userId: string): Promise<void> {
    // Invalidate the refresh token in DB so it can't be reused
    await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
  }

  // ─── Get profile ─────────────────────────────────────────────────────────

  async getProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  // ─── Update profile ──────────────────────────────────────────────────────

  async updateProfile(
    userId: string,
    updates: { firstName?: string; lastName?: string }
  ): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    );
    if (!user) {
      throw new NotFoundError('User');
    }
    return user;
  }

  // ─── Private helpers ─────────────────────────────────────────────────────

  private sanitiseUser(user: IUser) {
    return {
      id:        user._id.toString(),
      firstName: user.firstName,
      lastName:  user.lastName,
      email:     user.email,
      role:      user.role,
    };
  }
}

export const authService = new AuthService();

import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { tokenService } from '../services/token.service';
import { successResponse, UnauthorizedError } from '@cloudcart/shared';

class AuthController {

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user, tokens } = await authService.register(req.body);

      // Set tokens as httpOnly cookies
      res.cookie('accessToken',  tokens.accessToken,  tokenService.getAccessTokenCookieOptions());
      res.cookie('refreshToken', tokens.refreshToken, tokenService.getRefreshTokenCookieOptions());

      res.status(201).json(
        successResponse('Account created successfully', { user })
      );
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user, tokens } = await authService.login(req.body);

      res.cookie('accessToken',  tokens.accessToken,  tokenService.getAccessTokenCookieOptions());
      res.cookie('refreshToken', tokens.refreshToken, tokenService.getRefreshTokenCookieOptions());

      res.status(200).json(
        successResponse('Logged in successfully', { user })
      );
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token not found');
      }

      const { user, tokens } = await authService.refreshTokens(refreshToken);

      res.cookie('accessToken',  tokens.accessToken,  tokenService.getAccessTokenCookieOptions());
      res.cookie('refreshToken', tokens.refreshToken, tokenService.getRefreshTokenCookieOptions());

      res.status(200).json(
        successResponse('Token refreshed successfully', { user })
      );
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // req.user is set by the authenticate middleware
      await authService.logout(req.user!.userId);

      // Clear both cookies
      res.clearCookie('accessToken',  tokenService.clearCookieOptions());
      res.clearCookie('refreshToken', tokenService.clearCookieOptions());

      res.status(200).json(successResponse('Logged out successfully', null));
    } catch (error) {
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.getProfile(req.user!.userId);
      res.status(200).json(successResponse('Profile retrieved', { user }));
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await authService.updateProfile(req.user!.userId, req.body);
      res.status(200).json(successResponse('Profile updated', { user }));
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();

import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { authRateLimiter } from '../config/rateLimiter';
import { registerDto, loginDto, updateProfileDto } from '../dto/auth.dto';

export const authRouter = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password]
 *             properties:
 *               firstName: { type: string, example: "John" }
 *               lastName:  { type: string, example: "Doe" }
 *               email:     { type: string, format: email, example: "john@example.com" }
 *               password:  { type: string, minLength: 8, example: "SecurePass1" }
 *     responses:
 *       201:
 *         description: Account created successfully
 *       422:
 *         description: Validation error
 *       409:
 *         description: Email already in use
 */
authRouter.post(
  '/register',
  authRateLimiter,
  validate(registerDto),
  authController.register
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Logged in successfully
 *       401:
 *         description: Invalid credentials
 */
authRouter.post(
  '/login',
  authRateLimiter,
  validate(loginDto),
  authController.login
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh the access token using the refresh token cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
authRouter.post('/refresh', authController.refresh);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout — invalidates session and clears cookies
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
authRouter.post('/logout', authenticate, authController.logout);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Profile data
 *       401:
 *         description: Not authenticated
 */
authRouter.get('/profile', authenticate, authController.getProfile);

/**
 * @swagger
 * /api/auth/profile:
 *   patch:
 *     summary: Update the authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 */
authRouter.patch(
  '/profile',
  authenticate,
  validate(updateProfileDto),
  authController.updateProfile
);

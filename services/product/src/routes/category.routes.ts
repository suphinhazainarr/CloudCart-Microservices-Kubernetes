import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createCategoryDto, updateCategoryDto } from '../dto/product.dto';

export const categoryRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           description: Mongoose ObjectId (readonly)
 *           example: 60d21b4667d0d8992e610c80
 *         name:
 *           type: string
 *           maxLength: 100
 *           example: "Electronics"
 *         slug:
 *           type: string
 *           description: Automatically generated from name (readonly)
 *           example: "electronics"
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: "Gadgets, devices, and consumer electronics"
 *         image:
 *           type: string
 *           format: url
 *           example: "https://picsum.photos/seed/electronics/600/600"
 *         isActive:
 *           type: boolean
 *           default: true
 *         productCount:
 *           type: integer
 *           default: 0
 *           example: 15
 */

/**
 * @swagger
 * /../categories:
 *   get:
 *     summary: Get all categories
 *     description: Retrieve all active categories.
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully.
 */
categoryRouter.get('/', categoryController.getAll);

/**
 * @swagger
 * /../categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     description: Retrieve a category by its MongoDB ID.
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Category MongoDB ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details retrieved successfully.
 *       404:
 *         description: Category not found.
 */
categoryRouter.get('/:id([0-9a-fA-F]{24})', categoryController.getById);

/**
 * @swagger
 * /../categories:
 *   post:
 *     summary: Create category
 *     description: Create a new category. Accessible by Admin only.
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 */
categoryRouter.post('/', authenticate, authorize('admin'), validate(createCategoryDto), categoryController.create);

/**
 * @swagger
 * /../categories/{id}:
 *   put:
 *     summary: Update category
 *     description: Update an existing category. Accessible by Admin only.
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Category MongoDB ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Category not found.
 */
categoryRouter.put('/:id([0-9a-fA-F]{24})', authenticate, authorize('admin'), validate(updateCategoryDto), categoryController.update);

/**
 * @swagger
 * /../categories/{id}:
 *   delete:
 *     summary: Delete category
 *     description: Delete a category. Accessible by Admin only.
 *     tags: [Categories]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Category MongoDB ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Category not found.
 */
categoryRouter.delete('/:id([0-9a-fA-F]{24})', authenticate, authorize('admin'), categoryController.delete);

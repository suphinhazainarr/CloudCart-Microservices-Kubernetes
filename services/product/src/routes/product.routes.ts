import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createProductDto, updateProductDto, updateStockDto } from '../dto/product.dto';

export const productRouter = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - price
 *         - category
 *         - sku
 *       properties:
 *         id:
 *           type: string
 *           description: Mongoose ObjectId (readonly)
 *           example: 60d21b4667d0d8992e610c85
 *         name:
 *           type: string
 *           maxLength: 200
 *           example: "Apple iPhone 17"
 *         slug:
 *           type: string
 *           description: Automatically generated from name (readonly)
 *           example: "apple-iphone-17"
 *         description:
 *           type: string
 *           maxLength: 5000
 *           example: "The upcoming state of the art iPhone model."
 *         price:
 *           type: number
 *           minimum: 0
 *           example: 1099.99
 *         compareAtPrice:
 *           type: number
 *           minimum: 0
 *           example: 1199.99
 *         imageUrl:
 *           type: string
 *           format: url
 *           example: "https://picsum.photos/seed/iphone17/600/600"
 *         images:
 *           type: array
 *           items:
 *             type: string
 *             format: url
 *           example: ["https://picsum.photos/seed/iphone17/600/600"]
 *         thumbnail:
 *           type: string
 *           format: url
 *           example: "https://picsum.photos/seed/iphone17/200/200"
 *         category:
 *           type: string
 *           description: ObjectId of the Category
 *           example: 60d21b4667d0d8992e610c80
 *         brand:
 *           type: string
 *           maxLength: 100
 *           example: "Apple"
 *         sku:
 *           type: string
 *           maxLength: 100
 *           example: "APPL-IP17-256"
 *         stock:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *           example: 50
 *         isActive:
 *           type: boolean
 *           default: true
 *         isFeatured:
 *           type: boolean
 *           default: false
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           example: ["smartphone", "apple", "ios"]
 *         attributes:
 *           type: object
 *           additionalProperties:
 *             type: string
 *           example: { "color": "titanium", "storage": "256GB" }
 *         ratings:
 *           type: object
 *           properties:
 *             average:
 *               type: number
 *               minimum: 0
 *               maximum: 5
 *               default: 0
 *             count:
 *               type: integer
 *               default: 0
 */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Retrieve products list
 *     description: Retrieve all active products with options for pagination, sorting, search, price ranges, and category filtering.
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         description: Page number for pagination
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         description: Number of items per page
 *         schema:
 *           type: integer
 *           default: 12
 *       - in: query
 *         name: sort
 *         description: Sorting criteria
 *         schema:
 *           type: string
 *           enum: [newest, price_asc, price_desc, rating, name, price, -price, createdAt, -createdAt]
 *           default: newest
 *       - in: query
 *         name: category
 *         description: Category slug or ID
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         description: Text search query
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         description: Minimum price filter
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         description: Maximum price filter
 *         schema:
 *           type: number
 *       - in: query
 *         name: inStock
 *         description: Filter only in-stock products
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: featured
 *         description: Filter only featured products
 *         schema:
 *           type: string
 *           enum: [true, false]
 *     responses:
 *       200:
 *         description: Products list retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Products retrieved
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 */
productRouter.get('/', productController.getAll);

/**
 * @swagger
 * /featured:
 *   get:
 *     summary: Get featured products
 *     description: Retrieve a list of featured products sorted by rating.
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of featured products retrieved successfully.
 */
productRouter.get('/featured', productController.getFeatured);

/**
 * @swagger
 * /slug/{slug}:
 *   get:
 *     summary: Get product by slug
 *     description: Retrieve detailed information for a single product using its unique slug.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         description: Product unique slug
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details retrieved successfully.
 *       404:
 *         description: Product not found.
 */
productRouter.get('/slug/:slug', productController.getBySlug);

/**
 * @swagger
 * /{id}:
 *   get:
 *     summary: Get product by ID
 *     description: Retrieve detailed information for a single product using its unique MongoDB ID.
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Product MongoDB ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details retrieved successfully.
 *       404:
 *         description: Product not found.
 */
productRouter.get('/:id([0-9a-fA-F]{24})', productController.getById);

/**
 * @swagger
 * /:
 *   post:
 *     summary: Create product
 *     description: Create a new product. Accessible by Admin only.
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created successfully.
 *       400:
 *         description: Validation or business logic error.
 *       401:
 *         description: Unauthorized.
 */
productRouter.post('/', authenticate, authorize('admin'), validate(createProductDto), productController.create);

/**
 * @swagger
 * /{id}:
 *   put:
 *     summary: Update product
 *     description: Update an existing product. Accessible by Admin only.
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Product MongoDB ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated successfully.
 *       400:
 *         description: Validation or business logic error.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Product not found.
 */
productRouter.put('/:id([0-9a-fA-F]{24})', authenticate, authorize('admin'), validate(updateProductDto), productController.update);

/**
 * @swagger
 * /{id}:
 *   delete:
 *     summary: Delete product (soft delete)
 *     description: Perform a soft delete by setting isActive to false. Accessible by Admin only.
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Product MongoDB ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Product not found.
 */
productRouter.delete('/:id([0-9a-fA-F]{24})', authenticate, authorize('admin'), productController.delete);

/**
 * @swagger
 * /{id}/stock:
 *   patch:
 *     summary: Decrement stock
 *     description: Decrement the stock of a product by a specified quantity. Internal or checkout flow endpoint.
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Product MongoDB ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *     responses:
 *       200:
 *         description: Stock decremented successfully.
 *       400:
 *         description: Validation error or insufficient stock.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Product not found.
 */
productRouter.patch(
  '/:id([0-9a-fA-F]{24})/stock',
  authenticate,
  authorize('admin', 'customer'),
  validate(updateStockDto),
  productController.decrementStock
);

/**
 * @swagger
 * /{id}/stock/restore:
 *   patch:
 *     summary: Restore stock
 *     description: Increment/restore the stock of a product by a specified quantity. Internal flow endpoint.
 *     tags: [Products]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Product MongoDB ID
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 example: 2
 *     responses:
 *       200:
 *         description: Stock restored successfully.
 *       400:
 *         description: Validation error.
 *       401:
 *         description: Unauthorized.
 *       404:
 *         description: Product not found.
 */
productRouter.patch(
  '/:id([0-9a-fA-F]{24})/stock/restore',
  authenticate,
  authorize('admin', 'customer'),
  validate(updateStockDto),
  productController.restoreStock
);

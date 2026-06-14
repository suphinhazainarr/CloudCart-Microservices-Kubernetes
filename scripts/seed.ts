import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: '../services/auth/.env' });

// ── Inline model definitions (seed runs outside of any service) ───────────────

const userSchema = new mongoose.Schema({
  firstName:    String,
  lastName:     String,
  email:        { type: String, unique: true, lowercase: true },
  passwordHash: String,
  role:         { type: String, default: 'customer' },
  isActive:     { type: Boolean, default: true },
  refreshTokenHash: { type: String, default: null, select: false },
  addresses:    { type: Array, default: [] },
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  name:         { type: String, unique: true },
  slug:         { type: String, unique: true, lowercase: true },
  description:  String,
  image:        String,
  isActive:     { type: Boolean, default: true },
  productCount: { type: Number, default: 0 },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name:           String,
  slug:           { type: String, unique: true, lowercase: true },
  description:    String,
  price:          Number,
  compareAtPrice: Number,
  imageUrl:       String,
  images:         [String],
  thumbnail:      String,
  category:       { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  brand:          String,
  sku:            { type: String, unique: true, uppercase: true },
  stock:          { type: Number, default: 0 },
  isActive:       { type: Boolean, default: true },
  isFeatured:     { type: Boolean, default: false },
  tags:           [String],
  attributes:     { type: Map, of: String, default: {} },
  ratings:        { average: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
}, { timestamps: true });

const User     = mongoose.model('User',     userSchema);
const Category = mongoose.model('Category', categorySchema);
const Product  = mongoose.model('Product',  productSchema);

const slugify = (str: string) =>
  str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

// ── Seed data ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { name: 'Electronics',    description: 'Gadgets, devices, and consumer electronics' },
  { name: 'Clothing',       description: 'Fashion for men, women, and kids' },
  { name: 'Home & Kitchen', description: 'Everything for your home' },
  { name: 'Books',          description: 'Bestsellers, textbooks, and more' },
  { name: 'Sports',         description: 'Equipment and apparel for every sport' },
  { name: 'Beauty',         description: 'Skincare, makeup, and personal care' },
];

const PRODUCTS = [
  {
    name:          'iPhone 15 Pro',
    description:   'The most powerful iPhone ever with titanium design, A17 Pro chip, and a 48MP camera system that lets you shoot in 4K.',
    price:         999.99,
    compareAtPrice:1099.99,
    brand:         'Apple',
    sku:           'APPL-IP15P-128',
    stock:         45,
    isFeatured:    true,
    category:      'Electronics',
    tags:          ['smartphone', 'apple', 'ios', '5g'],
  },
  {
    name:          'Samsung Galaxy S24 Ultra',
    description:   'Flagship Android experience with S Pen, 200MP camera, and Snapdragon 8 Gen 3 processor.',
    price:         1199.99,
    compareAtPrice:1299.99,
    brand:         'Samsung',
    sku:           'SAMS-GS24U-256',
    stock:         30,
    isFeatured:    true,
    category:      'Electronics',
    tags:          ['smartphone', 'samsung', 'android'],
  },
  {
    name:          'MacBook Pro 14-inch',
    description:   'Supercharged by M3 Pro or M3 Max chip, MacBook Pro delivers game-changing performance and up to 22 hours of battery life.',
    price:         1999.99,
    compareAtPrice:2199.99,
    brand:         'Apple',
    sku:           'APPL-MBP14-M3',
    stock:         20,
    isFeatured:    true,
    category:      'Electronics',
    tags:          ['laptop', 'apple', 'macos', 'm3'],
  },
  {
    name:          'Sony WH-1000XM5',
    description:   'Industry-leading noise canceling headphones with 30-hour battery, crystal-clear call quality, and exceptional sound.',
    price:         349.99,
    compareAtPrice:399.99,
    brand:         'Sony',
    sku:           'SONY-WH1000XM5-BLK',
    stock:         60,
    isFeatured:    true,
    category:      'Electronics',
    tags:          ['headphones', 'audio', 'noise-canceling', 'wireless'],
  },
  {
    name:          'Nike Air Max 270',
    description:   'Max Air cushioning for all-day comfort. Breathable mesh upper with supportive overlays for a modern look.',
    price:         149.99,
    compareAtPrice:179.99,
    brand:         'Nike',
    sku:           'NIKE-AM270-BLK-10',
    stock:         120,
    isFeatured:    true,
    category:      'Clothing',
    tags:          ['shoes', 'nike', 'sneakers', 'running'],
  },
  {
    name:          'Levi\'s 501 Original Jeans',
    description:   'The original jean. Straight fit with button fly. Made with 100% cotton for a classic look that never goes out of style.',
    price:         69.99,
    brand:         'Levi\'s',
    sku:           'LEVI-501-BLK-32',
    stock:         200,
    category:      'Clothing',
    tags:          ['jeans', 'denim', 'levis', 'casual'],
  },
  {
    name:          'Instant Pot Duo 7-in-1',
    description:   'Pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker, and food warmer in one appliance.',
    price:         89.99,
    compareAtPrice:129.99,
    brand:         'Instant Pot',
    sku:           'INST-DUO7-6QT',
    stock:         75,
    isFeatured:    true,
    category:      'Home & Kitchen',
    tags:          ['kitchen', 'cooking', 'pressure-cooker', 'appliance'],
  },
  {
    name:          'Dyson V15 Detect Absolute',
    description:   'Laser technology reveals hidden dust. Acoustic piezo sensor counts particles to prove your floor is scientifically clean.',
    price:         749.99,
    compareAtPrice:849.99,
    brand:         'Dyson',
    sku:           'DYSO-V15-DET-GOLD',
    stock:         25,
    isFeatured:    true,
    category:      'Home & Kitchen',
    tags:          ['vacuum', 'dyson', 'cordless', 'cleaning'],
  },
  {
    name:          'Atomic Habits',
    description:   'An easy and proven way to build good habits and break bad ones. #1 New York Times bestseller by James Clear.',
    price:         18.99,
    brand:         'Avery',
    sku:           'BOOK-ATOMHAB-PB',
    stock:         500,
    category:      'Books',
    tags:          ['self-help', 'habits', 'productivity', 'bestseller'],
  },
  {
    name:          'Yoga Mat Premium',
    description:   '6mm thick, non-slip surface, alignment lines, and carrying strap. Perfect for yoga, pilates, and floor exercises.',
    price:         45.99,
    compareAtPrice:59.99,
    brand:         'Manduka',
    sku:           'MAND-YOGA-MAT-PRO',
    stock:         150,
    category:      'Sports',
    tags:          ['yoga', 'fitness', 'mat', 'exercise'],
  },
  {
    name:          'CeraVe Moisturizing Cream',
    description:   'Rich, non-greasy moisturizing cream for normal to dry skin. Developed with dermatologists, contains hyaluronic acid and ceramides.',
    price:         19.99,
    brand:         'CeraVe',
    sku:           'CERA-MOIST-CREAM-16',
    stock:         300,
    isFeatured:    false,
    category:      'Beauty',
    tags:          ['skincare', 'moisturizer', 'cerave', 'dermatologist'],
  },
  {
    name:          'AirPods Pro (2nd gen)',
    description:   'Active noise cancellation, adaptive transparency, personalised spatial audio, and up to 30 hours of battery life.',
    price:         249.99,
    compareAtPrice:279.99,
    brand:         'Apple',
    sku:           'APPL-APP2-WHT',
    stock:         80,
    isFeatured:    true,
    category:      'Electronics',
    tags:          ['earbuds', 'apple', 'wireless', 'noise-canceling'],
  },
];

// ── Main seed function ────────────────────────────────────────────────────────

async function seed() {
  const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/cloudcart';
  console.log('Connecting to MongoDB…');

  await mongoose.connect(MONGODB_URI, { dbName: 'cloudcart' });
  console.log('Connected.');

  // Clear existing data
  console.log('\nClearing existing data…');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
  ]);

  // ── Create admin user ──────────────────────────────────────────────────────
  console.log('\nCreating admin user…');
  const adminPassword = 'Admin@123';
  const passwordHash  = await bcrypt.hash(adminPassword, 12);

  await User.create({
    firstName:    'Admin',
    lastName:     'User',
    email:        'admin@cloudcart.dev',
    passwordHash,
    role:         'admin',
    isActive:     true,
  });
  console.log(`  ✓ admin@cloudcart.dev / ${adminPassword}`);

  // ── Create sample customer ─────────────────────────────────────────────────
  const customerPassword = 'Customer@123';
  const customerHash     = await bcrypt.hash(customerPassword, 12);
  await User.create({
    firstName: 'John',
    lastName:  'Doe',
    email:     'john@example.com',
    passwordHash: customerHash,
    role:      'customer',
    isActive:  true,
  });
  console.log(`  ✓ john@example.com / ${customerPassword}`);

  // ── Create categories ──────────────────────────────────────────────────────
  console.log('\nCreating categories…');
  const categoryDocs = await Category.insertMany(
    CATEGORIES.map((c) => ({ ...c, slug: slugify(c.name) }))
  );

  const categoryMap = categoryDocs.reduce<Record<string, mongoose.Types.ObjectId>>(
    (acc, cat) => { acc[cat.name] = cat._id as mongoose.Types.ObjectId; return acc; },
    {}
  );

  CATEGORIES.forEach((c) => console.log(`  ✓ ${c.name}`));

  // ── Create products ────────────────────────────────────────────────────────
  console.log('\nCreating products…');
  await Product.insertMany(
    PRODUCTS.map((p) => {
      const slug      = slugify(p.name);
      const imageUrl  = `https://picsum.photos/seed/${slug}/600/600`;
      const thumbnail = `https://picsum.photos/seed/${slug}/200/200`;
      return {
        ...p,
        slug,
        category:  categoryMap[p.category],
        imageUrl,
        images:    [imageUrl],
        thumbnail,
      };
    })
  );

  // Update productCount on each category
  for (const [catName, catId] of Object.entries(categoryMap)) {
    const count = PRODUCTS.filter((p) => p.category === catName).length;
    await Category.findByIdAndUpdate(catId, { productCount: count });
    console.log(`  ✓ ${catName}: ${count} products`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  CloudCart seed complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Users:      2 (1 admin, 1 customer)`);
  console.log(`  Categories: ${CATEGORIES.length}`);
  console.log(`  Products:   ${PRODUCTS.length}`);
  console.log('\n  Admin login:');
  console.log('  Email:    admin@cloudcart.dev');
  console.log('  Password: Admin@123');
  console.log('\n  Customer login:');
  console.log('  Email:    john@example.com');
  console.log('  Password: Customer@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

import Product from "../models/Product.js";
import { asyncHandler } from "../middleware/index.js";

// GET /api/products?search=&category=&sort=&page=&limit=
export const listProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.min(48, Math.max(1, parseInt(req.query.limit || "12", 10)));
  const skip = (page - 1) * limit;

  const filter = {};

  // Safe, escaped regex search (avoids NoSQL/regex injection — OWASP A03).
  if (req.query.search) {
    const escaped = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.name = { $regex: escaped, $options: "i" };
  }
  if (req.query.category && req.query.category !== "all") {
    filter.category = String(req.query.category);
  }

  const sortMap = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating: { rating: -1 },
  };
  const sort = sortMap[req.query.sort] || sortMap.newest;

  const [items, total, categories] = await Promise.all([
    Product.find(filter).sort(sort).skip(skip).limit(limit),
    Product.countDocuments(filter),
    Product.distinct("category"),
  ]);

  res.json({
    items,
    page,
    pages: Math.ceil(total / limit),
    total,
    categories,
  });
});

// GET /api/products/featured
export const featuredProducts = asyncHandler(async (_req, res) => {
  const items = await Product.find({ isFeatured: true }).limit(8);
  res.json(items);
});

// GET /api/products/:slug
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json(product);
});

// POST /api/products/:slug/reviews  (auth)
export const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const already = product.reviews.find(
    (r) => r.user.toString() === req.user._id.toString()
  );
  if (already) {
    res.status(409);
    throw new Error("You have already reviewed this product");
  }

  product.reviews.push({
    user: req.user._id,
    name: req.user.name,
    rating,
    comment,
  });
  product.recomputeRating();
  await product.save();
  res.status(201).json(product);
});

// ── Admin CRUD ────────────────────────────────────────────────
// POST /api/products  (admin)
export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

// PUT /api/products/:id  (admin)
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json(product);
});

// DELETE /api/products/:id  (admin)
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  res.json({ message: "Product removed" });
});

import { Router } from "express";
import {
  listProducts,
  featuredProducts,
  getProduct,
  addReview,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/index.js";
import { reviewSchema } from "../utils/validators.js";

const router = Router();

router.get("/", listProducts);
router.get("/featured", featuredProducts);
router.get("/:slug", getProduct);
router.post("/:slug/reviews", protect, validate(reviewSchema), addReview);

// Admin
router.post("/", protect, authorize("admin"), createProduct);
router.put("/:id", protect, authorize("admin"), updateProduct);
router.delete("/:id", protect, authorize("admin"), deleteProduct);

export default router;

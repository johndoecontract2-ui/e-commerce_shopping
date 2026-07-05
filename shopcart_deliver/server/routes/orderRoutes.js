import { Router } from "express";
import {
  createOrder,
  myOrders,
  getOrder,
  payOrder,
  allOrders,
  updateStatus,
} from "../controllers/orderController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/index.js";
import { orderSchema } from "../utils/validators.js";

const router = Router();

router.post("/", protect, validate(orderSchema), createOrder);
router.get("/mine", protect, myOrders);
router.get("/", protect, authorize("admin"), allOrders);
router.get("/:id", protect, getOrder);
router.put("/:id/pay", protect, payOrder);
router.put("/:id/status", protect, authorize("admin"), updateStatus);

export default router;

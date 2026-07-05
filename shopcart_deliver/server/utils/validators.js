import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
  consents: z
    .object({
      marketing: z.boolean().optional().default(false),
      analytics: z.boolean().optional().default(false),
    })
    .optional()
    .default({ marketing: false, analytics: false }),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const addressSchema = z.object({
  fullName: z.string().min(2),
  line1: z.string().min(3),
  line2: z.string().optional().default(""),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/, "Pincode must be 6 digits"),
  phone: z.string().regex(/^\d{10}$/, "Phone must be 10 digits"),
});

export const orderSchema = z.object({
  items: z
    .array(
      z.object({
        product: z.string().min(1),
        qty: z.number().int().positive(),
      })
    )
    .min(1, "Cart is empty"),
  shippingAddress: addressSchema,
  paymentMethod: z.enum(["card", "upi", "cod"]).default("cod"),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().default(""),
});

export const consentSchema = z.object({
  marketing: z.boolean(),
  analytics: z.boolean(),
});

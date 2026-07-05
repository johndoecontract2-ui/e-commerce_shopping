import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "../config/env.js";

const savedCardSchema = new mongoose.Schema(
  {
    // RBI CoFT compliant: we NEVER store the PAN. Only a token index +
    // display-safe metadata (last 4 digits, network, issuer).
    tokenIndex: { type: String, required: true },
    last4: { type: String, required: true },
    network: { type: String, required: true }, // Visa / Mastercard / RuPay
    issuer: { type: String, default: "" },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
  },
  { timestamps: true }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },

    // Account lockout (OWASP A07 mitigation)
    loginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, default: null, select: false },

    // DPDP Act: explicit, itemized consent tracking (no pre-ticked defaults)
    consents: {
      essential: { type: Boolean, default: true }, // required to transact
      marketing: { type: Boolean, default: false },
      analytics: { type: Boolean, default: false },
      consentedAt: { type: Date, default: null },
    },

    savedCards: [savedCardSchema],
    addresses: [
      {
        label: String,
        line1: String,
        line2: String,
        city: String,
        state: String,
        pincode: String,
        phone: String,
      },
    ],
  },
  { timestamps: true }
);

// Virtual: is the account currently locked?
userSchema.virtual("isLocked").get(function () {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

// Hash password when set via the `password` virtual setter.
userSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, config.bcryptRounds);
};

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

// Never leak sensitive fields in JSON responses.
userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.loginAttempts;
    delete ret.lockUntil;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model("User", userSchema);

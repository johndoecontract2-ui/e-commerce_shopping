import jwt from "jsonwebtoken";
import { config } from "../config/env.js";
import User from "../models/User.js";

/**
 * Sign a JWT and set it as an HttpOnly, Secure, SameSite cookie.
 * Storing the token in an HttpOnly cookie (never localStorage) prevents
 * XSS-based token theft — an explicit requirement from the project brief.
 */
export function issueToken(res, user) {
  const token = jwt.sign({ id: user._id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    secure: config.isProd, // HTTPS-only in production
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
}

export function clearToken(res) {
  res.clearCookie(config.cookieName);
}

/** Require a valid, authenticated user. */
export async function protect(req, res, next) {
  try {
    const token =
      req.cookies?.[config.cookieName] ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired session" });
  }
}

/** Restrict a route to one or more roles (RBAC — OWASP A01 mitigation). */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

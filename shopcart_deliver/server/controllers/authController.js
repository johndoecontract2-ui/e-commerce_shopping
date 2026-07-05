import User from "../models/User.js";
import { asyncHandler } from "../middleware/index.js";
import { issueToken, clearToken } from "../middleware/auth.js";
import { config } from "../config/env.js";

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, consents } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(409);
    throw new Error("An account with this email already exists");
  }

  const user = new User({
    name,
    email,
    consents: {
      essential: true,
      marketing: !!consents?.marketing,
      analytics: !!consents?.analytics,
      consentedAt: new Date(),
    },
  });
  await user.setPassword(password);
  await user.save();

  issueToken(res, user);
  res.status(201).json(user.toJSON());
});

// POST /api/auth/login  — with brute-force lockout (OWASP A07)
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Need the normally-hidden fields for auth logic.
  const user = await User.findOne({ email }).select(
    "+passwordHash +loginAttempts +lockUntil"
  );

  const genericFail = () => {
    res.status(401);
    throw new Error("Invalid email or password");
  };

  if (!user) return genericFail();

  if (user.isLocked) {
    const mins = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
    res.status(423);
    throw new Error(`Account locked. Try again in ${mins} minute(s).`);
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    user.loginAttempts += 1;
    if (user.loginAttempts >= config.maxLoginAttempts) {
      user.lockUntil = new Date(Date.now() + config.lockMinutes * 60000);
      user.loginAttempts = 0;
    }
    await user.save();
    return genericFail();
  }

  // Success — reset counters.
  user.loginAttempts = 0;
  user.lockUntil = null;
  await user.save();

  issueToken(res, user);
  res.json(user.toJSON());
});

// POST /api/auth/logout
export const logout = asyncHandler(async (_req, res) => {
  clearToken(res);
  res.json({ message: "Logged out" });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
  res.json(req.user.toJSON());
});

// PUT /api/auth/consent  — DPDP: withdraw/grant as easily as given
export const updateConsent = asyncHandler(async (req, res) => {
  const { marketing, analytics } = req.body;
  req.user.consents.marketing = marketing;
  req.user.consents.analytics = analytics;
  req.user.consents.consentedAt = new Date();
  await req.user.save();
  res.json(req.user.toJSON());
});

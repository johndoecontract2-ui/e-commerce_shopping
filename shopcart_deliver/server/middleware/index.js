/** Wrap async route handlers so rejected promises reach the error handler. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** 404 for unmatched routes. */
export function notFound(req, res, next) {
  res.status(404).json({ message: `Route not found: ${req.originalUrl}` });
}

/**
 * Central error handler. In production we never leak stack traces or
 * internal details (OWASP A05 — no verbose errors to end users).
 */
export function errorHandler(err, req, res, _next) {
  const status = err.statusCode || res.statusCode >= 400 ? res.statusCode : 500;
  const code = status === 200 ? 500 : status;

  if (process.env.NODE_ENV !== "test") {
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err.message);
  }

  res.status(code).json({
    message: err.message || "Server error",
    ...(process.env.NODE_ENV === "production" ? {} : { stack: err.stack }),
  });
}

/**
 * Validate req.body against a Zod schema. On failure returns 400 with the
 * first readable message. Same validation logic mirrors the frontend
 * (defense in depth — OWASP A03).
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const first = result.error.issues[0];
      return res.status(400).json({
        message: first ? `${first.path.join(".")}: ${first.message}` : "Invalid input",
      });
    }
    req.body = result.data; // use the parsed/coerced data
    next();
  };
}

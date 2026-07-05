import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";
import { config } from "./config/env.js";

async function start() {
  try {
    await connectDB();
    const app = createApp();
    app.listen(config.port, () => {
      console.log(`🚀 ShopCart API running on http://localhost:${config.port} (${config.env})`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

// Fail-safe global handlers.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

start();

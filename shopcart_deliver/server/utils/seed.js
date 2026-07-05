import { connectDB, disconnectDB } from "../config/db.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { sampleProducts, sampleUsers } from "./seedData.js";

/** Populate a database (real or in-memory) with demo data. */
export async function seedDatabase() {
  await Promise.all([
    User.deleteMany({}),
    Product.deleteMany({}),
    Order.deleteMany({}),
  ]);

  for (const u of sampleUsers) {
    const user = new User({ name: u.name, email: u.email, role: u.role });
    await user.setPassword(u.password);
    user.consents.consentedAt = new Date();
    await user.save();
  }

  await Product.insertMany(sampleProducts);

  return {
    users: await User.countDocuments(),
    products: await Product.countDocuments(),
  };
}

// Allow running directly:  npm run seed
const isDirectRun = process.argv[1] && process.argv[1].endsWith("seed.js");
if (isDirectRun) {
  (async () => {
    try {
      await connectDB();
      const counts = await seedDatabase();
      console.log(`🌱 Seeded ${counts.products} products and ${counts.users} users.`);
      console.log("   Admin:    admin@shopcart.dev / Admin@12345");
      console.log("   Customer: customer@shopcart.dev / Customer@123");
      await disconnectDB();
      process.exit(0);
    } catch (err) {
      console.error("Seed failed:", err.message);
      process.exit(1);
    }
  })();
}

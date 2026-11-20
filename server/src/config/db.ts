import { db } from "../prisma/db.js";

export async function connectDB() {
  try {
    await db.orm.public.users.first();
    console.log("PostgreSQL connected successfully");
  } catch (error) {
    console.error("PostgreSQL connection failed:", error);
    process.exit(1);
  }
}

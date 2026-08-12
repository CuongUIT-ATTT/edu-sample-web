import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

// Test chạy trên DB test riêng (.env.test). dotenv không ghi đè biến đã có
// trong shell → vẫn ưu tiên DATABASE_URL được export từ ngoài nếu cần.
dotenv.config({ path: ".env.test" });
dotenv.config({ path: ".env" });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });
export { db };

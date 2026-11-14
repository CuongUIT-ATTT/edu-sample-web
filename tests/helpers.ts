import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";

// Test chạy trên DB test riêng (.env.test). dotenv không ghi đè biến đã có
// trong shell → vẫn ưu tiên DATABASE_URL được export từ ngoài nếu cần.
dotenv.config({ path: ".env.test" });
dotenv.config({ path: ".env" });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error(
    "\n[INTEGRATION_DB_REQUIRED] Missing DATABASE_URL for integration tests! " +
    "Integration tests require a dedicated non-production PostgreSQL database.\n"
  );
} else if (
  (process.env.DATABASE_URL_main && dbUrl === process.env.DATABASE_URL_main) ||
  dbUrl.includes("ep-twilight-lake-ao9d15q6")
) {
  throw new Error(
    "SAFETY_VIOLATION: Refusing to run integration tests against production database (DATABASE_URL_main)!"
  );
}

const pool = new pg.Pool({ connectionString: dbUrl || "postgresql://localhost:5432/edu_test_placeholder" });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });
export { db };

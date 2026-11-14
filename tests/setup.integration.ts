import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });
dotenv.config({ path: ".env" });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.warn(
    "\n[INTEGRATION TEST CONFIG] Notice: DATABASE_URL not set in .env.test. " +
    "Integration tests require a dedicated non-production PostgreSQL test database.\n"
  );
}

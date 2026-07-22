/**
 * Run: npx tsx scripts/fix-cloudinary-access.ts
 *
 * Updates all existing Cloudinary documents to access_mode: public
 * so they can be accessed via CDN without authentication.
 */
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function fixAccess() {
  console.log("Listing all raw resources...");

  const result = await cloudinary.api.resources({
    resource_type: "raw",
    type: "upload",
    prefix: "eduweb_documents/",
    max_results: 100,
  });

  console.log(`Found ${result.resources.length} resources`);

  for (const resource of result.resources) {
    console.log(`\nProcessing: ${resource.public_id}`);
    console.log(`  Current access_mode: ${resource.access_mode || "undefined"}`);

    try {
      const updateResult = await cloudinary.uploader.explicit(resource.public_id, {
        type: "upload",
        resource_type: "raw",
        access_mode: "public",
      });
      console.log(`  Updated to: ${updateResult.access_mode}`);
    } catch (err: unknown) {
      const error = err as { message?: string };
      console.error(`  Error: ${error.message || err}`);
    }
  }

  console.log("\nDone! All files updated to public access.");
}

fixAccess().catch(console.error);

#!/usr/bin/env node

/**
 * Command-line script to migrate local uploads to Cloudinary
 * Run with: npm run migrate:cloudinary
 */

import { migrateLocalUploadsToCloudinary, findLocalUrlsInDatabase } from "../src/lib/migration";

async function main() {
  console.log("╔═════════════════════════════════════════════════════════╗");
  console.log("║     Cloudinary Migration Tool                           ║");
  console.log("╚═════════════════════════════════════════════════════════╝\n");

  try {
    // Check for local URLs first
    console.log("📋 Scanning database for local URLs...\n");
    const localUrls = await findLocalUrlsInDatabase();

    const totalLocal =
      localUrls.events.length +
      localUrls.certificates.length +
      localUrls.users.length;

    if (totalLocal === 0) {
      console.log("✅ No local URLs found. Your files are already on Cloudinary!");
      process.exit(0);
    }

    console.log(`\n⚠️  Found ${totalLocal} local file references:\n`);
    console.log(`   📁 Events with local posters: ${localUrls.events.length}`);
    console.log(`   📄 Certificates with local URLs: ${localUrls.certificates.length}`);
    console.log(`   👤 Users with local avatars: ${localUrls.users.length}\n`);

    console.log("📤 Starting migration to Cloudinary...\n");

    const result = await migrateLocalUploadsToCloudinary();

    console.log("\n╔═════════════════════════════════════════════════════════╗");
    console.log("║            Migration Complete                           ║");
    console.log("╚═════════════════════════════════════════════════════════╝\n");

    console.log("📊 Summary:");
    console.log(
      `   ✅ Successful: ${result.summary.successful}/${result.summary.total}`
    );
    console.log(
      `   ❌ Failed: ${result.summary.failed}/${result.summary.total}`
    );
    console.log(`   ⏭️  Skipped: ${result.summary.skipped}/${result.summary.total}\n`);

    if (result.summary.failed > 0) {
      console.log("⚠️  Failed files:\n");
      result.results
        .filter((r) => r.status === "error")
        .forEach((r) => {
          console.log(`   ❌ ${r.filename}`);
          console.log(`      ${r.message}\n`);
        });
    }

    if (result.summary.successful > 0) {
      console.log("✅ Successfully migrated files:\n");
      result.results
        .filter((r) => r.status === "success")
        .slice(0, 10)
        .forEach((r) => {
          console.log(`   ✓ ${r.filename}`);
          console.log(`     → ${r.cloudinaryUrl}\n`);
        });

      if (result.summary.successful > 10) {
        console.log(
          `   ... and ${result.summary.successful - 10} more files\n`
        );
      }
    }

    console.log("🎉 Migration process completed!\n");

    if (result.summary.successful > 0) {
      console.log("💡 Next steps:");
      console.log("   1. Verify files on Cloudinary: https://cloudinary.com");
      console.log("   2. Clean up local uploads: rm -rf public/uploads/*");
      console.log("   3. Commit changes to git");
      console.log("   4. Deploy to production\n");
    }

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();

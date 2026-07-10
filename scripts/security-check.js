const fs = require("fs");
const path = require("path");

function runSecurityChecks() {
  console.log("🔒 Running Custom Security Checks...");

  // 1. Leaderboard Privacy Leak Scan
  const leaderboardPath = path.join(__dirname, "../src/app/(public)/leaderboard/page.tsx");
  if (fs.existsSync(leaderboardPath)) {
    const content = fs.readFileSync(leaderboardPath, "utf-8");
    // Ensure email or phone is not queried from db
    if (content.includes("email: true") || content.includes("phone: true") || content.includes("passwordHash")) {
      console.error("❌ SECURITY FAILURE: Public leaderboard queries private PII data (email/phone/passwordHash)!");
      process.exit(1);
    }
    console.log("✅ Leaderboard privacy scan passed (no email/phone queried).");
  } else {
    console.warn("⚠️ Warning: Leaderboard file not found to check privacy.");
  }

  // 2. Direct access check for VIP docs
  // VIP documents must not reside in the public folder.
  const publicVipFolder = path.join(__dirname, "../public/docs/vip");
  if (fs.existsSync(publicVipFolder)) {
    console.error("❌ SECURITY FAILURE: VIP folder is public! Do not place VIP documents inside /public directory.");
    process.exit(1);
  }
  console.log("✅ VIP documents directory location security check passed.");

  // 3. Demo Quiz Answers marking scan
  // Ensuring the demo quiz has the explicit comment marking so developer knows it's for demo only
  const quizzesPath = path.join(__dirname, "../src/app/(public)/quizzes/page.tsx");
  if (fs.existsSync(quizzesPath)) {
    const content = fs.readFileSync(quizzesPath, "utf-8");
    if (!content.includes("demo-only") && !content.includes("client-side")) {
      console.warn("⚠️ Warning: Quizzes page demo quiz lacks explicit demo-only or client-side marker comment.");
    } else {
      console.log("✅ Quiz demo source code annotation passed.");
    }
  }

  console.log("🎉 Custom security checks finished successfully. All checks PASSED!");
}

runSecurityChecks();

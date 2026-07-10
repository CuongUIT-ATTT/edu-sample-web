const fs = require("fs");
const path = require("path");

function validateSitemap() {
  const sitemapPath = path.join(__dirname, "../public/sitemap.xml");
  console.log(`Checking sitemap at: ${sitemapPath}`);

  if (!fs.existsSync(sitemapPath)) {
    console.error("❌ Error: sitemap.xml does not exist!");
    process.exit(1);
  }

  const content = fs.readFileSync(sitemapPath, "utf-8");

  // Basic check to see if it starts with xml declaration and has tags
  if (!content.trim().startsWith("<?xml") || !content.includes("<urlset") || !content.includes("</urlset>")) {
    console.error("❌ Error: sitemap.xml is not a valid XML file!");
    process.exit(1);
  }

  // Ensure key routes exist in sitemap
  const essentialRoutes = [
    "https://edu-web-beta-fawn.vercel.app/",
    "/courses",
    "/quizzes",
    "/leaderboard",
    "/learning-paths",
    "/about",
    "/contact"
  ];

  for (const route of essentialRoutes) {
    if (!content.includes(route)) {
      console.error(`❌ Error: Sitemap is missing essential route: ${route}`);
      process.exit(1);
    }
  }

  console.log("✅ sitemap.xml is valid and all essential routes are mapped!");
}

validateSitemap();

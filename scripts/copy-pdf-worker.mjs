// Copy pdfjs worker vào public/ để phục vụ qua /pdf/pdf.worker.min.mjs
// (tránh lỗi MIME text/html khi worker không được phục vụ từ root public/)
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = resolve(root, "node_modules/pdfjs-dist/build/pdf.worker.min.mjs");
const destDir = resolve(root, "public/pdf");
mkdirSync(destDir, { recursive: true });
copyFileSync(src, resolve(destDir, "pdf.worker.min.mjs"));
console.log("✓ Copied pdf.worker.min.mjs → public/pdf/");

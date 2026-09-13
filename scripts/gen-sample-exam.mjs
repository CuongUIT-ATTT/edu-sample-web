import sharp from "sharp";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500">
  <rect width="100%" height="100%" fill="#ffffff"/>
  <text x="40" y="60" font-family="Arial" font-size="28" font-weight="bold" fill="#111">BÀI KIỂM TRA: TOÁN HỌC</text>
  <text x="40" y="120" font-family="Arial" font-size="22" fill="#111">Câu 1: Kết quả của 7 × 8 là bao nhiêu?</text>
  <text x="60" y="170" font-family="Arial" font-size="20" fill="#111">A. 54</text>
  <text x="60" y="210" font-family="Arial" font-size="20" fill="#111">B. 56</text>
  <text x="60" y="250" font-family="Arial" font-size="20" fill="#111">C. 64</text>
  <text x="60" y="290" font-family="Arial" font-size="20" fill="#111">D. 49</text>
  <text x="40" y="360" font-family="Arial" font-size="22" fill="#111">Câu 2: 25% của 200 bằng bao nhiêu?</text>
  <text x="60" y="410" font-family="Arial" font-size="20" fill="#111">A. 25</text>
  <text x="60" y="450" font-family="Arial" font-size="20" fill="#111">B. 50</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile("scripts/sample-exam.png");
console.log("wrote scripts/sample-exam.png");

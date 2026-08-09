/**
 * Đăng ký URL webhook PayOS (chạy MỘT LẦN sau khi deploy).
 *
 *   node scripts/register-payos-webhook.mjs
 *
 * Yêu cầu env: PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY, PAYOS_WEBHOOK_URL.
 * Nếu không muốn dùng script, có thể cấu hình thủ công trên PayOS dashboard:
 *   PayOS -> Kênh thanh toán -> Cài đặt Webhook
 */
import { PayOS } from "@payos/node";

const clientId = process.env.PAYOS_CLIENT_ID;
const apiKey = process.env.PAYOS_API_KEY;
const checksumKey = process.env.PAYOS_CHECKSUM_KEY;
const webhookUrl = process.env.PAYOS_WEBHOOK_URL;

if (!clientId || !apiKey || !checksumKey || !webhookUrl) {
  console.error(
    "Thiếu env. Cần PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY, PAYOS_WEBHOOK_URL."
  );
  process.exit(1);
}

const payos = new PayOS({ clientId, apiKey, checksumKey });

try {
  const result = await payos.webhooks.confirm(webhookUrl);
  console.log("Webhook đã đăng ký:", result.webhookUrl);
  console.log("Tên kênh:", result.name, "| STK:", result.accountNumber);
} catch (error) {
  console.error("Đăng ký webhook thất bại:", error instanceof Error ? error.message : error);
  process.exit(1);
}

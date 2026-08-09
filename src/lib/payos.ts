import { PayOS } from "@payos/node";

/**
 * Singleton PayOS client — mirror pattern của src/lib/r2.ts.
 * Constructor không validate key nên an toàn khi env trống (dev/test).
 * Mọi action/route phải gọi isPayosConfigured() trước khi dùng client.
 */
export const payos = new PayOS({
  clientId: process.env.PAYOS_CLIENT_ID || "",
  apiKey: process.env.PAYOS_API_KEY || "",
  checksumKey: process.env.PAYOS_CHECKSUM_KEY || "",
});

export function isPayosConfigured(): boolean {
  return Boolean(
    process.env.PAYOS_CLIENT_ID &&
      process.env.PAYOS_API_KEY &&
      process.env.PAYOS_CHECKSUM_KEY
  );
}

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export type Role = "ADMIN" | "TEACHER" | "STUDENT" | "PARENT";

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
  isRoot: boolean;
  [key: string]: unknown;
}

// Read lazily so importing an action during build does not require runtime secrets.
export function getJWTKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim() !== secret || new TextEncoder().encode(secret).length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 bytes without surrounding whitespace");
  }
  return new TextEncoder().encode(secret);
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getJWTKey());
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJWTKey(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.userId !== "string" || !payload.userId ||
        !["ADMIN", "TEACHER", "STUDENT", "PARENT"].includes(String(payload.role))) return null;
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Retrieves the session payload from Server Actions or Route Handlers
 */
export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

/**
 * Retrieves the session payload in Middleware from NextRequest
 */
export async function getMiddlewareSession(request: NextRequest): Promise<JWTPayload | null> {
  const token = request.cookies.get("session_token")?.value;
  if (!token) return null;
  return await verifyJWT(token);
}

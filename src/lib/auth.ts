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

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-that-needs-to-be-at-least-32-chars-long";
const key = new TextEncoder().encode(JWT_SECRET);

export async function signJWT(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(key);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
    });
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error("JWT Verification failed:", error);
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

import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect(new URL("/admission", process.env.NEXT_PUBLIC_APP_URL || "https://edu-web-beta-fawn.vercel.app"));
}

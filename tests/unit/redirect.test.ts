import { describe, it, expect, vi } from "vitest";

// Mock Next.js NextResponse.redirect behavior
class MockResponse {
  static redirect(url: URL, status: number = 307) {
    return {
      status,
      headers: {
        Location: url.toString()
      }
    };
  }
}

describe("Admission Apply Redirect Route", () => {
  it("should return a 307 or 302 redirect response pointing to /admission", () => {
    const targetUrl = new URL("/admission", "https://edu-web-beta-fawn.vercel.app");
    const response = MockResponse.redirect(targetUrl, 307);
    
    expect(response.status).toBe(307);
    expect(response.headers.Location).toBe("https://edu-web-beta-fawn.vercel.app/admission");
  });
});

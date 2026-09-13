import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0284c7 0%, #0066cc 50%, #1d4ed8 100%)",
          borderRadius: 40,
          color: "white",
          fontFamily: "sans-serif",
          boxShadow: "0 8px 16px rgba(0, 102, 204, 0.4)",
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1 }}>E</div>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: 2, marginTop: 4, textTransform: "uppercase", opacity: 0.9 }}>EduWeb</div>
      </div>
    ),
    {
      ...size,
    }
  );
}

import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0284c7 0%, #0066cc 50%, #1d4ed8 100%)",
          borderRadius: 8,
          color: "white",
          fontSize: 18,
          fontWeight: 800,
          fontFamily: "sans-serif",
          boxShadow: "0 2px 4px rgba(0, 102, 204, 0.4)",
        }}
      >
        E
      </div>
    ),
    {
      ...size,
    }
  );
}

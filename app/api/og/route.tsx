import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || "EaseVote Ghana";
    const subtitle = searchParams.get("subtitle") || "Premier E-Voting & Ticketing Platform";
    const type = searchParams.get("type") || "";

    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            justifyContent: "space-between",
            padding: "80px",
            background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          }}
        >
          {/* Top section: Logo and Brand Name */}
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <div style={{ display: "flex", width: 80, height: 80 }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="80" height="80">
                <defs>
                  <linearGradient id="og-grad" x1="0" y1="200" x2="400" y2="200" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#f3045d"/>
                    <stop offset="1" stopColor="#a408ad"/>
                  </linearGradient>
                </defs>
                <circle fill="url(#og-grad)" cx="200" cy="200" r="200"/>
                <g fill="#fff">
                  <rect x="102.33" y="193.19" width="110.94" height="27.73"/>
                  <rect x="102.33" y="130.78" width="110.94" height="27.73"/>
                  <path d="m320.2,130.78l-72.06,124.81-6.48,11.22-4.01,6.93c-5.08,8.79-11.76,16.59-19.91,22.67-10.05,7.49-21.73,12.55-34.95,14.11-2.94.36-5.94.54-8.98.54-34.87,0-64.06-23.71-71.49-55.47h30.64c6.49,15.77,22.34,26.9,40.85,26.9,14.08,0,26.61-6.44,34.67-16.46h0c2.03-2.52,4.98-8.22,6.09-10.43.32-.65.67-1.29,1.03-1.91l25.06-43.42,45.9-79.49h33.62Z"/>
                </g>
              </svg>
            </div>
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: "white",
                letterSpacing: "-0.05em",
              }}
            >
              EaseVote<span style={{ color: "#f3045d" }}>.gh</span>
            </div>
          </div>

          {/* Middle section: Content */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px", marginTop: "auto", marginBottom: "auto" }}>
            {type && (
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: "#f3045d",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {type}
              </div>
            )}
            <div
              style={{
                fontSize: 76,
                fontWeight: 900,
                color: "white",
                lineHeight: 1.1,
                letterSpacing: "-0.05em",
                maxWidth: "900px",
              }}
            >
              {title}
            </div>
            {subtitle && subtitle !== "undefined" && (
              <div
                style={{
                  fontSize: 36,
                  color: "#cbd5e1",
                  maxWidth: "850px",
                  lineHeight: 1.4,
                  marginTop: "10px",
                }}
              >
                {subtitle}
              </div>
            )}
          </div>

          {/* Bottom section */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              alignItems: "center",
              borderTop: "2px solid rgba(255,255,255,0.15)",
              paddingTop: "40px",
            }}
          >
            <div style={{ fontSize: 26, color: "#f8fafc", fontWeight: 600 }}>
              Secure · Transparent · Easy
            </div>
            <div style={{ fontSize: 26, color: "#94a3b8", fontWeight: 600 }}>
              easevotegh.com
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error(`OG generation failed:`, e);
    return new Response(`Failed to generate image`, { status: 500 });
  }
}

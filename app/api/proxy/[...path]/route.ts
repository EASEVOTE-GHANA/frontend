import { NextRequest, NextResponse } from "next/server";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const BACKEND_URL = (process.env.API_URL || "http://localhost:5000/api").endsWith("/api")
  ? (process.env.API_URL || "http://localhost:5000/api")
  : `${(process.env.API_URL || "http://localhost:5000/api")}/api`;

/**
 * Proxy route: /api/proxy/[...path]
 * Forwards requests from the browser (client components) to the real backend,
 * bypassing CORS since the request originates from the Next.js server.
 */
async function handler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const ip = getClientIp(req);
  const limit = rateLimit(`proxy:${ip}`, 120, 60 * 1000); // 120 req/min per IP
  if (!limit.success) {
    return NextResponse.json(
      { success: false, message: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((limit.resetAt - Date.now()) / 1000)),
        },
      },
    );
  }

  const { path } = await params;
  const pathStr = (path || []).join("/");

  // LOUD LOGGING for debugging connectivity
  console.log(`\n🚀 [Proxy] ${req.method} request received for: /${pathStr}`);
  const backendUrl = `${BACKEND_URL}/${pathStr}`;

  // Forward query params if any
  const { search } = new URL(req.url);
  const targetUrl = search ? `${backendUrl}${search}` : backendUrl;

  const headers: Record<string, string> = {};

  const contentType = req.headers.get("content-type");
  if (contentType) {
    headers["Content-Type"] = contentType;
  } else if (req.method !== "GET" && req.method !== "HEAD") {
    headers["Content-Type"] = "application/json";
  }

  // Forward Authorization header if present
  const auth = req.headers.get("Authorization") || req.headers.get("authorization");
  if (auth) headers["Authorization"] = auth;

  let body: ArrayBuffer | undefined;
  if (req.method !== "GET" && req.method !== "HEAD") {
    try {
      body = await req.arrayBuffer();
    } catch {
      body = undefined;
    }
  }

  try {
    if (process.env.NODE_ENV !== "production") {
      console.log(`[Proxy] Forwarding ${req.method} to ${targetUrl}`);
    }

    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });

    const data = await backendRes.json().catch(() => ({
      success: false,
      message: "Backend returned an unparseable response",
    }));

    if (!backendRes.ok) {
      console.error(`[Proxy] Backend returned ${backendRes.status}:`, data);
    }

    return NextResponse.json(data, { status: backendRes.status });
  } catch (err) {
    console.error(`[Proxy] Error forwarding to ${targetUrl}:`, err);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to connect to the backend. Please try again.",
      },
      { status: 502 },
    );
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};

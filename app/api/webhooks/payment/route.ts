import { NextRequest, NextResponse } from "next/server";

// Forward payment webhooks to the Express backend, which handles all business logic.
export async function POST(req: NextRequest) {
  try {
    const bodyText = await req.text();

    // Collect relevant headers to forward
    const forwardHeaders: Record<string, string> = {
      "content-type": "application/json",
    };
    req.headers.forEach((value, key) => {
      if (key.toLowerCase().startsWith("x-")) {
        forwardHeaders[key] = value;
      }
    });

    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      throw new Error("API_URL environment variable is required");
    }
    const response = await fetch(`${apiUrl}/webhooks/payment`, {
      method: "POST",
      headers: forwardHeaders,
      body: bodyText,
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

import { buildUpstreamUrl } from "./_upstream.js";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const upstreamResponse = await fetch(buildUpstreamUrl("/api/healthz"), {
      method: "GET",
    });

    const text = await upstreamResponse.text();
    res.status(upstreamResponse.status);
    res.setHeader(
      "Content-Type",
      upstreamResponse.headers.get("content-type") || "application/json"
    );
    return res.send(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Health proxy error";
    const statusCode = message.includes("Missing env") ? 500 : 502;
    return res.status(statusCode).json({ error: message });
  }
}

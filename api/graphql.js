import { buildUpstreamUrl } from "./_upstream.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const payload =
      typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});

    const upstreamResponse = await fetch(buildUpstreamUrl("/graphql"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });

    const text = await upstreamResponse.text();
    res.status(upstreamResponse.status);
    res.setHeader(
      "Content-Type",
      upstreamResponse.headers.get("content-type") || "application/json"
    );
    return res.send(text);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Proxy error";
    const statusCode = message.includes("Missing env") ? 500 : 502;
    return res.status(statusCode).json({ error: message });
  }
}

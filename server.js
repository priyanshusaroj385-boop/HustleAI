// Tiny dependency-free Node.js server for HustleAI.
// Sends prompts to Ollama running locally; no hosted AI API key is required.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b";
const ROOT = __dirname;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "X-Content-Type-Options": "nosniff" });
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > 20_000) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); } catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (req.method === "POST" && url.pathname === "/api/generate") {
    let data;
    try { data = await readBody(req); } catch (err) {
      return send(res, 400, { error: err.message });
    }
    const product = String(data.product || "").trim().slice(0, 120);
    const details = String(data.details || "").trim().slice(0, 800);
    const platform = String(data.platform || "Instagram").slice(0, 50);
    const tone = String(data.tone || "Friendly").slice(0, 40);
    const outputType = String(data.outputType || "Product listing").slice(0, 50);
    if (!product) return send(res, 400, { error: "Product or service is required." });

    const prompt = `You are HustleAI, a practical marketing copy assistant for small independent sellers.
Create a ${outputType} for the platform ${platform}.
Brand voice: ${tone}.
Product/service: ${product}
Product details supplied by the user: ${details || "No extra details provided."}

Requirements:
- Produce polished, useful, ready-to-edit content.
- Keep it appropriate for ${platform}.
- Do not invent prices, certifications, performance results, ingredients, guarantees, or other factual claims.
- If details are missing, use careful general wording and mark any placeholders clearly.
- Avoid generic hype and explain benefits in concrete, honest language.
- Return only the content, with helpful short headings where appropriate.`;

    try {
      const aiResponse = await fetch("http://127.0.0.1:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          prompt,
          stream: false,
          options: { temperature: 0.7, num_predict: 500 }
        }),
        signal: AbortSignal.timeout(120000)
      });
      if (!aiResponse.ok) {
        const text = await aiResponse.text();
        return send(res, 502, { error: `Ollama returned ${aiResponse.status}. ${text.slice(0, 250)}` });
      }
      const result = await aiResponse.json();
      if (!result.response) return send(res, 502, { error: "The model returned an empty response." });
      return send(res, 200, { text: result.response.trim(), model: result.model || MODEL });
    } catch (err) {
      const message = err.name === "TimeoutError"
        ? "The model took too long. Try again or use a smaller model."
        : "Cannot reach Ollama. Install Ollama, download the model, and make sure Ollama is running.";
      return send(res, 503, { error: message });
    }
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    return send(res, 405, { error: "Method not allowed." });
  }
  let pathname = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
  const fullPath = path.resolve(ROOT, "." + pathname);
  if (!fullPath.startsWith(ROOT + path.sep) && fullPath !== ROOT) {
    return send(res, 403, { error: "Forbidden." });
  }
  fs.readFile(fullPath, (err, data) => {
    if (err) return send(res, 404, "Not found", "text/plain; charset=utf-8");
    res.writeHead(200, { "Content-Type": MIME[path.extname(fullPath)] || "application/octet-stream", "X-Content-Type-Options": "nosniff" });
    if (req.method === "HEAD") return res.end();
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`HustleAI running at http://localhost:${PORT}`);
  console.log(`AI model: ${MODEL} (Ollama must be running locally)`);
});

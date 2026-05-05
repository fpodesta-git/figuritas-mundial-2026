export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/transcribe" && request.method === "POST") {
      return proxyTranscribe(request, env);
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      return proxyChat(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function proxyTranscribe(request, env) {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) return jsonError("GROQ_API_KEY no configurada en Cloudflare", 500);

  const formData = await request.formData();
  const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData
  });

  const data = await res.json();
  return jsonResponse(data, res.status);
}

async function proxyChat(request, env) {
  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) return jsonError("GROQ_API_KEY no configurada en Cloudflare", 500);

  const body = await request.json();
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  return jsonResponse(data, res.status);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function jsonError(message, status = 500) {
  return jsonResponse({ error: { message } }, status);
}

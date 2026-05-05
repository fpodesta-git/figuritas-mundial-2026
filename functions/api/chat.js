export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey = env.GROQ_API_KEY;
  if (!apiKey) {
    return json({ error: { message: "GROQ_API_KEY no configurada en Cloudflare" } }, 500);
  }

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
  return json(data, res.status);
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

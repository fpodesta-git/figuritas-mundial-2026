const GROQ_BASE = "https://api.groq.com/openai/v1";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }
    try {
      const res = await route(request, env);
      const headers = new Headers(res.headers);
      for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
      return new Response(res.body, { status: res.status, headers });
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  },
};

// ─── Router ───────────────────────────────────────────────────────────────────

async function route(request, env) {
  const { pathname } = new URL(request.url);
  const method = request.method;

  if (pathname === "/api/auth/login" && method === "POST") {
    return handleLogin(request, env);
  }

  // Groq proxy — sin auth (el key vive en el Worker)
  if (pathname === "/api/transcribe" && method === "POST") {
    return handleTranscribe(request, env);
  }
  if (pathname === "/api/chat" && method === "POST") {
    return handleChat(request, env);
  }

  // Álbum — con auth
  const albumRe = pathname.match(/^\/api\/album\/([^/]+)$/);
  if (albumRe) {
    const tid = albumRe[1];
    if (!await checkAuth(request, env, tid)) return json({ error: "Unauthorized" }, 401);
    if (method === "GET")  return handleGetAlbum(env, tid);
    if (method === "POST") return handleAddEvent(request, env, tid);
  }

  const evRe = pathname.match(/^\/api\/album\/([^/]+)\/event\/([^/]+)$/);
  if (evRe && method === "DELETE") {
    const [, tid, evId] = evRe;
    if (!await checkAuth(request, env, tid)) return json({ error: "Unauthorized" }, 401);
    return handleDeleteEvent(env, tid, evId);
  }

  // Mercado
  if (pathname === "/api/market" && method === "GET") {
    return handleMarketList(env);
  }
  if (pathname === "/api/market" && method === "POST") {
    const body = await request.json();
    if (!await checkAuth(request, env, body.tenantId)) return json({ error: "Unauthorized" }, 401);
    return handleMarketPublish(env, body);
  }
  if (pathname === "/api/market" && method === "DELETE") {
    const body = await request.json();
    if (!await checkAuth(request, env, body.tenantId)) return json({ error: "Unauthorized" }, 401);
    return handleMarketUnpublish(env, body.tenantId);
  }

  return json({ error: "Not found" }, 404);
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function handleLogin(request, env) {
  const { phoneHash } = await request.json();
  if (!phoneHash || phoneHash.length !== 64) {
    return json({ error: "Hash inválido" }, 400);
  }

  const phoneKey = `phones/${phoneHash}.json`;
  const existing = await env.ALBUM.get(phoneKey);

  if (existing) {
    return json(JSON.parse(await existing.text()));
  }

  // Primera vez con este número → crear tenant
  const tenantId = crypto.randomUUID();
  const token    = crypto.randomUUID();
  const authData = { tenantId, token };

  await Promise.all([
    env.ALBUM.put(`${tenantId}/auth.json`, JSON.stringify({ token }), {
      httpMetadata: { contentType: "application/json" },
    }),
    env.ALBUM.put(phoneKey, JSON.stringify(authData), {
      httpMetadata: { contentType: "application/json" },
    }),
  ]);

  return json(authData);
}

async function checkAuth(request, env, tenantId) {
  const header = request.headers.get("Authorization") || "";
  if (!header.startsWith("Bearer ")) return false;
  const token = header.slice(7);
  const obj = await env.ALBUM.get(`${tenantId}/auth.json`);
  if (!obj) return false;
  const { token: stored } = JSON.parse(await obj.text());
  return token === stored;
}

// ─── Groq proxy ───────────────────────────────────────────────────────────────

async function handleTranscribe(request, env) {
  const formData = await request.formData();
  const res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.GROQ_API_KEY}` },
    body: formData,
  });
  return json(await res.json(), res.status);
}

async function handleChat(request, env) {
  const body = await request.json();
  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return json(await res.json(), res.status);
}

// ─── Álbum ────────────────────────────────────────────────────────────────────

async function handleGetAlbum(env, tenantId) {
  const events = await readJsonl(env, `${tenantId}/album.jsonl`);
  return json({ events });
}

async function handleAddEvent(request, env, tenantId) {
  const body = await request.json();
  const event = { id: `ev_${crypto.randomUUID()}`, ts: new Date().toISOString(), ...body };
  await appendJsonl(env, `${tenantId}/album.jsonl`, event);
  return json({ event });
}

async function handleDeleteEvent(env, tenantId, evId) {
  const events = await readJsonl(env, `${tenantId}/album.jsonl`);
  await writeJsonl(env, `${tenantId}/album.jsonl`, events.filter(e => e.id !== evId));
  return json({ ok: true });
}

// ─── Mercado ──────────────────────────────────────────────────────────────────

async function handleMarketList(env) {
  const list = await env.ALBUM.list({ prefix: "market/" });
  const listings = (await Promise.all(
    list.objects.map(async o => {
      const obj = await env.ALBUM.get(o.key);
      if (!obj) return null;
      try { return JSON.parse(await obj.text()); } catch { return null; }
    })
  )).filter(Boolean);
  return json({ listings });
}

async function handleMarketPublish(env, { tenantId, alias, contact, offers, needs }) {
  const entry = {
    tenantId,
    alias: (alias || "Anónimo").slice(0, 30),
    contact: contact ? contact.replace(/\D/g, "").slice(0, 15) : null,
    offers: (offers || []).slice(0, 500),
    needs:  (needs  || []).slice(0, 500),
    updatedAt: new Date().toISOString(),
  };
  await env.ALBUM.put(`market/${tenantId}.json`, JSON.stringify(entry), {
    httpMetadata: { contentType: "application/json" },
  });
  return json({ ok: true });
}

async function handleMarketUnpublish(env, tenantId) {
  await env.ALBUM.delete(`market/${tenantId}.json`);
  return json({ ok: true });
}

// ─── R2 JSONL helpers ─────────────────────────────────────────────────────────

async function readJsonl(env, key) {
  const obj = await env.ALBUM.get(key);
  if (!obj) return [];
  return (await obj.text()).trim().split("\n").filter(Boolean).flatMap(l => {
    try { return [JSON.parse(l)]; } catch { return []; }
  });
}

async function appendJsonl(env, key, record) {
  const obj = await env.ALBUM.get(key);
  const prev = obj ? await obj.text() : "";
  await env.ALBUM.put(key, prev + JSON.stringify(record) + "\n", {
    httpMetadata: { contentType: "application/x-ndjson" },
  });
}

async function writeJsonl(env, key, records) {
  const body = records.map(r => JSON.stringify(r)).join("\n") + (records.length ? "\n" : "");
  await env.ALBUM.put(key, body, { httpMetadata: { contentType: "application/x-ndjson" } });
}

// ─── Util ─────────────────────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

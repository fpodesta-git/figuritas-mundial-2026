const WORKER_URL = "";

// ─── Auth ─────────────────────────────────────────────────────────────────────

function getAuth() {
  try { return JSON.parse(localStorage.getItem("figuritas_auth") || "null"); } catch { return null; }
}
function setAuth(auth) { localStorage.setItem("figuritas_auth", JSON.stringify(auth)); }
function clearAuth()   { localStorage.removeItem("figuritas_auth"); }
function authHeaders(auth) { return { Authorization: `Bearer ${auth.token}` }; }

async function hashPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(digits));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function loginWithPhone(phone) {
  const phoneHash = await hashPhone(phone);
  const res = await fetch(`${WORKER_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneHash }),
  });
  if (!res.ok) throw new Error("Error al iniciar sesión");
  const auth = await res.json();
  setAuth(auth);
  return auth;
}

// ─── State ────────────────────────────────────────────────────────────────────

// events: [{id, ts, type:"add"|"remove", sticker:"ARG5"}]
// collected: {"ARG5": 2, "MEX1": 1, ...}
let state = { events: [], collected: {} };

function computeCollected(events) {
  const counts = {};
  for (const ev of events) {
    const k = ev.sticker;
    if (ev.type === "add")    counts[k] = (counts[k] || 0) + 1;
    if (ev.type === "remove") counts[k] = Math.max(0, (counts[k] || 0) - 1);
  }
  for (const k of Object.keys(counts)) if (counts[k] === 0) delete counts[k];
  return counts;
}

function getCount(code) { return state.collected[code] || 0; }

function getStats() {
  let inAlbum = 0, duplicates = 0;
  for (const count of Object.values(state.collected)) {
    if (count >= 1) inAlbum++;
    if (count >= 2) duplicates += count - 1;
  }
  return { inAlbum, duplicates, total: TOTAL_STICKERS };
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function loadAlbum() {
  const auth = getAuth();
  const res = await fetch(`${WORKER_URL}/api/album/${auth.tenantId}`, {
    headers: authHeaders(auth),
  });
  if (!res.ok) throw new Error("Error cargando álbum");
  const { events } = await res.json();
  state.events = events;
  state.collected = computeCollected(events);
}

async function postEvent(type, sticker) {
  const auth = getAuth();
  const res = await fetch(`${WORKER_URL}/api/album/${auth.tenantId}`, {
    method: "POST",
    headers: { ...authHeaders(auth), "Content-Type": "application/json" },
    body: JSON.stringify({ type, sticker }),
  });
  if (!res.ok) throw new Error("Error guardando evento");
  const { event } = await res.json();
  state.events.push(event);
  state.collected = computeCollected(state.events);
  return event;
}

async function deleteEvent(evId) {
  const auth = getAuth();
  const res = await fetch(`${WORKER_URL}/api/album/${auth.tenantId}/event/${evId}`, {
    method: "DELETE",
    headers: authHeaders(auth),
  });
  if (!res.ok) throw new Error("Error eliminando evento");
  state.events = state.events.filter(e => e.id !== evId);
  state.collected = computeCollected(state.events);
}

// ─── Groq ─────────────────────────────────────────────────────────────────────

async function transcribeAudio(audioBlob) {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "whisper-large-v3");
  formData.append("language", "es");
  formData.append("response_format", "json");
  const res = await fetch(`${WORKER_URL}/api/transcribe`, { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  return (await res.json()).text || "";
}

const SYSTEM_PROMPT = `Eres un asistente para registrar figuritas del álbum Panini FIFA World Cup 2026™.

Cada figurita tiene un código único: {CÓDIGO_EQUIPO}{NÚMERO}
Equipos por grupo:
  Grupo A: MEX (México), RSA (Sudáfrica), KOR (Corea del Sur), CZE (Rep. Checa)
  Grupo B: CAN (Canadá), BIH (Bosnia), QAT (Qatar), SUI (Suiza)
  Grupo C: BRA (Brasil), MAR (Marruecos), HAI (Haití), SCO (Escocia)
  Grupo D: USA (EEUU), PAR (Paraguay), AUS (Australia), TUR (Turquía)
  Grupo E: GER (Alemania), CUW (Curazao), CIV (Costa de Marfil), ECU (Ecuador)
  Grupo F: NED (Países Bajos), JAP (Japón), SWE (Suecia), TUN (Túnez)
  Grupo G: BEL (Bélgica), EGY (Egipto), IRN (Irán), NZL (Nueva Zelanda)
  Grupo H: ESP (España), CPV (Cabo Verde), KSA (Arabia Saudita), URU (Uruguay)
  Grupo I: FRA (Francia), SEN (Senegal), IRQ (Iraq), NOR (Noruega)
  Grupo J: ARG (Argentina), ALG (Argelia), AUT (Austria), JOR (Jordania)
  Grupo K: POR (Portugal), COD (RD Congo), UZB (Uzbekistán), COL (Colombia)
  Grupo L: ENG (Inglaterra), CRO (Croacia), GHA (Ghana), PAN (Panamá)
  Especiales FIFA: FW1-FW19 · Coca-Cola: CC1-CC14
Cada equipo tiene figuritas del 1 al 20.

Cada figurita tiene una acción: "add" (conseguí, tengo, me dieron) o "remove" (borré, perdí, cambié, saqué, me robaron, la di).

Ejemplos:
  "conseguí la 5 de Argentina" → {code:"ARG5", action:"add"}
  "perdí la MEX10" → {code:"MEX10", action:"remove"}
  "cambié la BRA3" → {code:"BRA3", action:"remove"}
  "conseguí la ARG5 y perdí la MEX10" → [{code:"ARG5",action:"add"},{code:"MEX10",action:"remove"}]
  "la especial 3" → {code:"FW3", action:"add"}
  "cambié la 17 de Argelia por la 3 de Portugal" → [{code:"ALG17",action:"remove"},{code:"POR3",action:"add"}]
  "cambié la BRA5 por la ARG10 y la MEX3 por la FRA7" → [{code:"BRA5",action:"remove"},{code:"ARG10",action:"add"},{code:"MEX3",action:"remove"},{code:"FRA7",action:"add"}]

El patrón "cambié X por Y" siempre genera dos entradas: remove para X, add para Y.
Cuando no se menciona acción explícita, asumí "add".

Correcciones de transcripción de voz (Whisper confunde nombres de países con palabras en español):
- "Gana" o "gana" → Ghana (GHA)
- "Para" solo (sin contexto de acción) → Paraguay (PAR)
- "Irán" puede aparecer como "iran" (verbo) → siempre interpretarlo como el país Irán (IRN)
- "Mali" → no está en el álbum, no confundir con MAR (Marruecos)
- "Cana" → Canadá (CAN) si el contexto es de figuritas

Responde SOLO con JSON válido:
{
  "stickers": [{"code": "ARG5", "action": "add"}, {"code": "MEX10", "action": "remove"}],
  "unknown": ["texto que no pudiste interpretar"]
}

Si no hay figuritas, devuelve: {"stickers": [], "unknown": []}`;

async function parseStickersFromText(text) {
  const res = await fetch(`${WORKER_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, { role: "user", content: text }],
      temperature: 0,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  const data = await res.json();
  return JSON.parse(data.choices?.[0]?.message?.content || "{}");
}

// ─── Recording ────────────────────────────────────────────────────────────────

let mediaRecorder = null, audioChunks = [], isRecording = false;

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioChunks = [];
  const mimeType = ["audio/webm;codecs=opus","audio/webm","audio/ogg"].find(t => MediaRecorder.isTypeSupported(t)) || "";
  mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
  mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
  mediaRecorder.start(100);
  isRecording = true;
}

async function stopRecording() {
  return new Promise(resolve => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
      mediaRecorder.stream.getTracks().forEach(t => t.stop());
      isRecording = false;
      resolve(blob);
    };
    mediaRecorder.stop();
  });
}

// ─── Render ───────────────────────────────────────────────────────────────────

let currentFilter = "all";

function renderProgress() {
  const { inAlbum, duplicates, total } = getStats();
  const pct = Math.round((inAlbum / total) * 100);
  document.getElementById("progress-fill").style.width = pct + "%";
  document.getElementById("progress-text").textContent =
    `${inAlbum} / ${total} (${pct}%) · ${duplicates} repetida${duplicates !== 1 ? "s" : ""}`;
}

function filterOk(code) {
  const c = getCount(code);
  if (currentFilter === "collected")  return c >= 1;
  if (currentFilter === "missing")    return c === 0;
  if (currentFilter === "duplicates") return c >= 2;
  return true;
}

function stickerEl(code) {
  const c = getCount(code);
  const cls = c === 0 ? "missing" : c === 1 ? "collected" : "duplicate";
  const info = STICKER_MAP[code];
  const badge = c >= 2 ? `<span class="dup-badge">+${c-1}</span>` : "";
  return `<div class="sticker ${cls}" data-code="${code}" title="${info?.teamName || ""} ${info?.localN || code}">${info?.localN || code}${badge}</div>`;
}

function renderAlbum() {
  const container = document.getElementById("groups-container");
  container.innerHTML = "";

  // FIFA Especiales
  const fwCodes = Array.from({length: FW_COUNT}, (_, i) => `FW${i+1}`);
  const ccCodes = Array.from({length: CC_COUNT}, (_, i) => `CC${i+1}`);
  const specials = [
    { name: "🏆 FIFA Especiales", codes: fwCodes, color: "#f5a623" },
    { name: "🥤 Coca-Cola", codes: ccCodes, color: "#e74c3c" },
  ];

  for (const s of specials) {
    if (currentFilter !== "all" && !s.codes.some(filterOk)) continue;
    const div = document.createElement("div");
    div.className = "group-section";
    div.innerHTML = `<h3 style="border-color:${s.color}">${s.name}</h3>
      <div class="stickers-grid">${s.codes.map(stickerEl).join("")}</div>`;
    container.appendChild(div);
  }

  // Grupos
  for (const group of GROUPS) {
    const teamsRow = document.createElement("div");
    teamsRow.className = "teams-row";

    for (const team of group.teams) {
      const codes = Array.from({length: 20}, (_, i) => `${team.code}${i+1}`);
      if (currentFilter !== "all" && !codes.some(filterOk)) continue;
      const collected = codes.filter(c => getCount(c) >= 1).length;
      const teamDiv = document.createElement("div");
      teamDiv.className = "team-card";
      teamDiv.innerHTML = `
        <div class="team-header">
          <span class="team-flag">${team.flag}</span>
          <span class="team-name">${team.name}</span>
          <span class="team-pct">${Math.round(collected/20*100)}%</span>
        </div>
        <div class="stickers-grid">${codes.map(stickerEl).join("")}</div>`;
      teamsRow.appendChild(teamDiv);
    }

    if (teamsRow.children.length === 0 && currentFilter !== "all") continue;
    const groupDiv = document.createElement("div");
    groupDiv.className = "group-section";
    groupDiv.innerHTML = `<h3 style="border-color:${group.color}">${group.name}</h3>`;
    groupDiv.appendChild(teamsRow);
    container.appendChild(groupDiv);
  }
}

function groupDuplicates() {
  const byTeam = {};
  for (const [code, count] of Object.entries(state.collected)) {
    if (count < 2) continue;
    const info = STICKER_MAP[code];
    if (!info) continue;
    const key = info.section;
    if (!byTeam[key]) byTeam[key] = { flag: info.flag, numbers: [] };
    byTeam[key].numbers.push(info.localN);
  }
  return Object.entries(byTeam)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([team, { flag, numbers }]) => ({
      team, flag, numbers: numbers.sort((a, b) => a - b)
    }));
}

function renderDuplicates() {
  const list = document.getElementById("duplicates-list");
  const groups = groupDuplicates();

  list.innerHTML = groups.length
    ? groups.map(g => `<div class="dup-item">
        <span class="dup-n">${g.team}</span>
        <span class="dup-flag">${g.flag}</span>
        <span class="dup-desc">${g.numbers.join(", ")}</span>
      </div>`).join("")
    : `<p class="empty-msg">Sin figuritas repetidas por ahora</p>`;
}

function renderAll() {
  renderProgress();
  renderAlbum();
  renderDuplicates();
}

// ─── Sticker click ────────────────────────────────────────────────────────────

document.addEventListener("click", async e => {
  const el = e.target.closest(".sticker");
  if (!el) return;
  const code = el.dataset.code;
  if (!code || !STICKER_MAP[code]) return;

  if (e.shiftKey) {
    if (getCount(code) === 0) return;
    const lastAdd = [...state.events].reverse().find(ev => ev.type === "add" && ev.sticker === code);
    if (!lastAdd) return;
    el.style.opacity = "0.5";
    try {
      await deleteEvent(lastAdd.id);
      showToast(`Removida ${code}`);
      renderAll();
    } catch (err) { showToast(err.message, "error"); }
    finally { el.style.opacity = ""; }
  } else {
    el.style.opacity = "0.5";
    try {
      await postEvent("add", code);
      const c = getCount(code);
      showToast(c === 1 ? `✓ ${code} al álbum` : `+1 repetida de ${code} (×${c})`);
      renderAll();
    } catch (err) { showToast(err.message, "error"); }
    finally { el.style.opacity = ""; }
  }
});

// ─── Voice ────────────────────────────────────────────────────────────────────

const recordBtn   = document.getElementById("record-btn");
const transcriptEl = document.getElementById("transcript-display");
const resultEl    = document.getElementById("result-display");

recordBtn.addEventListener("mousedown", handleRecordStart);
recordBtn.addEventListener("touchstart", e => { e.preventDefault(); handleRecordStart(); });
recordBtn.addEventListener("mouseup", handleRecordStop);
recordBtn.addEventListener("mouseleave", () => { if (isRecording) handleRecordStop(); });
recordBtn.addEventListener("touchend", e => { e.preventDefault(); handleRecordStop(); });

async function handleRecordStart() {
  if (isRecording) return;
  try {
    await startRecording();
    recordBtn.classList.add("recording");
    recordBtn.querySelector("span:last-child").textContent = "Grabando... soltá para enviar";
    transcriptEl.textContent = "";
    resultEl.innerHTML = "";
  } catch (err) { showToast("Error al acceder al micrófono: " + err.message, "error"); }
}

async function handleRecordStop() {
  if (!isRecording) return;
  recordBtn.classList.remove("recording");
  recordBtn.querySelector("span:last-child").textContent = "Procesando...";
  recordBtn.disabled = true;

  try {
    const blob = await stopRecording();
    transcriptEl.textContent = "Transcribiendo...";
    const text = await transcribeAudio(blob);
    transcriptEl.textContent = `"${text}"`;

    if (!text.trim()) {
      resultEl.innerHTML = `<span class="warn">No se detectó audio claro.</span>`;
      return;
    }

    resultEl.innerHTML = `<span class="info">Analizando...</span>`;
    const parsed = await parseStickersFromText(text);

    if (!parsed.stickers?.length) {
      resultEl.innerHTML = `<span class="warn">No encontré figuritas en lo que dijiste.</span>`;
      return;
    }

    const added = [], repeated = [], removed = [], notFound = [];
    for (const { code, action = "add" } of parsed.stickers) {
      if (!STICKER_MAP[code]) continue;

      if (action === "remove") {
        if (getCount(code) === 0) { notFound.push(code); continue; }
        const lastAdd = [...state.events].reverse().find(ev => ev.type === "add" && ev.sticker === code);
        if (lastAdd) { await deleteEvent(lastAdd.id); removed.push(code); }
        else { await postEvent("remove", code); removed.push(code); }
      } else {
        const prev = getCount(code);
        await postEvent("add", code);
        if (prev === 0) added.push(code); else repeated.push(code);
      }
    }
    renderAll();

    let html = "";
    if (added.length)    html += `<div class="result-added"><strong>✓ Al álbum:</strong> ${added.map(c => `<span class="r-tag new">${c}</span>`).join("")}</div>`;
    if (repeated.length) html += `<div class="result-dup"><strong>🔁 Repetidas:</strong> ${repeated.map(c => `<span class="r-tag dup">${c} ×${getCount(c)}</span>`).join("")}</div>`;
    if (removed.length)  html += `<div class="result-unk"><strong>🗑 Removidas:</strong> ${removed.map(c => `<span class="r-tag">${c}</span>`).join("")}</div>`;
    if (notFound.length) html += `<div class="result-unk"><strong>⚠ No la tenías:</strong> ${notFound.join(", ")}</div>`;
    if (parsed.unknown?.length) html += `<div class="result-unk"><strong>⚠ No entendí:</strong> ${parsed.unknown.join(", ")}</div>`;
    resultEl.innerHTML = html;
  } catch (err) {
    resultEl.innerHTML = `<span class="error">Error: ${err.message}</span>`;
    showToast(err.message, "error");
  } finally {
    recordBtn.disabled = false;
    recordBtn.querySelector("span:last-child").textContent = "Presioná para hablar";
  }
}

// ─── Filters ──────────────────────────────────────────────────────────────────

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderAlbum();
  });
});

// ─── Export ───────────────────────────────────────────────────────────────────

document.getElementById("export-btn").addEventListener("click", () => {
  const groups = groupDuplicates();
  if (!groups.length) { showToast("No tenés figuritas repetidas"); return; }
  const lines = groups.map(g => `${g.team} ${g.flag}: ${g.numbers.join(", ")}`);
  const text = `🏆 Mis figuritas repetidas - Mundial 2026\n\n${lines.join("\n")}\n\nfichus.ar`;
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
});

// ─── Logout ───────────────────────────────────────────────────────────────────

document.getElementById("logout-btn").addEventListener("click", () => {
  if (!confirm("¿Salir? Podés volver a entrar con tu número de celular.")) return;
  clearAuth(); location.reload();
});

// ─── Main tabs ────────────────────────────────────────────────────────────────

document.querySelectorAll(".main-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".main-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    document.getElementById("tab-album").classList.toggle("hidden", tab !== "album");
    document.getElementById("tab-market").classList.toggle("hidden", tab !== "market");
    if (tab === "market") renderMarket();
  });
});

// ─── Mercado ──────────────────────────────────────────────────────────────────

let marketListings = [];

function myOffers() {
  return Object.entries(state.collected).filter(([, c]) => c >= 2).map(([code]) => code);
}
function myNeeds() {
  return Object.keys(STICKER_MAP).filter(code => !state.collected[code]);
}

async function fetchMarket() {
  const res = await fetch(`${WORKER_URL}/api/market`);
  if (!res.ok) throw new Error("Error cargando mercado");
  const { listings } = await res.json();
  marketListings = listings;
}

async function publishMarket() {
  const auth = getAuth();
  const alias   = document.getElementById("market-alias").value.trim();
  const contact = document.getElementById("market-contact").value.trim();
  if (!alias) { showToast("Ingresá un nombre o apodo", "error"); return; }

  const btn = document.getElementById("market-publish-btn");
  btn.disabled = true; btn.textContent = "Publicando...";
  try {
    await fetch(`${WORKER_URL}/api/market`, {
      method: "POST",
      headers: { ...authHeaders(auth), "Content-Type": "application/json" },
      body: JSON.stringify({ tenantId: auth.tenantId, alias, contact, offers: myOffers(), needs: myNeeds() }),
    });
    showToast("¡Repes publicadas!");
    await fetchMarket();
    renderMarket();
  } catch (err) { showToast(err.message, "error"); }
  finally { btn.disabled = false; btn.textContent = "Publicar mis repes"; }
}

async function unpublishMarket() {
  const auth = getAuth();
  if (!confirm("¿Dar de baja tu publicación del mercado?")) return;
  await fetch(`${WORKER_URL}/api/market`, {
    method: "DELETE",
    headers: { ...authHeaders(auth), "Content-Type": "application/json" },
    body: JSON.stringify({ tenantId: auth.tenantId }),
  });
  showToast("Publicación dada de baja");
  await fetchMarket();
  renderMarket();
}

function relativeTime(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1)  return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hs = Math.round(mins / 60);
  if (hs < 24)   return `hace ${hs}h`;
  return `hace ${Math.round(hs / 24)}d`;
}

function marketCardHTML(listing, myNeedSet, myOfferSet, showMatchHighlight) {
  const isMe = listing.tenantId === getAuth()?.tenantId;
  const theyHave = listing.offers.filter(c => myNeedSet.has(c));
  const theyNeed = listing.needs.filter(c => myOfferSet.has(c));

  const tags = listing.offers.slice(0, 20).map(c => {
    const cls = showMatchHighlight && myNeedSet.has(c) ? "market-tag match" : "market-tag";
    return `<span class="${cls}">${c}</span>`;
  }).join("");
  const more = listing.offers.length > 20 ? `<span class="market-tag">+${listing.offers.length - 20}</span>` : "";

  let matchLine = "";
  if (showMatchHighlight && theyHave.length) {
    matchLine = `<div class="market-score">✓ Tiene ${theyHave.length} que te falta${theyHave.length > 1 ? "n" : ""} · `;
    matchLine += theyNeed.length ? `vos tenés ${theyNeed.length} que le falta${theyNeed.length > 1 ? "n" : ""}` : "no sabe lo que le falta";
    matchLine += `</div>`;
  }

  const waBtn = listing.contact
    ? `<a href="https://wa.me/54${listing.contact}?text=${encodeURIComponent(`Hola ${listing.alias}! Vi en fichus.ar que tenés figuritas para cambiar. ¿Coordinamos?`)}" target="_blank" class="btn" style="text-decoration:none;font-size:0.78rem">💬 WhatsApp</a>`
    : "";

  return `<div class="market-card">
    <div class="market-card-header">
      <span class="market-card-alias">${isMe ? "⭐ " : ""}${listing.alias}</span>
      <span class="market-card-time">${relativeTime(listing.updatedAt)}</span>
    </div>
    ${matchLine}
    <div class="market-card-offers">${tags}${more}</div>
    <div class="market-card-actions">${waBtn}</div>
  </div>`;
}

function renderMarket() {
  const auth = getAuth();
  const myNeedSet  = new Set(myNeeds());
  const myOfferSet = new Set(myOffers());
  const myListing  = marketListings.find(l => l.tenantId === auth?.tenantId);

  // Mi publicación
  const statusEl  = document.getElementById("my-listing-status");
  const publishBtn = document.getElementById("market-publish-btn");
  const unpublishBtn = document.getElementById("market-unpublish-btn");

  if (myListing) {
    statusEl.className = "market-status published";
    statusEl.textContent = `Publicado ${relativeTime(myListing.updatedAt)} · ${myListing.offers.length} repes`;
    document.getElementById("market-alias").value = myListing.alias;
    document.getElementById("market-contact").value = myListing.contact || "";
    publishBtn.textContent = "Actualizar";
    unpublishBtn.classList.remove("hidden");
  } else {
    statusEl.className = "market-status";
    statusEl.textContent = "No publicado — publicá tus repes para que otros puedan encontrarte";
    publishBtn.textContent = "Publicar mis repes";
    unpublishBtn.classList.add("hidden");
  }

  // Matches
  const matchEl = document.getElementById("market-matches");
  const matches = marketListings
    .filter(l => l.tenantId !== auth?.tenantId)
    .map(l => ({ ...l, score: l.offers.filter(c => myNeedSet.has(c)).length + l.needs.filter(c => myOfferSet.has(c)).length }))
    .filter(l => l.score > 0)
    .sort((a, b) => b.score - a.score);

  matchEl.innerHTML = matches.length
    ? matches.map(l => marketCardHTML(l, myNeedSet, myOfferSet, true)).join("")
    : `<p class="market-hint">Sin matches por ahora — aparecen cuando otros usuarios publican figuritas que vos necesitás.</p>`;

  // Explorar (con filtro)
  renderMarketListings();
}

function renderMarketListings() {
  const auth    = getAuth();
  const query   = document.getElementById("market-search").value.trim().toLowerCase();
  const myNeedSet  = new Set(myNeeds());
  const myOfferSet = new Set(myOffers());

  let listings = marketListings.filter(l => l.tenantId !== auth?.tenantId);

  if (query) {
    listings = listings.filter(l =>
      l.alias.toLowerCase().includes(query) ||
      l.offers.some(c => c.toLowerCase().includes(query) ||
        (STICKER_MAP[c]?.teamName || "").toLowerCase().includes(query))
    );
  }

  document.getElementById("market-listings").innerHTML = listings.length
    ? listings.map(l => marketCardHTML(l, myNeedSet, myOfferSet, false)).join("")
    : `<p class="market-hint">${query ? "Sin resultados para tu búsqueda." : "Ningún usuario publicó sus repes todavía."}</p>`;
}

document.getElementById("market-publish-btn").addEventListener("click", publishMarket);
document.getElementById("market-unpublish-btn").addEventListener("click", unpublishMarket);
document.getElementById("market-search").addEventListener("input", renderMarketListings);

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(msg, type = "ok") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3000);
}

// ─── Login screen ─────────────────────────────────────────────────────────────

function showApp()   { document.getElementById("login-screen").classList.add("hidden"); document.getElementById("app").classList.remove("hidden"); }
function showLogin() { document.getElementById("login-screen").classList.remove("hidden"); document.getElementById("app").classList.add("hidden"); }

async function handleLogin() {
  const phone = document.getElementById("phone-input").value.trim();
  const errEl = document.getElementById("login-error");
  const btn   = document.getElementById("login-btn");
  if (phone.replace(/\D/g,"").length < 8) {
    errEl.textContent = "Ingresá un número válido";
    errEl.classList.remove("hidden");
    return;
  }
  errEl.classList.add("hidden");
  btn.disabled = true; btn.textContent = "Entrando...";
  try {
    await loginWithPhone(phone);
    await loadAlbumAndRender();
    showApp();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.classList.remove("hidden");
  } finally { btn.disabled = false; btn.textContent = "Entrar"; }
}

document.getElementById("login-btn").addEventListener("click", handleLogin);
document.getElementById("phone-input").addEventListener("keydown", e => { if (e.key === "Enter") handleLogin(); });

// ─── Init ─────────────────────────────────────────────────────────────────────

async function loadAlbumAndRender() {
  document.getElementById("loading").classList.remove("hidden");
  document.getElementById("album-section").classList.add("hidden");
  try { await loadAlbum(); }
  catch (err) { showToast("Error al cargar el álbum: " + err.message, "error"); }
  finally {
    document.getElementById("loading").classList.add("hidden");
    document.getElementById("album-section").classList.remove("hidden");
  }
  renderAll();
}

async function init() {
  const auth = getAuth();
  if (auth?.tenantId && auth?.token) { showApp(); await loadAlbumAndRender(); }
  else showLogin();
}

init();

// ─── Config ───────────────────────────────────────────────────────────────────
// Actualizá esta URL después del primer deploy del Worker
const WORKER_URL = "https://figuritas-worker.facundo-podesta.workers.dev";

// ─── Auth ─────────────────────────────────────────────────────────────────────

function getAuth() {
  try { return JSON.parse(localStorage.getItem("figuritas_auth") || "null"); } catch { return null; }
}

function setAuth(auth) {
  localStorage.setItem("figuritas_auth", JSON.stringify(auth));
}

function authHeaders(auth) {
  return { Authorization: `Bearer ${auth.token}` };
}

async function ensureAuth() {
  let auth = getAuth();
  if (auth?.tenantId && auth?.token) return auth;

  const res = await fetch(`${WORKER_URL}/api/auth/register`, { method: "POST" });
  if (!res.ok) throw new Error("No se pudo crear la cuenta");
  auth = await res.json();
  setAuth(auth);
  return auth;
}

// ─── State ────────────────────────────────────────────────────────────────────

// events: array de todos los eventos cargados desde R2
// collected: {stickerNumber(str) -> count} — derivado de events
let state = { events: [], collected: {} };

function computeCollected(events) {
  const counts = {};
  for (const ev of events) {
    const k = String(ev.sticker);
    if (ev.type === "add")    counts[k] = (counts[k] || 0) + 1;
    if (ev.type === "remove") counts[k] = Math.max(0, (counts[k] || 0) - 1);
  }
  for (const k of Object.keys(counts)) if (counts[k] === 0) delete counts[k];
  return counts;
}

function getCount(n) { return state.collected[String(n)] || 0; }

function getStats() {
  let inAlbum = 0, duplicates = 0;
  for (const count of Object.values(state.collected)) {
    if (count >= 1) inAlbum++;
    if (count >= 2) duplicates += count - 1;
  }
  return { inAlbum, duplicates, total: TOTAL_STICKERS };
}

// ─── API calls ────────────────────────────────────────────────────────────────

async function loadAlbum() {
  const auth = await ensureAuth();
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

// ─── Groq: Transcribir audio ──────────────────────────────────────────────────

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
  const data = await res.json();
  return data.text || "";
}

// ─── Groq: Parsear figuritas del texto ───────────────────────────────────────

const SYSTEM_PROMPT = `Eres un asistente que ayuda a registrar figuritas del álbum Panini oficial del FIFA World Cup 2026™.

El álbum tiene ${TOTAL_STICKERS} figuritas numeradas del 1 al 674.

Estructura del álbum (rangos de figuritas por equipo):
- Introducción: 1-10
- Estadios/Sedes: 11-50
- Grupo A: México(51-63), Bélgica(64-76), Senegal(77-89), Japón(90-102)
- Grupo B: Estados Unidos(103-115), Croacia(116-128), Marruecos(129-141), Corea del Sur(142-154)
- Grupo C: Canadá(155-167), Portugal(168-180), Australia(181-193), Colombia(194-206)
- Grupo D: Brasil(207-219), Dinamarca(220-232), Nigeria(233-245), Jordania(246-258)
- Grupo E: Argentina(259-271), Suiza(272-284), Egipto(285-297), Bolivia(298-310)
- Grupo F: España(311-323), Irán(324-336), Camerún(337-349), Ecuador(350-362)
- Grupo G: Francia(363-375), Serbia(376-388), Túnez(389-401), Venezuela(402-414)
- Grupo H: Inglaterra(415-427), Austria(428-440), Sudáfrica(441-453), Uruguay(454-466)
- Grupo I: Alemania(467-479), Hungría(480-492), Ghana(493-505), Nueva Zelanda(506-518)
- Grupo J: Países Bajos(519-531), Escocia(532-544), Arabia Saudita(545-557), Panamá(558-570)
- Grupo K: Rumania(571-583), Turquía(584-596), Costa de Marfil(597-609), Honduras(610-622)
- Grupo L: Uzbekistán(623-635), Iraq(636-648), Jamaica(649-661), Costa Rica(662-674)

Dentro de cada equipo (rango de 13 figuritas):
- Posición 1: Escudo (brillante)
- Posición 2: Foto del equipo
- Posiciones 3-13: Jugadores

Reglas de conversión:
- "la X de [país]" → número global = start_del_país + X - 1
- "el escudo de [país]" → número global = start_del_país
- "la foto de [país]" o "el equipo de [país]" → número global = start_del_país + 1
- Un número solo (ej: "la 320") → número global directo

Responde SOLO con JSON válido:
{
  "stickers": [{"global": 263, "desc": "Argentina - Messi"}],
  "unknown": ["texto que no pudiste interpretar"]
}

Si no hay figuritas, devuelve: {"stickers": [], "unknown": []}`;

async function parseStickersFromText(text) {
  const res = await fetch(`${WORKER_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
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

// ─── Voice Recording ──────────────────────────────────────────────────────────

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioChunks = [];
  const mimeType = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg"]
    .find(t => MediaRecorder.isTypeSupported(t)) || "";
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

// ─── UI ───────────────────────────────────────────────────────────────────────

let currentFilter = "all";

function renderProgress() {
  const { inAlbum, duplicates, total } = getStats();
  const pct = Math.round((inAlbum / total) * 100);
  document.getElementById("progress-fill").style.width = pct + "%";
  document.getElementById("progress-text").textContent =
    `${inAlbum} / ${total} figuritas (${pct}%) · ${duplicates} repetida${duplicates !== 1 ? "s" : ""}`;
}

function filterSticker(n) {
  const count = getCount(n);
  if (currentFilter === "collected")  return count >= 1;
  if (currentFilter === "missing")    return count === 0;
  if (currentFilter === "duplicates") return count >= 2;
  return true;
}

function stickerClass(n) {
  const c = getCount(n);
  return c === 0 ? "missing" : c === 1 ? "collected" : "duplicate";
}

function renderStickerEl(n, desc, shiny) {
  const count = getCount(n);
  const badge = count >= 2 ? `<span class="dup-badge">+${count - 1}</span>` : "";
  return `<div class="sticker ${stickerClass(n)}${shiny ? " shiny" : ""}" data-n="${n}" title="${desc}">
    ${n}${badge}
  </div>`;
}

function renderAlbum() {
  const container = document.getElementById("groups-container");
  container.innerHTML = "";

  for (const section of ALBUM_DATA.sections) {
    if (currentFilter !== "all" && !section.stickers.some(s => filterSticker(s.n))) continue;
    const div = document.createElement("div");
    div.className = "group-section";
    div.innerHTML = `<h3 style="border-color:${section.color || "#555"}">${section.name}</h3>
      <div class="stickers-grid">${section.stickers.map(s => renderStickerEl(s.n, s.desc, s.shiny)).join("")}</div>`;
    container.appendChild(div);
  }

  for (const group of ALBUM_DATA.groups) {
    const teamsRow = document.createElement("div");
    teamsRow.className = "teams-row";

    for (const team of group.teams) {
      const stickers = Array.from({ length: 13 }, (_, i) => team.start + i).filter(n => STICKER_MAP[n]);
      if (currentFilter !== "all" && !stickers.some(n => filterSticker(n))) continue;
      const collected = stickers.filter(n => getCount(n) >= 1).length;
      const teamDiv = document.createElement("div");
      teamDiv.className = "team-card";
      teamDiv.innerHTML = `
        <div class="team-header">
          <span class="team-flag">${team.flag}</span>
          <span class="team-name">${team.name}</span>
          <span class="team-pct">${Math.round(collected / stickers.length * 100)}%</span>
        </div>
        <div class="stickers-grid">
          ${stickers.map(n => renderStickerEl(n, STICKER_MAP[n].desc, STICKER_MAP[n].shiny)).join("")}
        </div>`;
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

function renderDuplicates() {
  const list = document.getElementById("duplicates-list");
  const dups = Object.entries(state.collected)
    .filter(([, c]) => c >= 2)
    .map(([n, c]) => ({ n: parseInt(n), count: c, sticker: STICKER_MAP[parseInt(n)] }))
    .filter(d => d.sticker)
    .sort((a, b) => a.n - b.n);

  list.innerHTML = dups.length
    ? dups.map(d => `<div class="dup-item">
        <span class="dup-n">#${d.n}</span>
        <span class="dup-desc">${d.sticker.desc}</span>
        <span class="dup-count">×${d.count - 1} para cambiar</span>
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
  const n = parseInt(el.dataset.n);

  if (e.shiftKey) {
    if (getCount(n) === 0) return;
    // Remueve el último "add" event de esta figurita
    const lastAdd = [...state.events].reverse().find(ev => ev.type === "add" && ev.sticker === n);
    if (!lastAdd) return;
    el.style.opacity = "0.5";
    try {
      await deleteEvent(lastAdd.id);
      showToast(`Removida figurita #${n}`);
      renderAll();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      el.style.opacity = "";
    }
  } else {
    el.style.opacity = "0.5";
    try {
      await postEvent("add", n);
      const count = getCount(n);
      showToast(count === 1 ? `✓ Figurita #${n} al álbum` : `+1 repetida de #${n} (total: ${count})`);
      renderAll();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      el.style.opacity = "";
    }
  }
});

// ─── Voice button ─────────────────────────────────────────────────────────────

const recordBtn = document.getElementById("record-btn");
const transcriptEl = document.getElementById("transcript-display");
const resultEl = document.getElementById("result-display");

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
  } catch (err) {
    showToast("Error al acceder al micrófono: " + err.message, "error");
  }
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
      resultEl.innerHTML = `<span class="warn">No se detectó audio claro. Intentá de nuevo.</span>`;
      return;
    }

    resultEl.innerHTML = `<span class="info">Analizando...</span>`;
    const parsed = await parseStickersFromText(text);

    if (!parsed.stickers?.length) {
      resultEl.innerHTML = `<span class="warn">No encontré figuritas en lo que dijiste.</span>`;
      return;
    }

    const added = [], repeated = [];
    for (const { global: n } of parsed.stickers) {
      if (!STICKER_MAP[n]) continue;
      const prev = getCount(n);
      await postEvent("add", n);
      if (prev === 0) added.push(n); else repeated.push(n);
    }
    renderAll();

    let html = "";
    if (added.length) html += `<div class="result-added"><strong>✓ Agregadas al álbum:</strong>
      ${added.map(n => `<span class="r-tag new">#${n} ${STICKER_MAP[n]?.desc || ""}</span>`).join("")}</div>`;
    if (repeated.length) html += `<div class="result-dup"><strong>🔁 Repetidas (+1):</strong>
      ${repeated.map(n => `<span class="r-tag dup">#${n} ×${getCount(n)}</span>`).join("")}</div>`;
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
  const dups = Object.entries(state.collected)
    .filter(([, c]) => c >= 2)
    .map(([n, c]) => {
      const s = STICKER_MAP[parseInt(n)];
      return `#${n} ${s?.desc || ""} (×${c - 1} para cambiar)`;
    }).sort();
  if (!dups.length) { showToast("No tenés figuritas repetidas"); return; }
  const blob = new Blob([`Figuritas para cambiar - Mundial 2026\n${"─".repeat(40)}\n${dups.join("\n")}`], { type: "text/plain" });
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "repetidas-mundial-2026.txt" });
  a.click();
  URL.revokeObjectURL(a.href);
});

// ─── Reset ────────────────────────────────────────────────────────────────────

document.getElementById("reset-btn").addEventListener("click", async () => {
  if (!confirm("¿Resetear TODO el álbum? Se perderán todos los datos.")) return;
  // Borra todos los eventos posteando uno de reset (o re-registrás el tenant)
  // Por ahora limpiamos localmente y recargamos (el JSONL queda en R2)
  // TODO: agregar endpoint DELETE /api/album/:tenantId para reset completo
  localStorage.removeItem("figuritas_auth");
  showToast("Cuenta reseteada — recargando...");
  setTimeout(() => location.reload(), 1000);
});

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(msg, type = "ok") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast show ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove("show"), 3000);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  document.getElementById("loading").classList.remove("hidden");
  document.getElementById("album-section").classList.add("hidden");

  try {
    await loadAlbum();
  } catch (err) {
    showToast("Error al cargar el álbum: " + err.message, "error");
  } finally {
    document.getElementById("loading").classList.add("hidden");
    document.getElementById("album-section").classList.remove("hidden");
  }

  renderAll();

  // Muestra el tenant ID en el footer para referencia multi-device
  const auth = getAuth();
  if (auth?.tenantId) {
    const el = document.getElementById("tenant-id");
    if (el) el.textContent = `ID: ${auth.tenantId.slice(0, 8)}…`;
  }
}

init();

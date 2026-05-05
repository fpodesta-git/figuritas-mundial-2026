// ─── Config ───────────────────────────────────────────────────────────────────

const GROQ_BASE = "https://api.groq.com/openai/v1";

// En Cloudflare Pages las llamadas van al proxy (sin exponer el API key).
// En local (localhost / file://) se usan llamadas directas con el key guardado.
const IS_LOCAL = ["localhost", "127.0.0.1", ""].includes(window.location.hostname)
  || window.location.protocol === "file:";

function getApiKey() {
  return (window.GROQ_API_KEY || "") || localStorage.getItem("groq_api_key") || "";
}

// ─── State ────────────────────────────────────────────────────────────────────

// state.collected: { stickerNumber (string) -> count (int) }
// count === 0: not obtained, count === 1: in album, count >= 2: in album + duplicates
let state = { collected: {} };

function loadState() {
  try {
    const saved = localStorage.getItem("album_state_2026");
    if (saved) state = JSON.parse(saved);
  } catch {}
}

function saveState() {
  localStorage.setItem("album_state_2026", JSON.stringify(state));
}

function getCount(n) {
  return state.collected[String(n)] || 0;
}

function addSticker(n) {
  const key = String(n);
  state.collected[key] = (state.collected[key] || 0) + 1;
  saveState();
}

function removeSticker(n) {
  const key = String(n);
  if ((state.collected[key] || 0) > 0) {
    state.collected[key]--;
    if (state.collected[key] === 0) delete state.collected[key];
    saveState();
  }
}

function getStats() {
  let inAlbum = 0, duplicates = 0;
  for (const [, count] of Object.entries(state.collected)) {
    if (count >= 1) inAlbum++;
    if (count >= 2) duplicates += count - 1;
  }
  return { inAlbum, duplicates, total: TOTAL_STICKERS };
}

// ─── Groq: Transcribe audio ───────────────────────────────────────────────────

async function transcribeAudio(audioBlob) {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  formData.append("model", "whisper-large-v3");
  formData.append("language", "es");
  formData.append("response_format", "json");

  let res;
  if (IS_LOCAL) {
    const key = getApiKey();
    if (!key) throw new Error("Ingresá tu API key de Groq (modo local)");
    res = await fetch(`${GROQ_BASE}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: formData
    });
  } else {
    res = await fetch("/api/transcribe", { method: "POST", body: formData });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.text || "";
}

// ─── Groq: Parse stickers from text ──────────────────────────────────────────

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
- Posición 1 (ej: primera del rango): Escudo (brillante)
- Posición 2: Foto del equipo
- Posiciones 3-13: Jugadores

Cuando el usuario dice cosas como:
- "conseguí la 5 de Argentina" → la figurita local 5 de Argentina, que es la número global 259+5-1=263
- "tengo la 259 y la 260" → figuritas globales 259 y 260
- "conseguí el escudo de Brasil" → figurita 207 (primera de Brasil = escudo)
- "la figurita 3 de Portugal" → 168+3-1=170

Reglas de conversión:
- "la X de [país]" → número global = start_del_país + X - 1
- "el escudo de [país]" → número global = start_del_país (posición 1)
- "la foto de [país]" o "el equipo de [país]" → número global = start_del_país + 1
- Un número solo (ej: "la 320") → número global directo

Responde SOLO con JSON válido, sin texto adicional:
{
  "stickers": [
    {"global": 263, "desc": "Argentina - Messi"},
    {"global": 168, "desc": "Portugal - Escudo"}
  ],
  "unknown": ["texto que no pudiste interpretar"]
}

Si no hay figuritas mencionadas, devuelve: {"stickers": [], "unknown": []}`;

async function parseStickersFromText(text) {
  const payload = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text }
    ],
    temperature: 0,
    response_format: { type: "json_object" }
  };

  let res;
  if (IS_LOCAL) {
    const key = getApiKey();
    if (!key) throw new Error("Ingresá tu API key de Groq (modo local)");
    res = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } else {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content || "{}";
  return JSON.parse(content);
}

// ─── Voice Recording ──────────────────────────────────────────────────────────

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioChunks = [];

  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : MediaRecorder.isTypeSupported("audio/webm")
    ? "audio/webm"
    : "audio/ogg";

  mediaRecorder = new MediaRecorder(stream, { mimeType });
  mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
  mediaRecorder.start(100);
  isRecording = true;
}

async function stopRecording() {
  return new Promise(resolve => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType });
      const tracks = mediaRecorder.stream.getTracks();
      tracks.forEach(t => t.stop());
      isRecording = false;
      resolve(blob);
    };
    mediaRecorder.stop();
  });
}

// ─── UI Rendering ─────────────────────────────────────────────────────────────

let currentFilter = "all";

function renderProgress() {
  const { inAlbum, duplicates, total } = getStats();
  const pct = Math.round((inAlbum / total) * 100);

  document.getElementById("progress-fill").style.width = pct + "%";
  document.getElementById("progress-text").textContent =
    `${inAlbum} / ${total} figuritas (${pct}%) · ${duplicates} repetida${duplicates !== 1 ? "s" : ""}`;
}

function stickerClass(n) {
  const count = getCount(n);
  if (count === 0) return "missing";
  if (count === 1) return "collected";
  return "duplicate";
}

function renderAlbum() {
  const container = document.getElementById("groups-container");
  container.innerHTML = "";

  // Intro + Sedes sections
  for (const section of ALBUM_DATA.sections) {
    const stickers = section.stickers.filter(s => filterSticker(s.n));
    if (stickers.length === 0 && currentFilter !== "all") continue;

    const div = document.createElement("div");
    div.className = "group-section";
    div.innerHTML = `<h3 style="border-color:${section.color || "#555"}">${section.name}</h3>
      <div class="stickers-grid">${
        section.stickers.map(s => renderStickerEl(s.n, s.desc, s.shiny)).join("")
      }</div>`;
    container.appendChild(div);
  }

  // Team groups
  for (const group of ALBUM_DATA.groups) {
    const groupDiv = document.createElement("div");
    groupDiv.className = "group-section";
    groupDiv.innerHTML = `<h3 style="border-color:${group.color}">${group.name}</h3>`;

    const teamsRow = document.createElement("div");
    teamsRow.className = "teams-row";

    for (const team of group.teams) {
      const stickers = [];
      for (let i = 0; i < 13; i++) {
        const n = team.start + i;
        if (STICKER_MAP[n]) stickers.push(n);
      }

      const visible = stickers.filter(n => filterSticker(n));
      if (visible.length === 0 && currentFilter !== "all") continue;

      const teamDiv = document.createElement("div");
      teamDiv.className = "team-card";

      const collected = stickers.filter(n => getCount(n) >= 1).length;
      const pct = Math.round((collected / stickers.length) * 100);

      teamDiv.innerHTML = `
        <div class="team-header">
          <span class="team-flag">${team.flag}</span>
          <span class="team-name">${team.name}</span>
          <span class="team-pct">${pct}%</span>
        </div>
        <div class="stickers-grid">
          ${stickers.map(n => renderStickerEl(n, STICKER_MAP[n].desc, STICKER_MAP[n].shiny)).join("")}
        </div>`;
      teamsRow.appendChild(teamDiv);
    }

    if (teamsRow.children.length > 0 || currentFilter === "all") {
      groupDiv.appendChild(teamsRow);
      container.appendChild(groupDiv);
    }
  }
}

function filterSticker(n) {
  const count = getCount(n);
  if (currentFilter === "collected") return count >= 1;
  if (currentFilter === "missing") return count === 0;
  if (currentFilter === "duplicates") return count >= 2;
  return true;
}

function renderStickerEl(n, desc, shiny) {
  const count = getCount(n);
  const cls = stickerClass(n);
  const shinyClass = shiny ? " shiny" : "";
  const badge = count >= 2 ? `<span class="dup-badge">+${count - 1}</span>` : "";
  return `<div class="sticker ${cls}${shinyClass}" data-n="${n}" title="${desc}">
    ${n}${badge}
  </div>`;
}

function renderDuplicates() {
  const list = document.getElementById("duplicates-list");
  const dups = Object.entries(state.collected)
    .filter(([, count]) => count >= 2)
    .map(([n, count]) => ({ n: parseInt(n), count, sticker: STICKER_MAP[parseInt(n)] }))
    .filter(d => d.sticker)
    .sort((a, b) => a.n - b.n);

  if (dups.length === 0) {
    list.innerHTML = `<p class="empty-msg">Sin figuritas repetidas por ahora</p>`;
    return;
  }

  list.innerHTML = dups.map(d => `
    <div class="dup-item">
      <span class="dup-n">#${d.n}</span>
      <span class="dup-desc">${d.sticker.desc}</span>
      <span class="dup-count">×${d.count - 1} para cambiar</span>
    </div>
  `).join("");
}

function renderAll() {
  renderProgress();
  renderAlbum();
  renderDuplicates();
}

// ─── Sticker click: toggle collected / remove ─────────────────────────────────

document.addEventListener("click", e => {
  const el = e.target.closest(".sticker");
  if (!el) return;
  const n = parseInt(el.dataset.n);

  if (e.shiftKey) {
    // Shift+click removes one
    removeSticker(n);
    showToast(`Removida figurita #${n}`);
  } else {
    addSticker(n);
    const count = getCount(n);
    if (count === 1) showToast(`✓ Figurita #${n} al álbum`);
    else showToast(`+1 repetida de #${n} (total: ${count})`);
  }
  renderAll();
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
  if (!getApiKey()) { showConfigModal(); return; }
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

    // 1) Transcribe
    transcriptEl.textContent = "Transcribiendo...";
    const text = await transcribeAudio(blob);
    transcriptEl.textContent = `"${text}"`;

    if (!text.trim()) {
      resultEl.innerHTML = `<span class="warn">No se detectó audio claro. Intentá de nuevo.</span>`;
      return;
    }

    // 2) Parse
    resultEl.innerHTML = `<span class="info">Analizando...</span>`;
    const parsed = await parseStickersFromText(text);

    if (!parsed.stickers?.length) {
      resultEl.innerHTML = `<span class="warn">No encontré figuritas en lo que dijiste.</span>`;
      return;
    }

    // 3) Add stickers
    const added = [], alreadyHad = [];
    for (const { global: n } of parsed.stickers) {
      if (!STICKER_MAP[n]) continue;
      const prevCount = getCount(n);
      addSticker(n);
      if (prevCount === 0) added.push(n);
      else alreadyHad.push(n);
    }

    let html = "";
    if (added.length) {
      html += `<div class="result-added">
        <strong>✓ Agregadas al álbum:</strong>
        ${added.map(n => `<span class="r-tag new">#${n} ${STICKER_MAP[n]?.desc || ""}</span>`).join("")}
      </div>`;
    }
    if (alreadyHad.length) {
      html += `<div class="result-dup">
        <strong>🔁 Repetidas (+1):</strong>
        ${alreadyHad.map(n => `<span class="r-tag dup">#${n} ×${getCount(n)}</span>`).join("")}
      </div>`;
    }
    if (parsed.unknown?.length) {
      html += `<div class="result-unk">
        <strong>⚠ No entendí:</strong> ${parsed.unknown.join(", ")}
      </div>`;
    }
    resultEl.innerHTML = html;
    renderAll();
  } catch (err) {
    resultEl.innerHTML = `<span class="error">Error: ${err.message}</span>`;
    showToast(err.message, "error");
  } finally {
    recordBtn.disabled = false;
    recordBtn.querySelector("span:last-child").textContent = "Presioná para hablar";
  }
}

// ─── Filter buttons ───────────────────────────────────────────────────────────

document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderAlbum();
  });
});

// ─── Config modal (solo en modo local) ───────────────────────────────────────

const configBtn = document.getElementById("config-btn");
if (!IS_LOCAL) configBtn.style.display = "none";

function showConfigModal() {
  document.getElementById("config-modal").classList.remove("hidden");
  document.getElementById("groq-api-key").value = getApiKey();
}

function hideConfigModal() {
  document.getElementById("config-modal").classList.add("hidden");
}

document.getElementById("save-config").addEventListener("click", () => {
  const key = document.getElementById("groq-api-key").value.trim();
  localStorage.setItem("groq_api_key", key);
  hideConfigModal();
  showToast("API key guardada");
});

document.getElementById("config-modal").addEventListener("click", e => {
  if (e.target === document.getElementById("config-modal")) hideConfigModal();
});

configBtn.addEventListener("click", showConfigModal);

// ─── Export duplicates ────────────────────────────────────────────────────────

document.getElementById("export-btn").addEventListener("click", () => {
  const dups = Object.entries(state.collected)
    .filter(([, c]) => c >= 2)
    .map(([n, c]) => {
      const s = STICKER_MAP[parseInt(n)];
      return `#${n} ${s?.desc || ""} (×${c - 1} para cambiar)`;
    })
    .sort((a, b) => parseInt(a) - parseInt(b));

  if (!dups.length) { showToast("No tenés figuritas repetidas"); return; }

  const text = `Figuritas para cambiar - Mundial 2026\n${"─".repeat(40)}\n${dups.join("\n")}`;
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "repetidas-mundial-2026.txt";
  a.click();
  URL.revokeObjectURL(url);
});

// ─── Reset ────────────────────────────────────────────────────────────────────

document.getElementById("reset-btn").addEventListener("click", () => {
  if (!confirm("¿Resetear TODO el álbum? Se perderán todos los datos.")) return;
  state = { collected: {} };
  saveState();
  renderAll();
  showToast("Álbum reseteado");
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

loadState();
renderAll();

if (IS_LOCAL && !getApiKey()) {
  setTimeout(() => showConfigModal(), 500);
}

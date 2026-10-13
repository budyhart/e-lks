/* app.js v4 — E-LKS PBL: 4 E-LKS per pertemuan, profil berpikir kritis, ekspor */
const KUNCI_PG = { pg1: "B", pg2: "C", pg3: "B", pg4: "C", pg5: "B", pg6: "C", pg7: "B", pg8: "B", pg9: "C", pg10: "B" };
const PEMBAHASAN = {
  pg1: "Mawar merah/putih = variasi gen dalam satu spesies (tingkat gen).",
  pg2: "Harimau sumatera & singa Afrika = spesies berbeda (tingkat jenis).",
  pg3: "Hutan hujan vs terumbu karang = perbedaan ekosistem.",
  pg4: "Fauna tipe peralihan (Wallacea) contoh: komodo, anoa, babirusa.",
  pg5: "Konservasi in-situ = di habitat asli (TN Komodo, TN Ujung Kulon).",
  pg6: "Penyebab utama hilangnya kehati: alih fungsi habitat / deforestasi.",
  pg7: "Rafflesia arnoldii dilindungi karena endemik, langka, terancam punah.",
  pg8: "Padi IR8 vs Ciherang = satu spesies, beda varietas (tingkat gen).",
  pg9: "Ekosistem buatan: sawah, waduk, kebun, akuarium.",
  pg10: "Jamur = dinding sel kitin & heterotrof pengurai (kingdom Fungi)."
};
/* 17 tahap: 4 E-LKS (materi + tugas) + galeri */
const TAHAP = [
  ["beranda", "Beranda", "🏠"], ["identitas", "Identitas", "🧑‍🎓"], ["konteks", "Rancangan", "📋"],
  ["elks1-materi", "E-LKS 1 Materi", "📖"], ["elks1-tugas", "E-LKS 1 Tugas", "🔍"],
  ["elks2-materi", "E-LKS 2 Materi", "⚠️"], ["elks2-tugas", "E-LKS 2 Tugas", "🧪"],
  ["elks3-materi", "E-LKS 3 Materi", "🛡️"], ["elks3-tugas", "E-LKS 3 Tugas", "🌱"],
  ["elks4-materi", "E-LKS 4 Materi", "🔬"], ["elks4-tugas", "E-LKS 4 Tugas", "🧫"],
  ["kuis", "Kuis", "✍️"], ["tugas", "Isian & Uraian", "📝"], ["hasil", "Hasil", "🏆"],
  ["galeri", "Galeri", "🖼️"], ["guru", "Guru", "👩‍🏫"], ["glosarium", "Glosarium", "📚"]
];
const FORM_KEY = "elks_form_v1", VIS_KEY = "elks_visited_v1", XP_KEY = "elks_xp_v1";
const KUNCI_LAMA = { form: "elkpd_form_v2", vis: "elkpd_visited_v2", xp: "elkpd_xp_v2", tema: "elkpd_tema" };
const PH_SVG = "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#166534"/><stop offset="1" stop-color="#4ade80"/></linearGradient></defs><rect width="800" height="500" fill="url(#g)"/><text x="400" y="240" font-size="64" text-anchor="middle" fill="#ffffff">🌿</text><text x="400" y="270" font-size="26" text-anchor="middle" fill="#ffffff">Foto belum tersedia</text></svg>`);

let mulaiWaktu = null, detik = 0, xp = 0, diklaim = {};

window.addEventListener("DOMContentLoaded", () => {
  const t = document.getElementById("tgl");
  if (t && !t.value) t.valueAsDate = new Date();
  mulaiWaktu = new Date().toISOString();
  try {
    if (!localStorage.getItem(VIS_KEY) && localStorage.getItem(KUNCI_LAMA.vis)) localStorage.setItem(VIS_KEY, localStorage.getItem(KUNCI_LAMA.vis));
    if (!localStorage.getItem(FORM_KEY) && localStorage.getItem(KUNCI_LAMA.form)) localStorage.setItem(FORM_KEY, localStorage.getItem(KUNCI_LAMA.form));
    if (!localStorage.getItem(XP_KEY) && localStorage.getItem(KUNCI_LAMA.xp)) localStorage.setItem(XP_KEY, localStorage.getItem(KUNCI_LAMA.xp));
    if (!localStorage.getItem(XP_KEY + "_c") && localStorage.getItem(KUNCI_LAMA.xp + "_c")) localStorage.setItem(XP_KEY + "_c", localStorage.getItem(KUNCI_LAMA.xp + "_c"));
  } catch (e) {}
  xp = +(localStorage.getItem(XP_KEY) || 0);
  try { diklaim = JSON.parse(localStorage.getItem(XP_KEY + "_c") || "{}"); } catch (e) { diklaim = {}; }
  pulihkanForm();
  try {
    const th = localStorage.getItem("elks_tema") || localStorage.getItem(KUNCI_LAMA.tema);
    if (th) document.documentElement.setAttribute("data-theme", th);
  } catch (e) {}
  renderStepper(); renderXP(); updateNavPg();
  startTimer(); initDB();
  document.getElementById("app").addEventListener("input", () => { simpanForm(); updateNavPg(); });
  document.getElementById("app").addEventListener("change", () => { simpanForm(); updateNavPg(); });
  const f = document.getElementById("file-sqlite");
  if (f) f.addEventListener("change", e => { if (e.target.files[0]) muatSQLiteDariFile(e.target.files[0]); });
  window.addEventListener("hashchange", router);
  router();
});

/* ---------- router bertahap ---------- */
function bacaHash() {
  const h = (location.hash || "").replace("#/", "").replace("#", "");
  return TAHAP.some(t => t[0] === h) ? h : "beranda";
}
function pergi(id) { location.hash = "#/" + id; window.scrollTo({ top: 0, behavior: "smooth" }); }
function router() {
  const id = bacaHash();
  document.querySelectorAll(".stage").forEach(s => s.classList.toggle("aktif", s.dataset.stage === id));
  tandaiKunjung(id);
  renderStepper(); updateProgress();
  window.scrollTo({ top: 0 });
}
function tandaiKunjung(id) {
  try {
    const v = new Set(JSON.parse(localStorage.getItem(VIS_KEY) || "[]"));
    v.add(id);
    localStorage.setItem(VIS_KEY, JSON.stringify([...v]));
  } catch (e) {}
}
function sudahKunjung(id) {
  try { return JSON.parse(localStorage.getItem(VIS_KEY) || "[]").includes(id); } catch (e) { return false; }
}
function renderStepper() {
  const el = document.getElementById("stepper");
  if (!el) return;
  const now = bacaHash();
  el.innerHTML = TAHAP.map(([id, label, ikon], i) => {
    const cls = id === now ? "now" : (sudahKunjung(id) ? "done" : "");
    return `<button class="stp ${cls}" onclick="pergi('${id}')" title="${label}"><span class="n">${sudahKunjung(id) && id !== now ? "✓" : (i + 1)}</span>${ikon} ${label}</button>`;
  }).join("");
}
function updateProgress() {
  let v = []; try { v = JSON.parse(localStorage.getItem(VIS_KEY) || "[]"); } catch (e) {}
  const p = Math.round(v.length / TAHAP.length * 100);
  const fill = document.getElementById("progress-fill");
  const txt = document.getElementById("progress-text");
  if (fill) fill.style.width = p + "%";
  if (txt) txt.textContent = `Progres: ${v.length}/${TAHAP.length} tahap (${p}%) • ⏱ ${fmtDur()} • ⭐ ${xp} XP`;
}
function lanjutBerikutnya(idSaatIni) {
  if (idSaatIni === "identitas") {
    const n = document.getElementById("nama").value.trim();
    const k = document.getElementById("kelas").value.trim();
    if (!n || !k) { toast("Isi Nama dan Kelas dulu ya."); document.getElementById("nama").focus(); return; }
    tambahXP(5, "identitas");
  }
  const i = TAHAP.findIndex(t => t[0] === idSaatIni);
  if (i >= 0 && i < TAHAP.length - 1) pergi(TAHAP[i + 1][0]);
}
function kembaliKe(idSaatIni) {
  const i = TAHAP.findIndex(t => t[0] === idSaatIni);
  if (i > 0) pergi(TAHAP[i - 1][0]);
}

/* ---------- tema, toast, timer, gambar ---------- */
function toggleTema() {
  const d = document.documentElement;
  const next = d.getAttribute("data-theme") === "dark" ? "" : "dark";
  if (next) d.setAttribute("data-theme", next); else d.removeAttribute("data-theme");
  try { localStorage.setItem("elks_tema", next); } catch (e) {}
}
function toast(pesan) {
  const el = document.getElementById("toast");
  if (!el) return alert(pesan);
  el.textContent = pesan;
  el.classList.add("tampil");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove("tampil"), 2400);
}
function startTimer() {
  const el = document.getElementById("timer");
  setInterval(() => {
    detik++;
    const m = String(Math.floor(detik / 60)).padStart(2, "0");
    const s = String(detik % 60).padStart(2, "0");
    if (el) el.textContent = m + ":" + s;
    if (detik % 10 === 0) updateProgress();
  }, 1000);
}
function fmtDur() { return `${Math.floor(detik / 60)} mnt ${detik % 60} dtk`; }
/* fallback gambar berlapis: data-fb="url1|url2" lalu placeholder SVG */
function gfb(el) {
  const list = (el.dataset.fb || "").split("|").filter(Boolean);
  const i = +(el.dataset.fbi || 0);
  if (i < list.length) { el.dataset.fbi = i + 1; el.src = list[i]; }
  else { el.onerror = null; el.src = PH_SVG; }
}

/* ---------- autosave ---------- */
function simpanForm() {
  const data = {};
  document.querySelectorAll("#app input, #app textarea, #app select").forEach(el => {
    if (el.type === "radio" || el.type === "checkbox") {
      if (el.name) data[(el.id || el.name) + (el.type === "radio" ? "::" + el.value : "")] = el.checked ? 1 : 0;
      else if (el.id) data[el.id] = el.checked ? 1 : 0;
    } else if (el.id) data[el.id] = el.value;
  });
  try { localStorage.setItem(FORM_KEY, JSON.stringify(data)); } catch (e) {}
}
function pulihkanForm() {
  let data = {}; try { data = JSON.parse(localStorage.getItem(FORM_KEY) || localStorage.getItem(KUNCI_LAMA.form) || "{}"); } catch (e) {}
  document.querySelectorAll("#app input, #app textarea, #app select").forEach(el => {
    if (el.type === "radio") {
      if (data[(el.id || el.name) + "::" + el.value]) el.checked = true;
    } else if (el.type === "checkbox") {
      if (data[el.id] || data[(el.name || "") + "::" + el.value]) el.checked = true;
    } else if (el.id && data[el.id] !== undefined) el.value = data[el.id];
  });
}

/* ---------- XP & lencana ---------- */
function tambahXP(n, kunci) {
  if (kunci) {
    if (diklaim[kunci]) { updateProgress(); return; }
    diklaim[kunci] = 1;
    try { localStorage.setItem(XP_KEY + "_c", JSON.stringify(diklaim)); } catch (e) {}
  }
  xp += n;
  try { localStorage.setItem(XP_KEY, xp); } catch (e) {}
  renderXP(); updateProgress();
}
function renderXP() {
  const bar = document.getElementById("xp-bar");
  const txt = document.getElementById("xp-text");
  const p = Math.min(100, Math.round(xp / 180 * 100));
  if (bar) bar.style.width = p + "%";
  if (txt) txt.textContent = `${xp} XP`;
  const l = document.getElementById("lencana");
  if (l) {
    const b = [];
    if (xp >= 30) b.push("🌱 Penjelajah");
    if (xp >= 70) b.push("🧭 Pengamat");
    if (xp >= 120) b.push("🛡️ Guardian Kehati");
    l.innerHTML = b.length ? b.map(x => `<span>${x}</span>`).join("") : `<span class="keterangan">Selesaikan cek pemahaman untuk meraih lencana</span>`;
  }
}

/* ---------- interaktif: tab, mini kuis, peta, lightbox ---------- */
function pilihTab(btn, grup, paneId) {
  const root = btn.closest(".card") || document;
  root.querySelectorAll(`[data-tabbtn="${grup}"]`).forEach(b => b.classList.remove("on"));
  root.querySelectorAll(`[data-tabpane="${grup}"]`).forEach(p => p.classList.remove("on"));
  btn.classList.add("on");
  const p = document.getElementById(paneId);
  if (p) p.classList.add("on");
}
function cekMini(btn) {
  const box = btn.closest(".mini");
  const kunci = box.dataset.kunci;
  const mq = box.dataset.mq;
  const pil = box.querySelector("input[type=radio]:checked");
  const fb = box.querySelector(".mini-fb");
  if (!pil) { fb.textContent = "Pilih jawaban dulu."; fb.style.color = "var(--aksen2)"; return; }
  const benar = pil.value === kunci;
  box.querySelectorAll(".pil").forEach(l => l.classList.remove("benar", "salah"));
  const lab = pil.closest(".pil");
  if (benar) {
    if (lab) lab.classList.add("benar");
    fb.textContent = "✅ Tepat! " + (box.dataset.bahas || "");
    fb.style.color = "var(--h600)";
    tambahXP(10, "mq-" + mq);
    toast("⭐ +10 XP!");
  } else {
    if (lab) lab.classList.add("salah");
    fb.textContent = "❌ Kurang tepat, baca lagi materinya lalu coba lagi.";
    fb.style.color = "#dc2626";
  }
}
function pilihZona(z) {
  document.querySelectorAll(".zona-btn").forEach(b => b.classList.toggle("on", b.dataset.zona === z));
  const info = {
    barat: "<b>Zona Barat (Asiatis)</b> — barat Garis Wallace (Sumatera, Jawa, Kalimantan, <b>Bali</b>): orangutan, harimau sumatera, gajah asia, bekantan. Ciri: mamalia besar mirip Asia daratan.",
    tengah: "<b>Zona Tengah (Wallacea / Peralihan)</b> — antara Wallace & Weber (<b>Lombok</b>, Sulawesi, Nusa Tenggara, Maluku): rusa, babi hutan, kuskus, maleo, komodo (timur). Ciri: campuran + endemik unik!",
    timur: "<b>Zona Timur (Australis)</b> — timur Garis Weber (Papua): cendrawasih, kasuari, kanguru pohon, kakatua. Ciri: berkantung & burung warna-warni mirip Australia."
  };
  const el = document.getElementById("zona-info");
  if (el) el.innerHTML = info[z];
  tambahXP(2, "zona-" + z);
}
function bukaLightbox(src, cap) {
  document.getElementById("lightbox-img").src = src;
  document.getElementById("lightbox-cap").textContent = cap || "";
  document.getElementById("lightbox").classList.add("buka");
}
function tutupLightbox() { document.getElementById("lightbox").classList.remove("buka"); }

/* ---------- identitas ---------- */
function identitas() {
  const v = id => (document.getElementById(id) || { value: "" }).value.trim();
  return { nama: v("nama"), kelas: v("kelas"), absen: v("absen"), sekolah: v("sekolah"), tanggal: v("tgl"), mulai: mulaiWaktu };
}

/* ---------- E-LKS 1: tingkat, persebaran, manfaat (bobot 10) ---------- */
function nilaiE1() {
  const g = id => ((document.getElementById(id) || { value: "" }).value);
  const q1 = document.querySelector('input[name="e1q1"]:checked')?.value || "-";
  const q3 = document.querySelector('input[name="e1q3"]:checked')?.value || "-";
  const s1 = q1 === "B" ? 2 : 0;
  const l2 = g("e1q2").toLowerCase();
  let s2 = 0;
  if (/gen/.test(l2) && /jenis/.test(l2) && /ekosistem/.test(l2)) s2 += 2;
  if (/(mawar|padi|mangga|komodo|biawak|hutan|karang|sawah|anggrek|orangutan|bekantan|durian)/.test(l2)) s2 += 1;
  if (g("e1q2").trim().length > 60) s2 += 1;
  const s3 = q3 === "C" ? 2 : 0;
  const l4 = g("e1q4").toLowerCase();
  let s4 = 0;
  if (/(wallace|garis|pemisah|selat|lombok|bali)/.test(l4)) s4 += 1;
  if (/(iklim|geograf|tanah|adaptasi|evolusi|daerah|laut|gunung)/.test(l4)) s4 += 1;
  return { skor: s1 + s2 + s3 + s4, detail: { q1, q3, q2: g("e1q2"), q4: g("e1q4"), sub: { q1: s1, q2: s2, q3: s3, q4: s4 } } };
}
function periksaE1() {
  const r = nilaiE1();
  document.getElementById("e1-feedback").innerHTML =
    `Skor sementara E-LKS 1: <b>${r.skor}/10</b>. ${r.skor >= 8 ? "Luar biasa! 🎉" : "Lengkapi: sebut gen–jenis–ekosistem + contoh + garis Wallace."}`;
  if (r.skor >= 8) tambahXP(5, "e1-bagus");
}
/* ---------- E-LKS 2: faktor hilangnya kehati (bobot 10) ---------- */
function nilaiE2() {
  const g = id => ((document.getElementById(id) || { value: "" }).value);
  const kasus = g("e2kasus");
  const tb = g("e2bukti").toLowerCase();
  const q3 = document.querySelector('input[name="e2q3"]:checked')?.value || "-";
  const s1a = kasus ? 1 : 0;
  let s1b = 0;
  ["bukti", "data", "amat", "lihat", "foto", "ukur", "catat", "sampel", "wawancara", "nyata"].forEach(k => { if (tb.includes(k)) s1b++; });
  s1b = Math.min(s1b, 3);
  if (g("e2bukti").trim().length < 10) s1b = 0;
  const td = g("e2dampak").toLowerCase();
  let s2 = 0;
  if (/(ekosistem|lingkungan|habitat|rantai|populasi|punah)/.test(td)) s2 += 1;
  if (/(manusia|ekonomi|nelayan|petani|kesehatan|makanan|pendapatan|mata pencaharian)/.test(td)) s2 += 1;
  const s3a = q3 === "B" ? 1 : 0;
  const s3b = g("e2asumsi").trim().length > 15 ? 1 : 0;
  const tt = g("e2tindak").toLowerCase();
  let s4 = 0;
  ["cegah", "kurang", "tanam", "bersih", "hukum", "edukasi", "daur", "larang", "konservasi", "reboisasi", "pilah"].forEach(k => { if (tt.includes(k)) s4++; });
  s4 = Math.min(s4, 2);
  if (g("e2tindak").trim().length < 10) s4 = 0;
  return { skor: s1a + s1b + s2 + s3a + s3b + s4, detail: { kasus, bukti: g("e2bukti"), q3, asumsi: g("e2asumsi"), dampak: g("e2dampak"), tindak: g("e2tindak"), sub: { a: s1a + s1b, b: s2, c: s3a + s3b, d: s4 } } };
}
function periksaE2() {
  const r = nilaiE2();
  document.getElementById("e2-feedback").innerHTML =
    `Skor sementara E-LKS 2: <b>${r.skor}/10</b>. ${r.skor >= 8 ? "Analisis tajam! 🎉" : "Perkuat bukti + dampak (ekosistem & manusia) + tindakan."}`;
  if (r.skor >= 8) tambahXP(5, "e2-bagus");
}
/* ---------- E-LKS 3: pelestarian (bobot 10) ---------- */
function nilaiE3() {
  const g = id => ((document.getElementById(id) || { value: "" }).value);
  const ta = g("e3ancam").toLowerCase();
  let s1 = 0;
  ["alih fungsi", "buru", "sampah", "cemar", "iklim", "invasif", "tebang", "monokultur", "limbah", "kebakaran"].forEach(k => { if (ta.includes(k)) s1++; });
  s1 = Math.min(s1, 2);
  if (g("e3ancam").trim().length < 10) s1 = 0;
  const tb = g("e3banding").toLowerCase();
  let s2 = 0;
  if (/in.situ/.test(tb)) s2 += 1;
  if (/ex.situ/.test(tb)) s2 += 1;
  if (/(kelebih|kekurang|keterbatas|banding|contoh|taman nasional|kebun)/.test(tb)) s2 += 1;
  const q3 = document.querySelector('input[name="e3q3"]:checked')?.value || "-";
  const s3a = q3 === "C" ? 2 : 0;
  const s3b = g("e3alasan").trim().length > 20 ? 1 : 0;
  const td = g("e3peran").toLowerCase();
  let s4 = 0;
  ["tanam", "bersih", "edukasi", "hemat", "lapor", "pilah", "sampah", "pohon", "pantai", "sosialisasi"].forEach(k => { if (td.includes(k)) s4++; });
  s4 = Math.min(s4, 2);
  if (g("e3peran").trim().length < 10) s4 = 0;
  return { skor: s1 + s2 + s3a + s3b + s4, detail: { ancam: g("e3ancam"), banding: g("e3banding"), q3, alasan: g("e3alasan"), peran: g("e3peran"), sub: { q1: s1, q2: s2, q3a: s3a, q3b: s3b, q4: s4 } } };
}
function periksaE3() {
  const r = nilaiE3();
  document.getElementById("e3-feedback").innerHTML =
    `Skor sementara E-LKS 3: <b>${r.skor}/10</b>. ${r.skor >= 8 ? "Calon konservasionis! 🎉" : "Bandingkan in-situ vs ex-situ + pilih solusi beralasan."}`;
  if (r.skor >= 8) tambahXP(5, "e3-bagus");
}
/* ---------- E-LKS 4: klasifikasi (bobot 10) ---------- */
const KUNCI_KINGDOM = { k_bakteri: "Monera", k_jamur: "Fungi", k_lumut: "Plantae", k_paku: "Plantae", k_mawar: "Plantae", k_kucing: "Animalia" };
function nilaiE4() {
  const g = id => ((document.getElementById(id) || { value: "" }).value);
  const q1 = document.querySelector('input[name="e4q1"]:checked')?.value || "-";
  const s1 = q1 === "B" ? 2 : 0;
  const tk = g("e4kunci").toLowerCase();
  let s2 = 0;
  if (/(1a|1b|2a|2b|ya\/tidak|ya atau tidak|jika.*maka)/.test(tk)) s2 += 1;
  const ciri = ["dinding sel", "klorofil", "spora", "biji", "bunga", "susu", "tulang", "prokariot", "eukariot"].filter(k => tk.includes(k)).length;
  if (ciri >= 2) s2 += 1;
  if (g("e4kunci").trim().length > 40) s2 += 1;
  let benar = 0; const dKing = {};
  for (const [id, kunci] of Object.entries(KUNCI_KINGDOM)) {
    const v = g(id);
    dKing[id] = v || "-";
    if (v === kunci) benar++;
  }
  const s3 = Math.round(benar * 0.5 * 10) / 10;
  const tt = g("e4takson").toLowerCase();
  let s4 = 0;
  if (/(takson|kelompok|tingkat)/.test(tt)) s4 += 1;
  if (/(kingdom|filum|divisio|kelas|ordo|famili|genus|spesies|nama ilmiah)/.test(tt)) s4 += 1;
  return { skor: s1 + s2 + s3 + s4, detail: { q1, kunci: g("e4kunci"), kingdom: dKing, takson: g("e4takson"), sub: { q1: s1, q2: s2, q3: s3, q4: s4 } } };
}
function periksaE4() {
  const r = nilaiE4();
  document.getElementById("e4-feedback").innerHTML =
    `Skor sementara E-LKS 4: <b>${r.skor}/10</b>. Kunci: bakteri→Monera, jamur→Fungi, lumut/paku/mawar→Plantae, kucing→Animalia.`;
  if (r.skor >= 8) tambahXP(5, "e4-bagus");
}

/* ---------- kuis PG (10 × 4 = 40) ---------- */
function nilaiPG() {
  let benar = 0; const d = {};
  for (const [k, kunci] of Object.entries(KUNCI_PG)) {
    const el = document.querySelector(`input[name="${k}"]:checked`);
    const j = el ? el.value : "-";
    d[k] = { jawab: j, kunci, betul: j === kunci };
    if (j === kunci) benar++;
    document.querySelectorAll(`input[name="${k}"]`).forEach(r => {
      const lab = r.closest(".pil"); if (!lab) return;
      lab.classList.remove("benar", "salah");
      if (r.value === kunci) lab.classList.add("benar");
      else if (r.checked) lab.classList.add("salah");
    });
  }
  return { benar, skor: benar * 4, detail: d };
}
function nilaiIsian() {
  const g = id => (document.getElementById(id) || { value: "" }).value;
  const i1 = g("isian1").toLowerCase(), i2 = g("isian2").toLowerCase();
  let s1 = 0, s2 = 0;
  if (/gen/.test(i1)) s1 = 5; else if (i1.trim().length > 2) s1 = 2;
  if (/wallacea|peralihan|tengah/.test(i2)) s2 = 5; else if (i2.trim().length > 2) s2 = 2;
  return { skor: s1 + s2, detail: { isian1: g("isian1"), isian2: g("isian2"), s1, s2 } };
}
function nilaiUraian() {
  const g = id => ((document.getElementById(id) || { value: "" }).value);
  const u1 = g("uraian1").toLowerCase(), u2 = g("uraian2").toLowerCase();
  let a = 0;
  if (/in.situ|habitat asli/.test(u1)) a += 1;
  if (/ex.situ/.test(u1)) a += 1;
  if (/taman nasional|kebun binatang|bank benih|penangkaran|kebun raya|komodo|ujung kulon/.test(u1)) a += 1;
  if (u1.trim().length > 40) a += 1;
  if (u1.trim().length > 100) a += 1;
  let b = 0;
  const ancaman = ["deforestasi", "alih fungsi", "perburuan", "pencemaran", "tambang", "kebakaran", "invasif", "iklim"].filter(k => u2.includes(k)).length;
  b += Math.min(ancaman, 3);
  const solusi = ["reboisasi", "konservasi", "hukum", "ekowisata", "edukasi", "3r", "tanam"].filter(k => u2.includes(k)).length;
  b += Math.min(solusi, 2);
  b = Math.min(b, 5);
  return { skor: Math.min(a, 5) + b, detail: { uraian1: g("uraian1"), uraian2: g("uraian2"), sU1: Math.min(a, 5), sU2: b } };
}

/* ---------- kuis navigator ---------- */
function navPg(n) {
  const target = document.getElementById("soal-pg" + n);
  if (target) { target.scrollIntoView({ behavior: "smooth", block: "center" }); target.style.boxShadow = "0 0 0 3px var(--aksen)"; setTimeout(() => target.style.boxShadow = "", 1200); }
}
function updateNavPg() {
  const grid = document.getElementById("nav-pg-grid");
  const prog = document.getElementById("pg-progress");
  if (!grid) return;
  let terjawab = 0;
  grid.innerHTML = Object.keys(KUNCI_PG).map((k, i) => {
    const ada = !!document.querySelector(`input[name="${k}"]:checked`);
    if (ada) terjawab++;
    const ragu = document.getElementById("ragu" + (i + 1))?.checked;
    return `<button class="${ada ? "isi" : ""} ${ragu && !ada ? "ragu" : ""}" onclick="navPg(${i + 1})">${i + 1}</button>`;
  }).join("");
  if (prog) prog.textContent = `${terjawab}/10 terjawab`;
}

/* ---------- profil berpikir kritis ---------- */
const ASPEK_DEF = [
  { id: "interpretasi", label: "Interpretasi", desc: "Memahami & mengklarifikasi makna (E-LKS 1 + E-LKS 4 takson + Isian)" },
  { id: "analisis", label: "Analisis", desc: "Menganalisis hubungan (E-LKS 2 + E-LKS 4 + PG 1,2,3,8,9,10)" },
  { id: "evaluasi", label: "Evaluasi", desc: "Menilai kebenaran & solusi (E-LKS 1 & 3 + PG 4,5,6,7)" },
  { id: "inferensi", label: "Inferensi", desc: "Menarik simpulan & aksi (E-LKS 1–3 + Uraian 14)" },
  { id: "eksplanasi", label: "Eksplanasi", desc: "Menjelaskan runtut (Uraian 13)" }
];
function katAspek(p) { return p >= 85 ? "Sangat Kritis" : p >= 75 ? "Kritis" : p >= 60 ? "Cukup Kritis" : "Kurang Kritis"; }
function hitungAspek(e1, e2, e3, e4, pg, is, ur) {
  const pgB = n => (pg.detail["pg" + n] && pg.detail["pg" + n].betul) ? 4 : 0;
  const parts = [
    { id: "interpretasi", dapat: e1.detail.sub.q1 + e1.detail.sub.q2 + e4.detail.sub.q4 + is.detail.s1 + is.detail.s2, maks: 18 },
    { id: "analisis", dapat: e2.detail.sub.a + e2.detail.sub.b + e4.detail.sub.q1 + e4.detail.sub.q2 + e4.detail.sub.q3 + pgB(1) + pgB(2) + pgB(3) + pgB(8) + pgB(9) + pgB(10), maks: 38 },
    { id: "evaluasi", dapat: e1.detail.sub.q3 + e2.detail.sub.c + e3.detail.sub.q1 + e3.detail.sub.q2 + e3.detail.sub.q3a + pgB(4) + pgB(5) + pgB(6) + pgB(7), maks: 27 },
    { id: "inferensi", dapat: e1.detail.sub.q4 + e2.detail.sub.d + e3.detail.sub.q3b + e3.detail.sub.q4 + ur.detail.sU2, maks: 12 },
    { id: "eksplanasi", dapat: ur.detail.sU1, maks: 5 }
  ];
  return parts.map(p => {
    const def = ASPEK_DEF.find(d => d.id === p.id);
    const pct = Math.round(p.dapat / p.maks * 100);
    return { ...def, dapat: Math.round(p.dapat * 10) / 10, maks: p.maks, pct, kategori: katAspek(pct) };
  });
}

/* ---------- hitung & hasil ---------- */
function hitungNilai() {
  const iden = identitas();
  if (!iden.nama || !iden.kelas) { toast("Isi Nama dan Kelas dulu."); pergi("identitas"); return; }
  const e1 = nilaiE1(), e2 = nilaiE2(), e3 = nilaiE3(), e4 = nilaiE4();
  const pg = nilaiPG(), is = nilaiIsian(), ur = nilaiUraian();
  const total = Math.min(100, Math.round((e1.skor + e2.skor + e3.skor + e4.skor + pg.skor + is.skor + ur.skor) * 10) / 10);
  const predikat = total >= 90 ? "A (Sangat Baik)" : total >= 80 ? "B (Baik)" : total >= 70 ? "C (Cukup)" : "D (Perlu Bimbingan)";
  const ref = {
    skala: (document.getElementById("ref1") || { value: "" }).value,
    kesan: (document.getElementById("ref2") || { value: "" }).value,
    aksi: (document.getElementById("ref3") || { value: "" }).value
  };
  const skor = {
    e1: e1.skor, e2: e2.skor, e3: e3.skor, e4: e4.skor, pg: pg.skor, isian: is.skor, uraian: ur.skor, total, predikat,
    detail: { e1, e2, e3, e4, pg: pg.detail, isian: is.detail, uraian: ur.detail, refleksi: ref, durasi: fmtDur(), xp, aspek: hitungAspek(e1, e2, e3, e4, pg, is, ur) }
  };
  window._terakhir = { iden, skor };
  tampilHasil(iden, skor, pg);
  simpanHasilDB(iden, skor);
  tambahXP(10, "selesai-" + Date.now());
  if (total >= 75) confetti();
  else toast("Belum tuntas — pelajari pembahasan lalu coba lagi.");
}
function tampilHasil(iden, skor, pg) {
  const lulus = skor.total >= 75;
  document.getElementById("hasil-ringkas").innerHTML = `
    <p class="nilai-besar">${skor.total}</p>
    <div class="${lulus ? "lulus" : "remed"}">${lulus ? "🎉 TUNTAS — Pertahankan!" : "💪 BELUM TUNTAS — KKM 75. Pelajari pembahasan."}</div>
    <table class="tabel">
      <tr><th>Nama</th><td>${esc(iden.nama)} — Kelas ${esc(iden.kelas)} (${esc(iden.absen || "-")})</td></tr>
      <tr><th>Sekolah / Tgl</th><td>${esc(iden.sekolah || "-")} / ${esc(iden.tanggal)}</td></tr>
      <tr><th>Rincian (maks 100)</th><td>E-LKS 1: ${skor.e1} • E-LKS 2: ${skor.e2} • E-LKS 3: ${skor.e3} • E-LKS 4: ${skor.e4} • PG: ${skor.pg} (benar ${pg.benar}/10) • Isian: ${skor.isian} • Uraian: ${skor.uraian}</td></tr>
      <tr><th>Predikat</th><td>${esc(skor.predikat)} — Durasi ${esc(fmtDur())} — ⭐ ${xp} XP</td></tr>
    </table>
    <h3>📊 Profil Kemampuan Berpikir Kritis</h3>
    ${(skor.detail.aspek || []).map(a => `<div style="margin:.45rem 0"><b>${a.label}</b> — ${a.dapat}/${a.maks} = <b>${a.pct}</b> (${a.kategori})<div class="xp"><i style="width:${a.pct}%"></i></div><span class="keterangan">${a.desc}</span></div>`).join("")}
    <p class="keterangan">Regulasi diri dilatih lewat Refleksi. Kategori: ≥85 Sangat Kritis • 75–84 Kritis • 60–74 Cukup Kritis • &lt;60 Kurang Kritis.</p>
    <h3>Pembahasan PG</h3>
    <ol>${Object.entries(PEMBAHASAN).map(([k, v]) => `<li><b>${KUNCI_PG[k]}.</b> ${v} <i>(jawabanmu: ${pg.detail[k].jawab})</i></li>`).join("")}</ol>`;
  isiCetak(iden, skor, pg);
}
function isiCetak(iden, skor, pg) {
  const ringkas = d => esc(JSON.stringify(d));
  document.getElementById("cetak").innerHTML = `
    <h1>E-LKS Keanekaragaman Hayati Berbasis PBL — Hasil Peserta Didik</h1>
    <p>Biologi Kelas X • MAN Lombok Barat • Problem Based Learning & Berpikir Kritis</p><hr>
    <table>
      <tr><th>Nama</th><td>${esc(iden.nama)}</td><th>Kelas/Absen</th><td>${esc(iden.kelas)} / ${esc(iden.absen || "-")}</td></tr>
      <tr><th>Sekolah</th><td>${esc(iden.sekolah || "-")}</td><th>Tanggal</th><td>${esc(iden.tanggal)}</td></tr>
      <tr><th>Nilai Akhir</th><td><b>${skor.total} (${esc(skor.predikat)})</b></td><th>Durasi</th><td>${esc(fmtDur())}</td></tr>
    </table>
    <h3>Rincian Nilai</h3>
    <table><tr><th>E-LKS 1</th><th>E-LKS 2</th><th>E-LKS 3</th><th>E-LKS 4</th><th>PG</th><th>Isian</th><th>Uraian</th><th>Total</th></tr>
    <tr><td>${skor.e1}</td><td>${skor.e2}</td><td>${skor.e3}</td><td>${skor.e4}</td><td>${skor.pg}</td><td>${skor.isian}</td><td>${skor.uraian}</td><td><b>${skor.total}</b></td></tr></table>
    <h3>Profil Berpikir Kritis</h3>
    <table><tr><th>Aspek</th><th>Skor</th><th>%</th><th>Kategori</th></tr>
    ${(skor.detail.aspek || []).map(a => `<tr><td>${a.label}</td><td>${a.dapat}/${a.maks}</td><td>${a.pct}</td><td>${a.kategori}</td></tr>`).join("")}</table>
    <h3>Jawaban PG vs Kunci</h3>
    <table><tr><th>No</th><th>Jawab</th><th>Kunci</th><th>Status</th></tr>
    ${Object.entries(pg.detail).map(([k, v], i) => `<tr><td>${i + 1}</td><td>${v.jawab}</td><td>${v.kunci}</td><td>${v.betul ? "Benar" : "Salah"}</td></tr>`).join("")}</table>
    <h3>E-LKS, Isian & Uraian</h3>
    <p><b>E-LKS 1:</b> ${ringkas(skor.detail.e1.detail)}<br><b>E-LKS 2:</b> ${ringkas(skor.detail.e2.detail)}<br><b>E-LKS 3:</b> ${ringkas(skor.detail.e3.detail)}<br><b>E-LKS 4:</b> ${ringkas(skor.detail.e4.detail)}</p>
    <p><b>Isian 1:</b> ${esc(skor.detail.isian.isian1)}<br><b>Isian 2:</b> ${esc(skor.detail.isian.isian2)}</p>
    <p><b>Uraian 1:</b> ${esc(skor.detail.uraian.uraian1)}<br><b>Uraian 2:</b> ${esc(skor.detail.uraian.uraian2)}</p>
    <br><br><table><tr><th style="width:50%">Siswa,<br><br><br>(${esc(iden.nama)})</th><th>Guru,<br><br><br>(....................)</th></tr></table>`;
}

/* ---------- ekspor ---------- */
function cetakPDF() { if (!window._terakhir) return toast("Hitung nilai dulu."); window.print(); }
function unduhCSV() {
  let rows = [["nama", "kelas", "absen", "sekolah", "tanggal", "elks1", "elks2", "elks3", "elks4", "pg", "isian", "uraian", "total", "predikat", "interpretasi", "analisis", "evaluasi", "inferensi", "eksplanasi", "waktu"]];
  const aspekDari = dj => {
    try {
      const d = JSON.parse(dj || "{}");
      const g = id => { const a = (d.aspek || []).find(x => x.id === id); return a ? a.pct : ""; };
      return [g("interpretasi"), g("analisis"), g("evaluasi"), g("inferensi"), g("eksplanasi")];
    } catch (e) { return ["", "", "", "", ""]; }
  };
  try {
    q("SELECT s.nama,s.kelas,s.absen,s.sekolah,s.tanggal,h.skor_k1,h.skor_k2,h.skor_k3,h.skor_k4,h.skor_pg,h.skor_isian,h.skor_uraian,h.total,h.predikat,h.detail_json,h.dibuat FROM hasil h JOIN siswa s ON s.id=h.siswa_id ORDER BY h.id")
      .forEach(r => rows.push([r.nama, r.kelas, r.absen, r.sekolah, r.tanggal, r.skor_k1, r.skor_k2, r.skor_k3, r.skor_k4, r.skor_pg, r.skor_isian, r.skor_uraian, r.total, r.predikat, ...aspekDari(r.detail_json), r.dibuat]));
  } catch (e) {
    try {
      q("SELECT s.nama,s.kelas,s.absen,s.sekolah,s.tanggal,h.total,h.predikat,h.detail_json,h.dibuat FROM hasil h JOIN siswa s ON s.id=h.siswa_id ORDER BY h.id")
        .forEach(r => rows.push([r.nama, r.kelas, r.absen, r.sekolah, r.tanggal, "", "", "", "", "", "", r.total, r.predikat, ...aspekDari(r.detail_json), r.dibuat]));
    } catch (e2) {}
  }
  const csv = rows.map(r => r.map(c => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  unduhBlob(new Blob(["\ufeff" + csv], { type: "text/csv" }), "rekap-nilai-lks-kehati.csv");
}
function unduhJSON() {
  if (!window._terakhir) return toast("Hitung nilai dulu.");
  unduhBlob(new Blob([JSON.stringify(window._terakhir, null, 2)], { type: "application/json" }), `hasil-lks-${window._terakhir.iden.nama || "siswa"}.json`);
}
function unduhHasilHTML() {
  if (!window._terakhir) return toast("Hitung nilai dulu.");
  const html = `<!doctype html><html lang="id"><meta charset="utf-8"><title>Hasil E-LKS</title><body>${document.getElementById("cetak").innerHTML}</body></html>`;
  unduhBlob(new Blob([html], { type: "text/html" }), `hasil-lks-${(window._terakhir.iden.nama || "siswa").replace(/\s+/g, "-")}.html`);
}
function resetJawaban() {
  if (!confirm("Hapus semua jawaban & jejak belajar di perangkat ini?")) return;
  localStorage.removeItem(FORM_KEY); localStorage.removeItem(VIS_KEY);
  try { localStorage.removeItem(KUNCI_LAMA.form); localStorage.removeItem(KUNCI_LAMA.vis); } catch (e) {}
  location.hash = "#/beranda"; location.reload();
}
function resetXP() { xp = 0; diklaim = {}; try { localStorage.removeItem(XP_KEY); localStorage.removeItem(XP_KEY + "_c"); } catch (e) {} renderXP(); }

/* ---------- confetti ---------- */
function confetti() {
  const c = document.getElementById("confetti");
  if (!c) return;
  c.width = innerWidth; c.height = innerHeight;
  const x = c.getContext("2d");
  const warna = ["#16a34a", "#facc15", "#fb923c", "#38bdf8", "#ec4899"];
  const p = Array.from({ length: 140 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * 100, w: 6 + Math.random() * 6, h: 8 + Math.random() * 8, v: 2 + Math.random() * 3, r: Math.random() * Math.PI, c: warna[Math.random() * warna.length | 0] }));
  let f = 0;
  (function anim() {
    x.clearRect(0, 0, c.width, c.height);
    p.forEach(o => { o.y += o.v; o.r += .05; x.save(); x.translate(o.x, o.y); x.rotate(o.r); x.fillStyle = o.c; x.fillRect(0, 0, o.w, o.h); x.restore(); });
    if (++f < 160) requestAnimationFrame(anim); else x.clearRect(0, 0, c.width, c.height);
  })();
}

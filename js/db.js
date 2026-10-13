/* db.js — SQLite client-side via sql.js (WASM). Siap GitHub Pages. Skema v2. */
let SQL = null;
let db = null;
const LS_KEY = "elks_sqlite_b64_v1";
const LS_LAMA = ["elkpd_kehati_sqlite_b64_v2", "elkpd_kehati_sqlite_b64_v1"];

const SKEMA = `
CREATE TABLE IF NOT EXISTS siswa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nama TEXT NOT NULL,
  kelas TEXT NOT NULL,
  absen TEXT,
  sekolah TEXT,
  tanggal TEXT,
  mulai TEXT,
  selesai TEXT
);
CREATE TABLE IF NOT EXISTS hasil (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  siswa_id INTEGER NOT NULL,
  skor_pg REAL DEFAULT 0, skor_k1 REAL DEFAULT 0,
  skor_k2 REAL DEFAULT 0, skor_k3 REAL DEFAULT 0, skor_k4 REAL DEFAULT 0,
  skor_isian REAL DEFAULT 0, skor_uraian REAL DEFAULT 0,
  total REAL, predikat TEXT,
  detail_json TEXT,
  dibuat TEXT,
  FOREIGN KEY(siswa_id) REFERENCES siswa(id)
);`;

function migrasi() {
  // Untuk database lama yang belum punya kolom skor_k2/skor_k3/skor_k4
  ["skor_k2", "skor_k3", "skor_k4"].forEach(k => {
    try { db.run(`ALTER TABLE hasil ADD COLUMN ${k} REAL DEFAULT 0`); } catch (e) { /* sudah ada */ }
  });
}

async function initDB() {
  const status = document.getElementById("db-status");
  try {
    if (!window.initSqlJs) throw new Error("sql.js belum termuat (perlu internet sekali untuk CDN).");
    SQL = await window.initSqlJs({
      locateFile: f => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${f}`
    });
    const b64 = localStorage.getItem(LS_KEY) || LS_LAMA.map(k => { try { return localStorage.getItem(k); } catch (e) { return null; } }).find(Boolean);
    if (b64) {
      try {
        const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
        db = new SQL.Database(bin);
      } catch (e) { db = new SQL.Database(); }
    } else {
      db = new SQL.Database();
    }
    db.run(SKEMA);
    migrasi();
    persistDB();
    if (status) status.textContent = "Simpanan nilai siap ✓";
    renderRekap();
  } catch (e) {
    console.error(e);
    if (status) status.textContent = "Simpanan nilai gagal disiapkan — tapi nilai tetap bisa dicetak.";
  }
}

function persistDB() {
  if (!db) return;
  try {
    const data = db.export();
    let bin = "";
    const CH = 0x8000;
    for (let i = 0; i < data.length; i += CH) {
      bin += String.fromCharCode.apply(null, data.subarray(i, i + CH));
    }
    localStorage.setItem(LS_KEY, btoa(bin));
  } catch (e) { console.warn("persist gagal", e); }
}

function q(sql, params = []) {
  const st = db.prepare(sql);
  st.bind(params);
  const out = [];
  while (st.step()) out.push(st.getAsObject());
  st.free();
  return out;
}

function simpanHasilDB(identitas, skor) {
  if (!db) return null;
  db.run(SKEMA);
  migrasi();
  const now = new Date().toISOString();
  db.run("INSERT INTO siswa (nama,kelas,absen,sekolah,tanggal,mulai,selesai) VALUES (?,?,?,?,?,?,?)",
    [identitas.nama, identitas.kelas, identitas.absen, identitas.sekolah, identitas.tanggal, identitas.mulai, now]);
  const siswaId = q("SELECT last_insert_rowid() AS id")[0].id;
  db.run("INSERT INTO hasil (siswa_id,skor_pg,skor_k1,skor_k2,skor_k3,skor_k4,skor_isian,skor_uraian,total,predikat,detail_json,dibuat) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
    [siswaId, skor.pg, skor.e1 ?? skor.k1, skor.e2 ?? skor.k2, skor.e3 ?? skor.k3, skor.e4 ?? 0, skor.isian, skor.uraian, skor.total, skor.predikat, JSON.stringify(skor.detail), now]);
  persistDB();
  renderRekap();
  return siswaId;
}

function renderRekap() {
  const el = document.getElementById("rekap-body");
  const jml = document.getElementById("rekap-jumlah");
  if (!el || !db) return;
  try {
    const rows = q(`SELECT h.total,h.predikat,h.dibuat,s.nama,s.kelas,s.sekolah
      FROM hasil h JOIN siswa s ON s.id=h.siswa_id ORDER BY h.id DESC LIMIT 100`);
    if (jml) jml.textContent = rows.length + " nilai tersimpan di perangkat ini.";
    el.innerHTML = rows.length ? rows.map(r =>
      `<tr><td>${esc(r.nama)}</td><td>${esc(r.kelas)}</td><td>${esc(r.sekolah || "-")}</td><td><b>${r.total}</b></td><td>${esc(r.predikat)}</td><td>${esc((r.dibuat || "").slice(0, 16).replace("T", " "))}</td></tr>`
    ).join("") : `<tr><td colspan="6">Belum ada nilai. Selesaikan semua E-LKS lalu klik “Hitung Nilai & Simpan”.</td></tr>`;
  } catch (e) { el.innerHTML = `<tr><td colspan="6">Gagal membaca nilai.</td></tr>`; }
}

function unduhSQLite() {
  if (!db) return alert("Bank Data belum siap.");
  const data = db.export();
  const blob = new Blob([data], { type: "application/x-sqlite3" });
  unduhBlob(blob, "e-lks-kehati.sqlite");
}

function unduhBlob(blob, nama) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nama;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
}

function muatSQLiteDariFile(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const u8 = new Uint8Array(r.result);
      db = new SQL.Database(u8);
      db.run(SKEMA);
      migrasi();
      persistDB(); renderRekap();
      toast("Bank Data berhasil dibuka.");
    } catch (e) { alert("Gagal membuka Bank Data."); }
  };
  r.readAsArrayBuffer(file);
}

function hapusDB() {
  if (!confirm("Hapus semua nilai yang tersimpan di perangkat ini?")) return;
  localStorage.removeItem(LS_KEY);
  try { LS_LAMA.forEach(k => localStorage.removeItem(k)); } catch (e) {}
  db = new SQL.Database();
  db.run(SKEMA); persistDB(); renderRekap();
}

function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

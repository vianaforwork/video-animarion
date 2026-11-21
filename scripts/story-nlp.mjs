// Context reading of an Indonesian narration script (used by scripts/analyze.mjs).
// Not a word-list scan: every sentence is read with its quotes, clauses, negation, conditionals and screens;
// words are reduced to their roots (me-/ber-/di-/ter- … -kan/-i/-nya), pronouns and "-nya" are resolved to the
// last person / thing, so the result says WHO does WHAT to WHICH object, and whether it really happens on screen
// ("acted"), is only seen on a screen or photo, is said in dialogue, written on paper, a rule ("kalau…",
// "jangan…") or negated. Time of day comes from the story's own clock ("pukul dua lewat tiga belas" → 02.13 →
// night), not from words like "besok pagi". Unknown nouns are still reported (after determiners and prepositions),
// so a story object missing from the lexicon is never silent.
//   analyzeStory(scriptText, words, lexicon) → { sentences, characters, figures, time, locations, objects,
//     interactions, states, sounds, emotions, dialogue, texts, mentions }

const NUM = { nol: 0, satu: 1, se: 1, dua: 2, tiga: 3, empat: 4, lima: 5, enam: 6, tujuh: 7, delapan: 8, sembilan: 9, sepuluh: 10, sebelas: 11, seratus: 100 };
const PRON = new Set(["ia", "dia", "beliau", "aku", "saya", "kamu", "engkau", "mereka", "kami", "kita", "dirinya"]);
const NEG = new Set(["tidak", "tak", "belum", "jangan", "bukan", "tanpa", "nggak", "ngga", "gak", "ga", "enggak", "engga", "ndak", "nda", "tiada"]);
const COND = new Set(["kalau", "jika", "apabila", "seandainya", "andai", "bila", "seolah", "seakan", "seakan-akan", "seolah-olah"]);
const STATE_BEFORE = new Set(["sedang", "masih", "tetap", "sudah", "telah", "sempat"]);
const STATE_AFTER = new Set(["tanpa", "tak", "di", "seorang", "tepat", "semakin", "sendirian", "membelakangi", "menghadap", "diam", "kaku", "terpaku", "dekat"]);
const PREP_TARGET = new Set(["ke", "menuju", "kepada", "pada", "arah"]);
const PREP_PLACE = new Set(["di", "dari", "dekat", "depan", "belakang", "samping", "atas", "bawah", "dalam", "luar", "ujung", "balik", "sudut", "tengah"]);
const DET = new Set(["sebuah", "seorang", "seekor", "selembar", "sebatang", "sepasang", "satu", "beberapa", "setumpuk", "sekarung", "segelas", "sebuah"]);
const DEM = new Set(["itu", "ini", "tersebut", "tadi"]);
const SPOKEN = /^(berkata|berbisik|bertanya|menjawab|berteriak|kata|ujar|ujarnya|katanya|bisik|bisiknya|tanya|tanyanya|jawab|jawabnya|sahut|seru|teriak|suara|suaranya|terdengar|memanggil|bergumam|gumam)$/;
const WRITTEN = /^(tertulis|bertuliskan|tulisan|kalimat|pesan|pesannya|surat|catatan|layar|kertas|baris|judul|daftar|notifikasi|berbunyi:?)$/;
const SCREEN = new Set(["layar", "foto", "rekaman", "cctv", "monitor", "video", "gambar", "cermin", "potret", "spion", "pantulan"]);

export const lower = (w) => w.toLowerCase().replace(/[^\p{L}\p{N}-]/gu, "");

// candidate roots of a word, most literal first
export function roots(w) {
  const n = lower(w);
  const out = [n];
  const add = (x) => { if (x.length >= 3 && !out.includes(x)) out.push(x); };
  const bases = [n];
  for (const s of ["nya", "lah", "kah", "mu", "ku", "pun"]) if (n.endsWith(s) && n.length - s.length >= 3) bases.push(n.slice(0, -s.length));
  for (const b of bases) {
    add(b);
    const forms = [b];
    for (const s of ["kan", "an", "i"]) if (b.endsWith(s) && b.length - s.length >= 3) forms.push(b.slice(0, -s.length));
    for (const f of forms) {
      add(f);
      const pre = (p) => f.startsWith(p) ? f.slice(p.length) : null;
      let r;
      if ((r = pre("memper"))) add(r);
      if ((r = pre("meny"))) { add("s" + r); add("ny" + r); }
      if ((r = pre("meng"))) { add(r); add("k" + r); }
      if ((r = pre("mem"))) { add(r); add("p" + r); }
      if ((r = pre("men"))) { add(r); add("t" + r); }
      if ((r = pre("me"))) add(r);
      if ((r = pre("ber"))) add(r);
      if ((r = pre("be"))) add(r);
      if ((r = pre("ter"))) add(r);
      if ((r = pre("di"))) add(r);
      if ((r = pre("ke"))) add(r);
      if ((r = pre("se"))) add(r);
      if ((r = pre("peng"))) add(r);
      if ((r = pre("pem"))) { add(r); add("p" + r); }
      if ((r = pre("pen"))) { add(r); add("t" + r); }
      if ((r = pre("pe"))) add(r);
    }
  }
  return out;
}
// nouns only lose clitics ("laptopnya" → laptop), never verb affixes ("berjalan" must not become the place "jalan")
export function nounRoots(w) {
  const n = lower(w), out = [n];
  const red = /^(\p{L}+)-\1$/u.exec(n); if (red) out.push(red[1]); // "lampu-lampu" → lampu
  for (const s of ["nya", "mu", "ku", "lah"]) if (n.endsWith(s) && n.length - s.length >= 3) out.push(n.slice(0, -s.length));
  return out;
}
const look = (table, w) => { for (const r of roots(w)) if (table[r] !== undefined) return { key: r, value: table[r] }; return null; };
const lookN = (table, w) => { for (const r of nounRoots(w)) if (table[r] !== undefined) return { key: r, value: table[r] }; return null; };

function numberAt(toks, i) {
  // "dua", "tiga belas", "dua puluh tiga", "13", "02.13" → { value, minutes?, next }
  const t = toks[i]?.n;
  if (!t) return null;
  const dig = /^(\d{1,2})(?:[.:](\d{2}))?$/.exec(t.replace(/[^\d.:]/g, ""));
  if (dig && /\d/.test(t)) return { value: Number(dig[1]), minutes: dig[2] !== undefined ? Number(dig[2]) : undefined, next: i + 1 };
  if (NUM[t] === undefined) return null;
  let v = NUM[t], k = i + 1;
  if (toks[k]?.n === "belas") { v += 10; k++; }
  else if (toks[k]?.n === "puluh") { v *= 10; k++; if (NUM[toks[k]?.n] !== undefined && NUM[toks[k].n] < 10) { v += NUM[toks[k].n]; k++; } }
  return { value: v, next: k };
}

export function analyzeStory(script, words, LEX) {
  const L = (k) => LEX[k] ?? {};
  // ── tokens with sentence, clause, quote and paragraph info ──
  const toks = [];
  let inQuote = false, para = 0, sent = 0, clause = 0;
  const lines = script.replace(/\r/g, "").split("\n");
  for (const line of lines) {
    if (!line.trim()) { para++; continue; }
    for (const raw of line.trim().split(/\s+/)) {
      // a token without letters or digits ("—", "–") carries no sound and no word in words.json: it only ends a clause
      if (!/[\p{L}\p{N}]/u.test(raw)) { if (/[—–-]/.test(raw)) clause++; continue; }
      const opens = /^["“]/.test(raw), closes = /["”]$/.test(raw.replace(/[.,!?…]+$/, "")) || /["”][.,!?…]*$/.test(raw);
      if (opens) inQuote = true;
      const w = raw.replace(/^["“(]+/, "");
      const t = { w: raw, clean: w.replace(/["”)]+$/, "").replace(/[.,!?…;:]+$/, "").replace(/["”)]+$/, ""), n: lower(w), quote: inQuote, para, sent, clause, i: toks.length };
      t.cap = /^\p{Lu}/u.test(t.clean);
      toks.push(t);
      if (closes && !(opens && raw.length < 3)) inQuote = false;
      const end = /(\.\.\.|…|[.!?])["”]?$/.test(raw);
      if (end || /[,;:]["”]?$/.test(raw)) clause++;
      if (end) sent++;
    }
    // a line break ends a sentence even without punctuation
    if (toks.length && toks.at(-1).sent === sent) { sent++; clause++; }
  }
  // conjunctions start a new clause: "…mendekat, lalu mengambilnya"
  for (const t of toks) if (/^(lalu|kemudian|sambil|dan|sementara|hingga|sampai|ketika|saat|setelah|sebelum)$/.test(t.n)) { const c = t.clause; for (let k = t.i; k < toks.length && toks[k].clause === c; k++) toks[k].clause = c + 0.5; }
  // times: words.json is the script in order (both transcribe modes keep the script's words)
  const times = words.map((w) => (Array.isArray(w) ? w : [w.w ?? w.word, w.t0 ?? w.start, w.t1 ?? w.end]));
  const sameCount = times.length === toks.length;
  toks.forEach((t, k) => { const w = sameCount ? times[k] : times[Math.round((k * (times.length - 1)) / Math.max(1, toks.length - 1))]; t.t = w ? Math.round(w[1] * 100) / 100 : 0; });
  const nS = sent;
  const sentToks = Array.from({ length: nS }, () => []);
  for (const t of toks) sentToks[t.sent]?.push(t);
  const sentences = sentToks.filter((s) => s.length).map((s) => ({ i: s[0].sent, text: s.map((t) => t.w).join(" "), t0: s[0].t, para: s[0].para, quote: s.every((t) => t.quote) }));

  // ── lexicon hits per token (bigrams first) ──
  const objects = L("objects"), places = L("places"), roles = L("roles"), figuresL = L("figures"), stop = new Set(LEX.stop ?? []);
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k], u = toks[k + 1];
    if (u && u.sent === t.sent) {
      for (const r1 of nounRoots(t.w)) for (const r2 of nounRoots(u.w)) {
        const bi = `${r1} ${r2}`;
        if (!t.obj && objects[bi]) { t.obj = { key: bi, value: objects[bi] }; u.part = true; }
        if (!t.place && places[bi]) { t.place = { key: bi, value: places[bi] }; u.part = true; }
        if (!t.role && roles[bi]) { t.role = { key: bi, value: roles[bi] }; u.part = true; }
        if (!t.fig && figuresL[bi]) { t.fig = { key: bi }; u.part = true; }
      }
    }
    if (t.part) continue;
    t.obj ??= lookN(objects, t.w); t.place ??= lookN(places, t.w); t.role ??= lookN(roles, t.w); t.fig ??= lookN(figuresL, t.w);
  }
  // "jam" followed by a number is a time, not a clock; "jam" after a number is a duration
  const clocks = [];
  toks.forEach((t, k) => {
    if (t.n !== "jam" && t.n !== "pukul") return;
    const prev = toks[k - 1];
    if (prev && (numberAt(toks, k - 1) || prev.n === "satu" || prev.n === "beberapa")) { if (t.obj?.key === "jam") t.obj = null; return; }
    const num = numberAt(toks, k + 1);
    if (!num) return;
    if (t.obj?.key === "jam") t.obj = null;
    let h = num.value, m = num.minutes ?? 0, j = num.next;
    if (toks[j] && /^(lewat|lebih)$/.test(toks[j].n)) { const mm = numberAt(toks, j + 1); if (mm) { m = mm.value; j = mm.next; } }
    else if (toks[j]?.n === "kurang") { const mm = numberAt(toks, j + 1); if (mm) { m = 60 - mm.value; h = h - 1; j = mm.next; } }
    if (toks[j]?.n === "menit") j++;
    const part = toks[j] && /^(pagi|siang|sore|malam)$/.test(toks[j].n) ? toks[j].n : null;
    const ctx = toks.slice(Math.max(0, k - 3), k).map((x) => x.n);
    const notNow = ctx.some((x) => /^(besok|kemarin|lusa|nanti|setelah|sebelum|sejak|setiap|tiap)$/.test(x)) || toks[k].quote;
    for (let q = k + 1; q < j; q++) toks[q].num = true;
    if (part) toks[j].clockPart = true;
    clocks.push({ t: t.t, sentence: t.sent, h, m, part, rule: notNow, text: toks.slice(k, j + (part ? 1 : 0)).map((x) => x.clean).join(" ") });
  });

  // ── people: names, roles, figures, pronouns ──
  const firstOfSentence = new Set(sentToks.filter((s) => s.length).map((s) => s[0].i));
  const isVerbish = (x) => x && !PREP_PLACE.has(x.n) && !PREP_TARGET.has(x.n) && (look(L("actions"), x.w) || (/^(me|ber|ter|di)/.test(x.n) && x.n.length > 4));
  const known = (x) => x.obj || x.place || x.role || x.fig || lookN(L("time"), x.w) || look(L("emotions"), x.w) || lookN(L("sounds"), x.w) || lookN(L("actions"), x.w);
  const cand = new Map();
  for (const t of toks) {
    if (!t.cap || t.num || t.n.length < 3) continue;
    if (t.quote && (toks[t.i - 1]?.quote !== true || firstOfSentence.has(t.i))) continue;
    const base = roots(t.w).find((r) => /^\p{Ll}/u.test(r)) ?? t.n;
    const root = lower(t.clean).replace(/(nya|lah)$/, "") || base;
    if (PRON.has(root) || stop.has(root) || known(t)) continue;
    const c = cand.get(root) ?? { name: t.clean.replace(/(nya|lah)$/, ""), mid: 0, initVerb: 0, mentions: [] };
    c.mentions.push(t.t);
    const pv = toks[t.i - 1];
    const afterPrep = pv && pv.sent === t.sent && (PREP_PLACE.has(pv.n) || PREP_TARGET.has(pv.n) || /^(dunia|kota|negara|pulau|provinsi|gunung|sungai|jalan|desa|kampung|planet)$/.test(pv.n));
    if (isVerbish(toks[t.i + 1]) && toks[t.i + 1]?.sent === t.sent) c.subject = (c.subject ?? 0) + 1;
    if (afterPrep) c.prep = (c.prep ?? 0) + 1;
    if (!firstOfSentence.has(t.i) && !(t.quote && toks[t.i - 1]?.quote === false)) c.mid++;
    else if (isVerbish(toks[t.i + 1]) && toks[t.i + 1]?.sent === t.sent) c.initVerb++;
    const prev = toks[t.i - 1];
    if (prev?.role && prev.sent === t.sent) c.role = prev.role.key, c.look = prev.role.value;
    // apposition: "adiknya, Bimo" / "Laras, anaknya,"
    if (prev && /,$/.test(prev.w) && prev.role) c.role = prev.role.key, c.look = prev.role.value;
    const nx = toks[t.i + 1];
    if (/,$/.test(t.w) && nx?.role && /nya,?$/.test(nx.w)) { c.role = nx.role.key; c.look = nx.role.value; nx.appos = true; }
    cand.set(root, c);
  }
  const placeNames = [...cand.values()].filter((c) => c.prep && !c.subject && !c.role).map((c) => c.name);
  const people = [...cand.values()].filter((c) => (c.subject || c.role || (c.mid >= 1 && c.mentions.length >= 2) || c.mid - (c.prep ?? 0) >= 2 || c.initVerb >= 2) && !(c.prep && !c.subject && !c.role)).map((c) => ({ name: c.name, role: c.role, look: c.look, mentions: c.mentions, kind: "named" }));
  const named = new Map(people.map((p) => [lower(p.name), p]));
  for (const t of toks) { const p = named.get(lower(t.clean).replace(/(nya|lah)$/, "")); if (p && t.cap) t.person = p.name; }
  // unnamed roles ("seorang bapak", "ibu kos") and figures ("sosok", "seseorang", "orang lain")
  const unnamed = [];
  for (const t of toks) {
    if (t.person || t.part || t.quote || t.appos) continue;
    const nextNamed = toks[t.i + 1]?.person && toks[t.i + 1].sent === t.sent;
    const modifier = (toks[t.i - 1]?.obj || toks[t.i - 1]?.part) && toks[t.i - 1].sent === t.sent;
    if (t.role && !nextNamed && !modifier && !(t.role.key.length <= 3 && toks[t.i + 1]?.cap)) {
      const k = `role:${t.role.key}`;
      let u = unnamed.find((x) => x.id === k);
      if (!u) unnamed.push((u = { id: k, role: t.role.key, look: t.role.value, mentions: [], kind: "role" }));
      u.mentions.push(t.t); t.person = k;
    } else if (t.fig) {
      let u = unnamed.find((x) => x.kind === "figure");
      if (!u) unnamed.push((u = { id: "figure", role: t.fig.key, mentions: [], kind: "figure" }));
      u.mentions.push(t.t); t.person = "figure";
    }
  }
  const you = toks.filter((t) => /^(kamu|kau|anda|engkau)$/.test(t.n) && !t.quote).length;
  let protagonist = [...people].sort((a, b) => b.mentions.length - a.mentions.length)[0]?.name;
  if (!protagonist && you >= 3) { protagonist = "kamu"; people.push({ name: "kamu", kind: "second person", mentions: toks.filter((t) => /^(kamu|kau|anda|engkau)$/.test(t.n) && !t.quote).map((t) => t.t), note: "narrated in the second person: the viewer is the protagonist — choose a look" }); }
  if (!protagonist && toks.some((t) => /^(ia|dia)$/.test(t.n))) protagonist = "(ia/dia — unnamed)";
  if (protagonist === "kamu") for (const t of toks) if (/^(kamu|kau|anda|engkau)$/.test(t.n) && !t.quote) t.person = "kamu";
  // a figure that is the protagonist's double: "kemeja yang sama persis dengannya", "sama seperti <nama>", "suaranya sendiri"
  const fig = unnamed.find((u) => u.kind === "figure");
  if (fig && protagonist) {
    const txt = toks.map((t) => t.n).join(" ");
    const pn = lower(protagonist);
    const hints = [];
    if (/sama persis dengan(nya)?/.test(txt)) hints.push("“sama persis dengannya”");
    if (new RegExp(`(sama|persis) seperti ${pn}`).test(txt)) hints.push(`“sama seperti ${protagonist}”`);
    if (/suara(nya)? sendiri|dirinya sendiri|wajahnya sendiri/.test(txt)) hints.push("“…nya sendiri”");
    if (/(kemeja|baju|jaket|gelang|rambut)(nya)? .{0,40}(sama|persis)/.test(txt) || /(sama|persis) .{0,30}(kemeja|baju|jaket|gelang)/.test(txt)) hints.push("same clothes");
    if (hints.length) fig.double = { of: protagonist, evidence: hints };
  }

  // ── sentence modes (dialogue, written text, rule, screen, explanation, question) ──
  const sMode = new Map();
  const GEN = new Set(LEX.generic_subjects ?? []), EXPL = new Set(LEX.explain_cues ?? []);
  const explainS = new Set(), questionS = new Set();
  for (let s = 0; s < nS; s++) {
    const ts = sentToks[s]; if (!ts.length || ts.every((t) => t.quote)) continue;
    const w = ts.map((t) => t.n);
    const firstNom = ts.find((t, q) => (GEN.has(t.n) || t.person || t.ref || t.obj || t.place || PRON.has(t.n)) && !(q > 0 && PREP_PLACE.has(ts[q - 1].n)));
    if ((firstNom && GEN.has(firstNom.n)) || w.some((x) => EXPL.has(x))) explainS.add(s);
    if (/\?["”]?$/.test(ts.at(-1).w) && /^(kenapa|mengapa|apakah|bagaimana|apa|siapa|benarkah|jadi)$/.test(w.find((x) => !/^(tunggu|sebentar|tapi|dan)$/.test(x)) ?? "")) questionS.add(s);
  }
  const sText = (s) => sentToks[s].map((t) => t.n);
  for (let s = 0; s < nS; s++) {
    const ts = sentToks[s];
    if (!ts.length) continue;
    const q = ts.every((t) => t.quote);
    const prevS = sentToks[s - 1]?.length ? sText(s - 1) : [];
    const prev2 = sentToks[s - 2]?.length ? sText(s - 2) : [];
    const writtenCue = [...prevS, ...prev2].some((w) => WRITTEN.test(w));
    const spokenCue = [...prevS, ...prev2].some((w) => SPOKEN.test(w));
    const prevEndsOpen = /(\.\.\.|…|:)$/.test(sentToks[s - 1]?.at(-1)?.w ?? "");
    let mode = null;
    if (q) mode = writtenCue && !spokenCue ? "written" : "dialogue";
    else if (prevEndsOpen && prevS.some((w) => /^(tertulis|bertuliskan|tulisan|kalimat|berbunyi)$/.test(w))) mode = "written";
    // a quote that continues over several sentences keeps its mode
    if (q && s > 0 && sMode.get(s - 1) && sentToks[s - 1].every((t) => t.quote)) mode = sMode.get(s - 1);
    if (!mode && sMode.get(s - 1) === "written" && prevEndsOpen) mode = "written";
    sMode.set(s, mode);
  }
  // screen context: "Di layar itu, …", "saat kembali melihat layar… Sosok itu…", "Di sana… (in the photo)"
  const screenS = new Set();
  for (let s = 0; s < nS; s++) {
    const w = sText(s);
    const hasScreen = w.some((x) => SCREEN.has(x) || roots(x).some((r) => SCREEN.has(r)));
    const lookAt = w.some((x) => /^(melihat|menatap|memperhatikan|memperbesar|terlihat|tampak)$/.test(x));
    if (hasScreen && (/^di$/.test(w[0]) || w.includes("terlihat") || w.includes("tampak"))) screenS.add(s);
    if (hasScreen && lookAt && /(\.\.\.|…)$/.test(sentToks[s].at(-1).w)) screenS.add(s + 1);
  }
  let ctx = 0;
  for (let s = 0; s < nS; s++) {
    const w = sText(s);
    if (w.some((x) => SCREEN.has(x) || /^(memotret|memperbesar|merekam|memfoto)$/.test(x))) ctx = 3;
    else if (ctx > 0 && /^di$/.test(w[0]) && /^(sana|situ|dalamnya)$/.test(w[1] ?? "")) { screenS.add(s); if (/(\.\.\.|…)$/.test(sentToks[s].at(-1).w)) screenS.add(s + 1); }
    if (w.some((x) => /^(menoleh|berbalik)$/.test(x))) ctx = 0; else ctx--;
  }

  // ── interactions: subject – verb – object/target, with mode ──
  const ACT = L("actions");
  const interactions = [];
  let lastPerson = protagonist && people.length ? people.find((p) => p.name === protagonist)?.name : undefined;
  let lastThing = null;
  const sitting = new Set();
  const thingOf = (t) => t.obj ? { word: t.obj.key.includes(" ") ? t.obj.key : t.clean, id: t.obj.value } : t.place ? { word: t.place.key.includes(" ") ? t.place.key : t.clean, id: `place:${t.place.value}` } : null;
  const ABSTRACT = new Set(LEX.abstract ?? []);
  const nominal = (x) => x.person || x.ref || x.obj || x.place || x.fig || x.role || PRON.has(x.n);
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (t.person && t.person !== "figure" && !t.person.startsWith("role:")) lastPerson = t.person;
    if ((t.person === "figure" || t.person?.startsWith("role:")) && !t.quote) lastPerson = t.person;
    if (/^(ia|dia)$/.test(t.n) && !t.quote && lastPerson) t.ref = lastPerson;
    if (/^(mereka|keduanya)$/.test(t.n) && !t.quote) { const recent = [...new Set(toks.slice(Math.max(0, t.i - 80), t.i).filter((x) => x.person && x.person !== "figure").map((x) => x.person))]; if (recent.length >= 2) { lastPerson = recent.slice(-2).join("+"); t.ref = lastPerson; } }
    const th = thingOf(t); if (th && !t.part && !/^(world:|place:|ui:|look:)/.test(th.id) && toks[k - 1]?.n !== "dari") { lastThing = th; } // "dari oven" is a source, not the thing handled
    const a = look(ACT, t.w);
    if (!a || a.value === "none" || t.part || t.num || stop.has(t.n) || toks[k - 1]?.n === "selamat") continue;
    const affixed = /^(me|ber|ter|di|ke|se)/.test(t.n);
    if ((t.place || t.obj) && !affixed) continue;                                   // "jalan setapak", "ujung jalan"
    if (!affixed && a.key !== t.n && /(an|annya|anmu)$/.test(t.n)) continue;          // "jawabannya", "pandangan"
    if (!affixed && a.key === nounRoots(t.w).at(-1) && toks[k - 1] && thingOf(toks[k - 1]) && toks[k - 1].clause === t.clause) continue; // "meja baca", "kamar tidur"
    if (/^di/.test(t.n) && a.key !== t.n && !/^(diam|diri)/.test(t.n) && toks[k + 1]?.n !== "oleh") continue; // passive "harga bisa ditawar", "lampu dimatikan"
    const [kind, act0] = String(a.value).includes(":") ? String(a.value).split(":") : ["action", a.value];
    if (kind === "face") continue;
    let action = act0;
    const cl = toks.filter((x) => x.sent === t.sent && Math.floor(x.clause) === Math.floor(t.clause));
    const before = cl.filter((x) => x.i < t.i), after = cl.filter((x) => x.i > t.i);
    // subject: a person before the verb in the clause, a pronoun, else the previous subject
    const inPP = (x) => { for (let q = x.i - 1; q >= 0 && q >= x.i - 3 && toks[q].clause === x.clause; q--) { if (PREP_PLACE.has(toks[q].n) || PREP_TARGET.has(toks[q].n)) return true; if (nominal(toks[q])) return false; } return false; };
    let subj = before.find((x) => nominal(x) && !x.part && !inPP(x));
    const detNP = before.find((x, q) => q > 0 && DET.has(before[q - 1].n) && before[q - 1].n !== "seorang" && !x.person && !stop.has(x.n));
    if (detNP && (!subj || detNP.i < subj.i) && !inPP(detNP) && !(detNP.obj && /complex:/.test(String(detNP.obj.value)))) continue; // a thing does it
    if (detNP?.obj && /complex:/.test(String(detNP.obj.value)) && (!subj || detNP.i <= subj.i)) subj = detNP;
    // a thing as subject ("pesan … masuk", "daftar itu mencatat", "semua nama terlihat") is not a person acting
    if (subj && !subj.person && !subj.ref && !PRON.has(subj.n) && (subj.obj || subj.place) && !/complex:/.test(String(subj.obj?.value))) continue;
    let who = subj ? subj.person ?? subj.ref ?? lastPerson : lastPerson;
    const named0 = (x) => x.person && x.person !== "figure";
    if (!subj) {
      const grp = [];
      for (let q = t.i - 1; q >= 0 && toks[q].sent === t.sent; q--) { if (look(ACT, toks[q].w) && !toks[q].part && toks[q].clause !== t.clause) break; if (named0(toks[q]) && !grp.includes(toks[q].person)) grp.unshift(toks[q].person); }
      if (grp.length >= 2 && toks.slice(t.i - 8, t.i).some((x) => x.n === "dan")) who = grp.join("+");
    }
    if (subj?.n === "mereka" || subj?.n === "keduanya") { const recent = [...new Set(toks.slice(Math.max(0, t.i - 80), t.i).filter(named0).map((x) => x.person))]; if (recent.length >= 2) who = recent.slice(-2).join("+"); }
    if (/^(standUp|sit|lie)$/.test(action) && !subj) { const inv = after.slice(0, 3).find((x) => x.person); if (inv) who = inv.person; }
    // "kamu melihat sosok manusia berdiri": the pose belongs to the person just seen, not the one looking
    if (/^(standUp|sit|lie|freeze)$/.test(action)) { const seen = toks.slice(Math.max(0, t.i - 3), t.i).reverse().find((x) => x.person && x.sent === t.sent); if (seen && seen.person !== who && toks.slice(seen.i - 3, seen.i).some((x) => look(ACT, x.w)?.value === "look")) who = seen.person; }
    if (!subj && before.length && NUM[before[0].n] !== undefined) who = `(${before[0].clean.toLowerCase()} of them)`;
    if (subj?.obj && /complex:/.test(String(subj.obj.value))) who = `(${subj.clean})`;
    // object / target
    let obj = null, target = null;
    const transitive = /^(pickUp|putDown|open|close|push|give|receive|point|look|raise|reach|write|phone)$/.test(action) || /^me/.test(t.n);
    for (let q = 0; q < after.length; q++) {
      const x = after[q];
      if (x.person && action !== "look" && action !== "point" && action !== "give") break;
      if (PREP_TARGET.has(x.n) || (x.n === "atas" && after[q - 1] && PREP_TARGET.has(after[q - 1].n))) {
        const y = after.slice(q + 1).find((z) => thingOf(z) || z.person || (!stop.has(z.n) && z.n.length > 2 && !PREP_PLACE.has(z.n)));
        if (y) target = thingOf(y)?.word ?? y.person ?? y.clean;
        break;
      }
      if (PREP_PLACE.has(x.n)) { const y = after.slice(q + 1).find((z) => thingOf(z)); if (y && !target) target = y.clean; break; }
      if (!obj && transitive && (thingOf(x) || x.person)) obj = thingOf(x)?.word ?? x.person;
    }
    if (!obj && transitive && !(/nya$/.test(t.n) && lastThing) && /^(pickUp|putDown|open|close|push|give|receive|reach|point|write|raise|phone|pickUp\+putDown)$/.test(action)) {
      const x = after.find((z) => !stop.has(z.n) && !DET.has(z.n) && !NUM[z.n] && !PREP_PLACE.has(z.n) && !PREP_TARGET.has(z.n) && !look(ACT, z.w) && z.n.length > 2 && !z.cap);
      if (x && !PREP_PLACE.has(toks[x.i - 1]?.n) && !PREP_TARGET.has(toks[x.i - 1]?.n)) obj = nounRoots(x.w).at(-1);
    }
    const abstractObj = after.some((x) => ABSTRACT.has(x.n) || ABSTRACT.has(nounRoots(x.w).at(-1)));
    if (!obj && /nya$/.test(t.n) && lastThing && transitive && !abstractObj && !/^(give|receive|talk)$/.test(action)) obj = lastThing.word; // "mengambilnya"
    if (!target && /^(walk|run)$/.test(action) && /^(mendekat|mendekati|menghampiri|menghampirinya|mendekatinya)$/.test(t.n) && lastThing) target = lastThing.word;
    // posture: "berdiri" is a state unless it follows sitting / comes "dari" a seat
    let mode = "acted";
    if (action === "standUp") {
      // "berdiri di depan printer", "masih berdiri", "berdiri seorang laki-laki" = a pose; "Dina berdiri, lalu …" = gets up
      const st = before.some((x) => STATE_BEFORE.has(x.n)) || (after[0] && STATE_AFTER.has(after[0].n));
      const fromSeat = after[0]?.n === "dari" || sitting.has(who);
      if (st && !fromSeat) { action = "stand"; mode = "state"; }
    }
    if (action === "sit") sitting.add(who);
    if (action === "standUp" || action === "walk" || action === "run") sitting.delete(who);
    // "membalik ponsel" (hand on an object) vs "berbalik" (turn round)
    if (a.key === "balik") action = obj ? "reach" : "turn";
    if (action === "raise" && obj && !/senter|lentera|lampu|obor/.test(String(obj))) action = target ? "pickUp+putDown" : "pickUp";
    const withT = after.find((x, q) => after[q - 1]?.n === "dengan" && (thingOf(x) || x.obj));
    const instrument = withT ? thingOf(withT)?.word : undefined;
    // modes that are not acted on screen
    const sm0 = sMode.get(t.sent);
    if (!sm0 && SPOKEN.test(t.n) && toks.slice(Math.max(0, t.i - 3), t.i).some((x) => x.quote)) {
      const sp = after.find((x) => x.person) ?? before.find((x) => x.person);
      if (sp) { const d = toks[t.i - 1]; d.speaker = sp.person; for (let q = t.i - 1; q >= 0 && toks[q].quote; q--) toks[q].speaker = sp.person; }
      interactions.push({ t: t.t, sentence: t.sent, word: t.clean, who: sp?.person ?? who, action: "talk", mode: "dialogue", supported: true });
      continue;
    }
    const sm = sMode.get(t.sent);
    if (abstractObj && /^(give|receive)$/.test(action)) mode = "said";
    else if (sm === "dialogue") mode = "dialogue";
    else if (sm === "written") mode = "written";
    else if (t.quote) mode = "dialogue";
    else if (before.some((x) => NEG.has(x.n)) || NEG.has(toks[k - 1]?.n)) mode = "negated";
    else if (cl.some((x) => COND.has(x.n)) || sentToks[t.sent].slice(0, 2).some((x) => COND.has(x.n)) || before.some((x) => /^(harus|wajib|pernah)$/.test(x.n) && NEG.has(toks[x.i - 1]?.n))) mode = "hypothetical";
    else if (screenS.has(t.sent)) mode = "on-screen";
    else if (explainS.has(t.sent)) mode = "explanation";
    else if (questionS.has(t.sent)) mode = "question";
    else if (kind === "unsupported") mode = "acted";
    if (who && /^\((?!.* of them\))/.test(String(who))) mode = mode === "acted" ? "non-cast" : mode;
    if (who && String(who).startsWith("(") && mode === "acted") mode = "unclear who";
    // "berjalan mendekat": one movement
    const prevI = interactions.at(-1);
    if (prevI && prevI.who === who && (prevI.action === action || (/^(walk|run)$/.test(prevI.action) && action === "walk")) && prevI.sentence === t.sent && toks[k - 1]?.clean === prevI.word.split(" ").at(-1)) { prevI.target ??= target ?? obj ?? undefined; prevI.word += " " + t.clean; continue; }
    interactions.push({ t: t.t, sentence: t.sent, word: t.clean, who, action, obj: obj ?? undefined, with: instrument, target: target ?? undefined, mode, supported: kind !== "unsupported" });
  }

  // ── state changes of things: "printer menyala", "lampu kamar padam", "kertas keluar", "ponselnya bergetar" ──
  const STATES = L("states");
  const states = [];
  toks.forEach((t) => {
    const s = look(STATES, t.w);
    if (!s || t.quote || t.part) return;
    if (/^(open|shut)$/.test(s.value) && /^me/.test(t.n) && !toks.slice(Math.max(0, t.i - 4), t.i).some((x) => x.person || x.ref)) return; // "ombak … menutupinya": not a door
    const cl = toks.filter((x) => x.sent === t.sent && Math.floor(x.clause) === Math.floor(t.clause) && x.i < t.i);
    const inPP2 = (x) => { const q = x.i - 1; return q >= 0 && (PREP_PLACE.has(toks[q].n) || PREP_TARGET.has(toks[q].n)) && toks[q].clause === x.clause; };
    const thing = cl.find((x) => thingOf(x) && !x.part && !inPP2(x)) ?? [...cl].reverse().find((x) => thingOf(x));
    const active = /^me/.test(t.n) && !/^(menyala|meledak|menghilang|meluncur)$/.test(t.n); // "menyalakan senter" = a person switches it
    if (!thing && !active) return;
    const by = active ? [...cl].reverse().find((x) => x.person || x.ref) ?? toks.slice(Math.max(0, t.i - 30), t.i).reverse().find((x) => (x.person || x.ref) && !x.quote) : null;
    const after = toks.filter((x) => x.sent === t.sent && x.i > t.i).find((x) => thingOf(x));
    const th = active ? after ?? thing : thing;
    if (active && !after && /nya$/.test(t.n)) {
      const prevThing = toks.slice(Math.max(0, t.i - 12), t.i).reverse().find((x) => thingOf(x) || (x.i > 0 && /^(me|ber)/.test(toks[x.i - 1].n) && !stop.has(x.n) && !NUM[x.n] && x.n.length > 3 && !look(ACT, x.w)));
      if (prevThing) { states.push({ t: t.t, thing: thingOf(prevThing)?.word ?? prevThing.clean, id: thingOf(prevThing)?.id ?? "unlisted", state: s.value, by: by ? by.person ?? by.ref : undefined, mode: "acted" }); return; }
    }
    if (!th) return;
    states.push({ t: t.t, thing: thingOf(th).word, id: thingOf(th).id, state: s.value, by: by ? by.person ?? by.ref : undefined, mode: sMode.get(t.sent) ?? (cl.some((x) => COND.has(x.n)) || sentToks[t.sent].slice(0, 2).some((x) => COND.has(x.n)) ? "hypothetical" : screenS.has(t.sent) ? "on-screen" : "acted") });
  });

  // ── time of day: the story's own clock > "malam itu" > ambient words; rules and "besok pagi" do not count ──
  const TIME = L("time");
  const ev = [];
  toks.forEach((t, k) => {
    const tm = lookN(TIME, t.w);
    if (!tm || t.clockPart) return;
    const ctx = toks.slice(Math.max(0, k - 2), k).map((x) => x.n);
    if (ctx.some((x) => /^(besok|kemarin|lusa|nanti|setiap|tiap)$/.test(x))) return ev.push({ t: t.t, value: tm.value, weight: 0, why: `“${ctx.at(-1)} ${t.clean}” is not the story's present` });
    const strong = DEM.has(toks[k + 1]?.n) && toks[k + 1]?.sent === t.sent;
    ev.push({ t: t.t, value: tm.value, weight: t.quote ? 0.5 : strong ? 4 : 1, why: strong ? `“${t.clean} ${toks[k + 1].clean}”` : `“${t.clean}”` });
  });
  const hourValue = (h, part) => {
    if (part === "pagi") return h <= 4 || h === 12 ? "night" : h <= 6 ? "dawn" : "day";
    if (part === "siang") return "day";
    if (part === "sore") return h >= 6 && h < 12 ? "dusk" : "day";
    if (part === "malam") return "night";
    return null;
  };
  for (const c of clocks) {
    const v = hourValue(c.h, c.part);
    if (v) ev.push({ t: c.t, value: v, weight: c.rule ? 0.5 : 3, why: `clock “${c.text}”${c.rule ? " (rule / not now)" : ""}` });
  }
  const score = {};
  for (const e of ev) score[e.value] = (score[e.value] ?? 0) + e.weight;
  let tod = Object.entries(score).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (!tod || score[tod] === 0) tod = undefined;
  // clocks without am/pm take the story's time of day: 2.13 at night = 02.13, 6.13 at dusk = 18.13
  const story = clocks.map((c) => {
    let h = c.h;
    const v = hourValue(h, c.part) ?? tod;
    if (!c.part && h <= 12) { if (v === "night" && h >= 7) h += 12; if (v === "dusk" && h < 12) h += 12; if (v === "day" && h < 7) h += 12; }
    return { t: c.t, text: c.text, clock: `${String(h % 24).padStart(2, "0")}.${String(c.m).padStart(2, "0")}`, rule: c.rule || undefined };
  });
  const time = { value: tod ?? "day", stated: !!tod, evidence: ev.filter((e) => e.weight > 0).map((e) => `${e.t}s ${e.why} → ${e.value}`), ignored: ev.filter((e) => e.weight === 0).map((e) => e.why), clocks: story };

  // ── locations: main kind + areas ("ruang rapat", "lantai sebelas", "kamar nomor tiga belas", "lorong") ──
  const locKinds = {};
  const GENERIC = new Set(LEX.generic_places ?? []);
  const HINT = LEX.place_hints ?? {};
  for (const u of [...unnamed, ...people]) { const h = HINT[u.role]; if (h) locKinds[h] = (locKinds[h] ?? 0) + 1.5; }
  for (const t of toks) { const h = t.obj && HINT[String(t.obj.value)]; if (h) locKinds[h] = (locKinds[h] ?? 0) + 1; }
  const areas = [];
  toks.forEach((t, k) => {
    if (t.place && !t.part && !t.quote && !sMode.get(t.sent) && !explainS.has(t.sent)) {
      const w = GENERIC.has(t.place.key) ? 0.4 : 2;
      locKinds[t.place.value] = (locKinds[t.place.value] ?? 0) + w;
      const name = t.place.key.includes(" ") ? t.place.key : t.clean.toLowerCase();
      const roomish = /^(kamar|ruang|lantai|kantor)/.test(t.place.key);
      const num0 = toks[k + 1]?.n === "nomor" ? numberAt(toks, k + 2) : roomish && !/^(jam|menit|detik)$/.test(toks[(numberAt(toks, k + 1)?.next) ?? 0]?.n ?? "") ? numberAt(toks, k + 1) : null;
      const num = num0;
      const label = num ? `${name} ${toks.slice(k + 1, num.next).map((x) => x.clean).join(" ")}` : name;
      if (!areas.some((a) => a.name === label)) areas.push({ name: label, kind: t.place.value, t: t.t });
    }
    if (false && t.n === "lantai" && numberAt(toks, k + 1)) areas.push({ name: `lantai ${toks.slice(k + 1, numberAt(toks, k + 1).next).map((x) => x.clean).join(" ")}`, kind: "floor", t: t.t });
  });
  const mainKind = Object.entries(locKinds).sort((a, b) => b[1] - a[1])[0]?.[0];

  // ── objects that matter: lexicon hits, weighted by interaction; unknown nouns after determiners/prepositions ──
  const objMap = new Map();
  toks.forEach((t) => {
    if (!t.obj || t.part || t.person) return;
    const id = String(t.obj.value);
    const o = objMap.get(id) ?? { word: t.clean.toLowerCase(), key: t.obj.key, value: id, mentions: [], used: false };
    o.mentions.push(t.t);
    objMap.set(id, o);
  });
  for (const it of interactions) for (const w of [it.obj, it.target]) { if (!w) continue; const o = [...objMap.values()].find((x) => x.word === lower(w) || x.key === lower(w) || roots(w).includes(x.key)); if (o && it.mode === "acted") o.used = true; }
  for (const s of states) { const o = objMap.get(s.id); if (o) o.used = true; }
  const mentions = [];
  toks.forEach((t, k) => {
    const prev = toks[k - 1];
    if (!prev || prev.sent !== t.sent || t.obj || t.place || t.person || t.role || t.fig || t.num || t.part || t.cap) return;
    const r = roots(t.w);
    if (r.some((x) => stop.has(x)) || look(ACT, t.w) || look(TIME, t.w) || look(L("emotions"), t.w) || look(STATES, t.w) || PREP_PLACE.has(t.n) || PREP_TARGET.has(t.n) || DEM.has(t.n) || NEG.has(t.n) || COND.has(t.n) || PRON.has(t.n) || /^(me|ber|ter|di)/.test(t.n) && t.n.length > 6) return;
    if (DET.has(prev.n) || PREP_PLACE.has(prev.n) || PREP_TARGET.has(prev.n) || DEM.has(toks[k + 1]?.n)) {
      const w = r.find((x) => !x.endsWith("nya")) ?? t.n;
      if (w.length > 2 && !mentions.some((m) => m.word === w)) mentions.push({ word: w, t: t.t, context: toks.slice(Math.max(0, k - 2), k + 2).map((x) => x.clean).join(" ") });
    }
  });

  // ── sounds and emotions ──
  const SND = L("sounds"), SRC = L("sources");
  const sounds = [];
  toks.forEach((t, k) => {
    if (t.quote) return;
    const s = look(SND, t.w);
    if (s && !t.part) sounds.push({ t: t.t, word: t.clean, sfx: s.value });
    // "terdengar suara printer", "suara kamera", "printer kembali berbunyi"
    if (/^(terdengar|berbunyi|bunyi|suara)$/.test(t.n)) {
      const win = toks.slice(Math.max(0, k - 3), k + 4).filter((x) => x.sent === t.sent && x !== t);
      const src = win.map((x) => look(SRC, x.w)).find(Boolean);
      if (src && !sounds.some((x) => Math.abs(x.t - t.t) < 1.6 && x.sfx === src.value)) sounds.push({ t: t.t, word: `${t.clean} (${src.key})`, sfx: src.value });
    }
  });
  for (const s of states) {
    if (!/^(sound|buzz|on)$/.test(s.state) || s.mode !== "acted") continue;
    const src = look(SRC, s.thing.split(" ")[0]);
    if (src && !(s.state === "on" && src.value === "notif") && !sounds.some((x) => Math.abs(x.t - s.t) < 1.6 && x.sfx === src.value)) sounds.push({ t: s.t, word: `${s.thing} ${s.state}`, sfx: src.value });
  }
  sounds.sort((a, b) => a.t - b.t);
  const emotions = [];
  toks.forEach((t) => { const e = look(L("emotions"), t.w); if (e && !t.quote) emotions.push({ t: t.t, word: t.clean, face: e.value, who: lastPersonAt(t) }); });
  function lastPersonAt(t) { for (let k = t.i; k >= 0; k--) { const x = toks[k]; if (x.sent < t.sent - 1) break; if (x.person) return x.person; if (x.ref) return x.ref; } return protagonist; }

  // ── dialogue and written text ──
  const dialogue = [], texts = [];
  for (let s = 0; s < nS; s++) {
    const m = sMode.get(s);
    if (!m || !sentToks[s].length) continue;
    const text = sentToks[s].map((t) => t.w).join(" ").replace(/^["“]|["”]$/g, "");
    if (m === "dialogue") {
      // speaker: "suaranya sendiri" → the protagonist's voice (the double); "ibu kos memberinya …" → that role
      const near = [...(sentToks[s - 1] ?? []), ...(sentToks[s - 2] ?? [])];
      const own = near.some((t) => /^(suaranya|dirinya)$/.test(t.n)) && near.some((t) => t.n === "sendiri");
      const tagged = sentToks[s].find((t) => t.speaker)?.speaker;
      const sp = tagged ?? (own ? (fig?.double ? "figure (the double)" : protagonist) : [...near].reverse().find((t) => t.person)?.person ?? "?");
      const prevD = dialogue.at(-1);
      if (prevD && prevD.sentence === s - 1) { prevD.text += " " + text; prevD.sentence = s; }
      else dialogue.push({ t: sentToks[s][0].t, sentence: s, speaker: sp, text });
    } else {
      const near = [...(sentToks[s - 1] ?? []), ...(sentToks[s - 2] ?? []), ...(sentToks[s - 3] ?? [])].map((t) => t.n);
      const on = near.find((w) => /^(kertas|layar|pesan|ponsel|hp|surat|papan|dinding|foto|daftar)/.test(w));
      const prevT = texts.at(-1);
      if (prevT && prevT.sentence === s - 1) { prevT.text += " " + text; prevT.sentence = s; }
      else texts.push({ t: sentToks[s][0].t, sentence: s, on: on ?? "?", text });
    }
  }

  const explanation = [...explainS].sort((a, b) => a - b).map((s) => ({ t: sentToks[s][0].t, sentence: s, text: sentToks[s].map((t) => t.w).join(" ") }));
  const unmapped = [];
  for (const t of toks) {
    if (t.quote || t.person || t.obj || t.place || t.num || stop.has(t.n) || look(ACT, t.w) || look(STATES, t.w) || look(L("emotions"), t.w) || look(L("sounds"), t.w)) continue;
    if (!/^(me|ber)/.test(t.n) || t.n.length < 6 || explainS.has(t.sent) || sMode.get(t.sent)) continue;
    if (!unmapped.some((u) => u.word === t.n)) unmapped.push({ t: t.t, word: t.n, sentence: sentToks[t.sent].map((x) => x.w).join(" ") });
  }
  return {
    unmapped, explanation, placeNames, sentences, protagonist, characters: people, unnamed, time, location: { main: mainKind, kinds: locKinds, areas },
    objects: [...objMap.values()], mentions, interactions, states, sounds, emotions, dialogue, texts,
  };
}

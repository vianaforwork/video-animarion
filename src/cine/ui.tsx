// CINÉSTORY motion-graphics kit (2D overlay: 1080×1920 portrait or 1920×1080 landscape; sizes and positions come from the layout in film/Overlay.tsx). Every element is driven by an appear amount
// `a` (0..1) and/or a progress value, so shots animate them as pure functions of time. Readable,
// documentary style: Manrope, thin rules, glass cards, cyan = information, amber = interpretation.

import React from "react";

export const CYAN = "#8fdcff";
export const AMBER = "#ffbf73";
export const RED = "#ff6b5e";
export const INK = "#eef3fb";
const FONT = "Manrope, sans-serif";
const clamp = (x: number) => Math.min(1, Math.max(0, x));
const eo = (x: number) => 1 - (1 - clamp(x)) ** 3;
/** appear amount for an element living in [t0, t1] with fades. */
export const span = (v: number, t0: number, t1: number, fin = 0.45, fout = 0.4) => eo((v - t0) / fin) * (1 - clamp((v - (t1 - fout)) / fout));

const abs = (x: number, y: number): React.CSSProperties => ({ position: "absolute", left: x, top: y });

/** Chip label: small caps text in a thin-bordered glass box. */
export const Tag: React.FC<{ x: number; y: number; a: number; text: string; sub?: string; color?: string; size?: number; anchor?: "l" | "c" | "r" }> = ({ x, y, a, text, sub, color = CYAN, size = 26, anchor = "l" }) =>
  a <= 0.001 ? null : (
    <div style={{ ...abs(x, y), transform: `translate(${anchor === "c" ? "-50%" : anchor === "r" ? "-100%" : "0"}, -50%) translateY(${(1 - a) * 14}px)`, opacity: a, fontFamily: FONT }}>
      <div style={{ padding: "10px 18px", border: `1.5px solid ${color}`, background: "rgba(8,14,26,0.55)", backdropFilter: "blur(6px)", borderRadius: 6, color: INK, whiteSpace: "nowrap" }}>
        <div style={{ fontSize: size, fontWeight: 600, letterSpacing: "0.08em", color }}>{text}</div>
        {sub ? <div style={{ fontSize: size * 0.72, fontWeight: 400, marginTop: 4, color: INK, opacity: 0.9 }}>{sub}</div> : null}
      </div>
    </div>
  );

/** Callout: a dot on a projected 3D point, a leader line, and a label. */
export const Callout: React.FC<{ p: { x: number; y: number; z?: number }; a: number; text: string; sub?: string; dx?: number; dy?: number; color?: string; W?: number; H?: number; size?: number }> = ({ p, a, text, sub, dx = 160, dy = -90, color = CYAN, W = 1920, H = 1080, size = 26 }) => {
  if (a <= 0.001 || (p.z !== undefined && p.z <= 0)) return null;
  const lx = p.x + dx * eo(a * 1.4), ly = p.y + dy * eo(a * 1.4);
  return (
    <>
      <svg width={W} height={H} style={abs(0, 0)}>
        <circle cx={p.x} cy={p.y} r={7 * a} fill="none" stroke={color} strokeWidth={2} opacity={a} />
        <circle cx={p.x} cy={p.y} r={2.5} fill={color} opacity={a} />
        <line x1={p.x} y1={p.y} x2={lx} y2={ly} stroke={color} strokeWidth={1.5} opacity={a * 0.9} />
      </svg>
      <Tag x={lx + (dx >= 0 ? 8 : -8)} y={ly} a={clamp(a * 1.6 - 0.4)} text={text} sub={sub} color={color} anchor={dx >= 0 ? "l" : "r"} size={size} />
    </>
  );
};

/** Big centred title (section headings, key terms). */
export const Title: React.FC<{ a: number; text: string; sub?: string; kicker?: string; y?: number; size?: number; color?: string; maxWidth?: number; left?: number; right?: number }> = ({ a, text, sub, kicker, y = 540, size = 84, color = INK, maxWidth, left = 0, right = 0 }) =>
  a <= 0.001 ? null : (
    <div style={{ position: "absolute", left, right, top: y, transform: "translateY(-50%)", textAlign: "center", fontFamily: FONT, color, opacity: a }}>
      {kicker ? <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "0.5em", color: CYAN, marginBottom: 18, paddingLeft: "0.5em" }}>{kicker}</div> : null}
      <div style={{ fontSize: size, fontWeight: 300, letterSpacing: `${0.22 + 0.08 * (1 - a)}em`, paddingLeft: "0.22em", whiteSpace: maxWidth ? "normal" : "nowrap", maxWidth, margin: maxWidth ? "0 auto" : undefined, lineHeight: 1.15, textShadow: `${EDGE}, 0 2px 30px rgba(0,0,0,0.45)` }}>{text}</div>
      {sub ? <div style={{ fontSize: 30, fontWeight: 400, marginTop: 22, opacity: 0.88, textShadow: EDGE }}>{sub}</div> : null}
    </div>
  );

// light text that must read on any picture (a white floor, a bright sky) carries a dark edge or sits on glass
const EDGE = "0 1px 3px rgba(0,0,0,0.6), 0 2px 18px rgba(0,0,0,0.55)";

/** Lower-third statement (left, above the letterbox), on a glass plate. */
export const Lower: React.FC<{ a: number; text: string; sub?: string; color?: string; y?: number; x?: number; size?: number; maxWidth?: number }> = ({ a, text, sub, color = CYAN, y = 860, x = 120, size = 40, maxWidth }) =>
  a <= 0.001 ? null : (
    <div style={{ ...abs(x, y), maxWidth, transform: `translateY(-100%) translateX(${(1 - a) * -20}px)`, opacity: a, fontFamily: FONT, color: INK, padding: "16px 22px 18px", background: "rgba(8,14,26,0.55)", backdropFilter: "blur(6px)", borderRadius: 10, boxSizing: "border-box" }}>
      <div style={{ width: 70 * a, height: 3, background: color, marginBottom: 14 }} />
      <div style={{ fontSize: size, fontWeight: 600, letterSpacing: "0.02em", lineHeight: 1.15, textShadow: EDGE }}>{text}</div>
      {sub ? <div style={{ fontSize: size * 0.65, fontWeight: 400, marginTop: 8, opacity: 0.9, textShadow: EDGE }}>{sub}</div> : null}
    </div>
  );

/** Rubber stamp (✓/✗ verdicts). */
export const Stamp: React.FC<{ x: number; y: number; a: number; text: string; color?: string; rot?: number; size?: number }> = ({ x, y, a, text, color = RED, rot = -8, size = 64 }) =>
  a <= 0.001 ? null : (
    <div style={{ ...abs(x, y), transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${1 + 0.6 * (1 - eo(a * 1.5))})`, opacity: clamp(a * 2), fontFamily: FONT, fontWeight: 700, fontSize: size, letterSpacing: "0.1em", color, whiteSpace: "nowrap", border: `5px solid ${color}`, borderRadius: 10, padding: "6px 26px", textShadow: "0 0 18px rgba(0,0,0,0.4)" }}>{text}</div>
  );

/** Glass card. */
export const Card: React.FC<{ x: number; y: number; w: number; h?: number; a: number; children: React.ReactNode; color?: string }> = ({ x, y, w, h, a, children, color = "rgba(143,220,255,0.55)" }) =>
  a <= 0.001 ? null : (
    <div style={{ ...abs(x, y), width: w, height: h, transform: `translateY(${(1 - a) * 20}px)`, opacity: a, padding: "26px 30px", boxSizing: "border-box", fontFamily: FONT, color: INK, background: "rgba(8,14,26,0.62)", border: `1.5px solid ${color}`, borderRadius: 14, backdropFilter: "blur(8px)" }}>{children}</div>
  );

/** A row of steps joined by arrows; `k` lights them one by one (0..n). */
export const Flow: React.FC<{ x: number; y: number; a: number; items: string[]; k: number; colors?: string[]; w?: number; vertical?: boolean }> = ({ x, y, a, items, k, colors, w = 300, vertical }) =>
  a <= 0.001 ? null : (
    <div style={{ ...abs(x, y), display: "flex", flexDirection: vertical ? "column" : "row", alignItems: "center", opacity: a, fontFamily: FONT }}>
      {items.map((it, i) => {
        const on = clamp(k - i);
        const c = colors?.[i] ?? CYAN;
        return (
          <React.Fragment key={i}>
            {i > 0 ? <div style={{ width: vertical ? 2 : 70, height: vertical ? 46 : 2, background: c, opacity: 0.25 + 0.75 * on, position: "relative", transform: vertical ? "none" : undefined }}><div style={vertical ? { position: "absolute", left: -7, bottom: -2, width: 0, height: 0, borderTop: `12px solid ${c}`, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", opacity: 0.25 + 0.75 * on } : { position: "absolute", right: -2, top: -7, width: 0, height: 0, borderLeft: `12px solid ${c}`, borderTop: "8px solid transparent", borderBottom: "8px solid transparent", opacity: 0.25 + 0.75 * on }} /></div> : null}
            <div style={{ width: w, padding: "22px 10px", textAlign: "center", border: `2px solid ${c}`, borderRadius: 12, background: `rgba(8,14,26,${0.5 + 0.2 * on})`, color: INK, fontSize: vertical ? 36 : 30, fontWeight: 600, letterSpacing: "0.06em", opacity: 0.3 + 0.7 * on, transform: `scale(${0.94 + 0.06 * on})`, boxShadow: on > 0.5 ? `0 0 30px ${c}55` : "none" }}>{it}</div>
          </React.Fragment>
        );
      })}
    </div>
  );

/** Balance scale: two pans with labels; tilt −1 (left heavy) … 1 (right heavy). */
export const Scale: React.FC<{ x: number; y: number; a: number; tilt: number; left: [string, string]; right: [string, string] }> = ({ x, y, a, tilt, left, right }) => {
  if (a <= 0.001) return null;
  const ang = tilt * 12;
  const pan = (side: -1 | 1, lab: [string, string], col: string) => {
    const dy = Math.sin((ang * Math.PI) / 180) * 300 * side;
    return (
      <div style={{ position: "absolute", left: 300 * side - 190, top: 60 + dy, width: 380, textAlign: "center" }}>
        <div style={{ height: 3, background: INK, opacity: 0.8, margin: "0 40px" }} />
        <div style={{ marginTop: 16, padding: "18px 14px", border: `2px solid ${col}`, borderRadius: 12, background: "rgba(8,14,26,0.62)" }}>
          <div style={{ fontSize: 30, fontWeight: 700, color: col }}>{lab[0]}</div>
          <div style={{ fontSize: 24, marginTop: 6 }}>{lab[1]}</div>
        </div>
      </div>
    );
  };
  return (
    <div style={{ ...abs(x, y), opacity: a, fontFamily: FONT, color: INK }}>
      <div style={{ position: "absolute", left: -3, top: 0, width: 6, height: 360, background: INK, opacity: 0.7 }} />
      <div style={{ position: "absolute", left: -320, top: 0, width: 640, height: 4, background: INK, transform: `rotate(${ang}deg)`, transformOrigin: "50% 50%" }} />
      {pan(-1, left, AMBER)}
      {pan(1, right, RED)}
    </div>
  );
};

/** Noisy waveform; `word` (0..1) carves a word-shaped burst out of the noise and prints `text`. */
export const Wave: React.FC<{ x: number; y: number; w: number; a: number; t: number; word: number; text: string }> = ({ x, y, w, a, t, word, text }) => {
  if (a <= 0.001) return null;
  const n = 140;
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const noise = Math.sin(i * 12.9898 + Math.floor(t * 24) * 78.233) * 43758.5453 % 1;
    const env = Math.exp(-(((u - 0.5) / 0.14) ** 2));
    const amp = 40 * Math.abs(noise) * (1 - 0.6 * word) + 120 * word * env * Math.abs(Math.sin(u * 60 + t * 3));
    pts.push(`${(u * w).toFixed(1)},${(-amp).toFixed(1)} ${(u * w).toFixed(1)},${amp.toFixed(1)}`);
  }
  return (
    <div style={{ ...abs(x, y), opacity: a, fontFamily: FONT }}>
      <svg width={w} height={300} style={{ position: "absolute", left: 0, top: -150, overflow: "visible" }}>
        <g transform="translate(0,150)">
          {pts.map((p, i) => {
            const [a1, b1] = p.split(" ");
            const [x1, y1] = a1.split(",");
            const [, y2] = b1.split(",");
            const u = i / (n - 1);
            const hot = word * Math.exp(-(((u - 0.5) / 0.14) ** 2));
            return <line key={i} x1={x1} y1={y1} x2={x1} y2={y2} stroke={hot > 0.3 ? AMBER : CYAN} strokeWidth={4} strokeLinecap="round" opacity={0.5 + 0.5 * hot} />;
          })}
        </g>
      </svg>
      <div style={{ position: "absolute", left: w / 2, top: -230, transform: "translateX(-50%)", fontSize: 64, fontWeight: 300, letterSpacing: "0.2em", color: AMBER, opacity: word, whiteSpace: "nowrap", textShadow: `0 0 30px ${AMBER}88` }}>{text}</div>
    </div>
  );
};

/** Two horizontal bars on a timeline (e.g. awareness vs. muscle inhibition) with an overlap window. */
export const Overlap: React.FC<{ x: number; y: number; a: number; k: number; top: [string, number, number]; bottom: [string, number, number]; win: string }> = ({ x, y, a, k, top, bottom, win }) => {
  if (a <= 0.001) return null;
  const W = 1100;
  const bar = (lab: [string, number, number], c: string, yy: number) => (
    <div style={{ position: "absolute", left: 0, top: yy }}>
      <div style={{ fontSize: 26, fontWeight: 600, color: c, marginBottom: 10, letterSpacing: "0.06em" }}>{lab[0]}</div>
      <div style={{ position: "relative", width: W, height: 26, background: "rgba(255,255,255,0.08)", borderRadius: 13 }}>
        <div style={{ position: "absolute", left: lab[1] * W, width: Math.max(0, Math.min(lab[2], lab[1] + (lab[2] - lab[1]) * eo(k)) - lab[1]) * W, height: 26, background: c, borderRadius: 13, opacity: 0.9 }} />
      </div>
    </div>
  );
  const o0 = Math.max(top[1], bottom[1]), o1 = Math.min(top[2], bottom[2]);
  const ow = clamp((k - 0.7) / 0.3);
  return (
    <div style={{ ...abs(x, y), opacity: a, fontFamily: FONT, color: INK }}>
      {bar(top, CYAN, 0)}
      {bar(bottom, RED, 110)}
      <div style={{ position: "absolute", left: o0 * W, top: 30, width: (o1 - o0) * W, height: 150, border: `2px dashed ${AMBER}`, borderRadius: 10, opacity: ow, background: "rgba(255,191,115,0.10)" }} />
      <div style={{ position: "absolute", left: ((o0 + o1) / 2) * W, top: 200, transform: "translateX(-50%)", fontSize: 28, fontWeight: 600, color: AMBER, opacity: ow, whiteSpace: "nowrap" }}>{win}</div>
    </div>
  );
};

/** Stylised sleep-stage strip (no data: a schematic of cycles with REM blocks highlighted). */
export const SleepStrip: React.FC<{ x: number; y: number; a: number; k: number }> = ({ x, y, a, k }) => {
  if (a <= 0.001) return null;
  const W = 1200, H = 220;
  const lv = [0, 1, 2, 3, 2, 1, -1, 1, 2, 3, 2, 1, -1, 1, 2, 1, -1, 0];
  const pts = lv.map((l, i) => `${(i / (lv.length - 1)) * W},${l < 0 ? 10 : 30 + l * 55}`).join(" ");
  return (
    <div style={{ ...abs(x, y), opacity: a, fontFamily: FONT, color: INK }}>
      <svg width={W} height={H + 40} style={{ overflow: "visible" }}>
        <defs>
          <clipPath id="sleepclip"><rect x={0} y={-20} width={W * eo(k)} height={H + 60} /></clipPath>
        </defs>
        {lv.map((l, i) => (l < 0 ? <rect key={i} x={((i - 0.5) / (lv.length - 1)) * W} y={-6} width={W / (lv.length - 1)} height={H} fill={AMBER} opacity={0.16 * eo(k * 1.2 - i / lv.length)} rx={6} /> : null))}
        <polyline points={pts} fill="none" stroke={CYAN} strokeWidth={4} strokeLinejoin="round" clipPath="url(#sleepclip)" />
        {["BANGUN", "TIDUR RINGAN", "", "TIDUR DALAM"].map((s, i) => (s ? <text key={s} x={-24} y={i === 0 ? 14 : 30 + i * 55 + 8} fill={INK} opacity={0.7} fontSize={20} textAnchor="end">{s}</text> : null))}
        <text x={W * 0.36} y={-18} fill={AMBER} fontSize={24} fontWeight={700} opacity={eo(k * 2 - 0.6)}>REM</text>
      </svg>
    </div>
  );
};

/** CCTV playback HUD: timestamp, REC, channel, scanlines, vignette. */
export const CctvHud: React.FC<{ time: string; a?: number; speed?: string; zoom?: number }> = ({ time, a = 1, speed, zoom }) => (
  <div style={{ position: "absolute", inset: 0, opacity: a, fontFamily: "Menlo, monospace", color: "#e8f0e8" }}>
    <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.13) 0px, rgba(0,0,0,0.13) 2px, transparent 2px, transparent 4px)" }} />
    <div style={{ position: "absolute", left: 70, top: 130, fontSize: 30, letterSpacing: "0.06em", textShadow: "0 0 6px #000" }}>CAM 01 · LORONG</div>
    <div style={{ position: "absolute", right: 70, top: 130, fontSize: 30, letterSpacing: "0.04em", textShadow: "0 0 6px #000" }}>{time}</div>
    <div style={{ position: "absolute", left: 70, bottom: 130, fontSize: 26, display: "flex", alignItems: "center", gap: 12, textShadow: "0 0 6px #000" }}>
      <span style={{ width: 16, height: 16, borderRadius: 8, background: "#ff3a2a", display: "inline-block" }} /> PLAYBACK {speed ?? "1×"}
    </div>
    {zoom ? <div style={{ position: "absolute", right: 70, bottom: 130, fontSize: 26, textShadow: "0 0 6px #000" }}>ZOOM {zoom.toFixed(1)}×</div> : null}
  </div>
);

/** Rolling clock digits (rewind). */
export const Clock: React.FC<{ a: number; text: string; sub?: string; y?: number }> = ({ a, text, sub, y = 540 }) =>
  a <= 0.001 ? null : (
    <div style={{ position: "absolute", left: 0, right: 0, top: y, transform: "translateY(-50%)", textAlign: "center", fontFamily: FONT, color: INK, opacity: a }}>
      <div style={{ fontSize: 150, fontWeight: 300, letterSpacing: "0.08em", textShadow: `${EDGE}, 0 0 40px rgba(143,220,255,0.35)` }}>{text}</div>
      {sub ? <div style={{ fontSize: 28, letterSpacing: "0.4em", color: CYAN, marginTop: 6, paddingLeft: "0.4em", textShadow: EDGE }}>{sub}</div> : null}
    </div>
  );

/** Dots that become a face, lines that become a body (pattern-recognition demo). */
export const DotsFace: React.FC<{ x: number; y: number; a: number; k: number }> = ({ x, y, a, k }) => {
  if (a <= 0.001) return null;
  const f = eo(k), b = eo(k - 1);
  return (
    <svg width={900} height={500} style={{ ...abs(x, y), opacity: a, overflow: "visible" }}>
      <g transform="translate(200,250)">
        <circle cx={-55} cy={-40} r={18} fill={INK} />
        <circle cx={55} cy={-40} r={18} fill={INK} />
        <path d={`M -60 ${50 - 20 * f} Q 0 ${50 + 30 * f} 60 ${50 - 20 * f}`} stroke={INK} strokeWidth={10} fill="none" strokeLinecap="round" />
        <circle cx={0} cy={0} r={150} fill="none" stroke={AMBER} strokeWidth={3} strokeDasharray="10 12" opacity={f} />
      </g>
      <g transform="translate(640,250)" stroke={INK} strokeWidth={10} strokeLinecap="round" fill="none">
        <circle cx={0} cy={-150} r={34} />
        <line x1={0} y1={-110} x2={0} y2={40} />
        <line x1={0} y1={-70} x2={-80} y2={0} />
        <line x1={0} y1={-70} x2={80} y2={0} />
        <line x1={0} y1={40} x2={-55} y2={170} />
        <line x1={0} y1={40} x2={55} y2={170} />
        <rect x={-130} y={-210} width={260} height={410} rx={20} stroke={AMBER} strokeWidth={3} strokeDasharray="10 12" opacity={b} />
      </g>
    </svg>
  );
};

/** Grid of noisy "stimulus" cards; some hide a faint face (schematic of the face-in-noise task). */
export const NoiseCards: React.FC<{ x: number; y: number; a: number; k: number; t: number }> = ({ x, y, a, k, t }) => {
  if (a <= 0.001) return null;
  const cells = Array.from({ length: 8 }, (_, i) => i);
  return (
    <div style={{ ...abs(x, y), opacity: a, display: "grid", gridTemplateColumns: "repeat(4, 190px)", gap: 22 }}>
      {cells.map((i) => {
        const face = i % 3 === 1;
        const on = clamp(k * 8 - i);
        return (
          <svg key={i} width={190} height={190} style={{ borderRadius: 10, border: `2px solid ${face && k > 1.2 ? AMBER : "rgba(238,243,251,0.35)"}`, background: "#2a2f37", opacity: 0.3 + 0.7 * on }}>
            {Array.from({ length: 160 }, (_, j) => {
              const h = Math.abs(Math.sin((i * 160 + j) * 12.9898 + Math.floor(t * 6) * 3.1) * 43758.5453) % 1;
              const h2 = Math.abs(Math.sin((i * 160 + j) * 78.233) * 12345.678) % 1;
              return <rect key={j} x={(j % 16) * 12} y={Math.floor(j / 16) * 19} width={12} height={19} fill={`rgba(220,226,235,${0.1 + 0.5 * h * h2})`} />;
            })}
            {face ? (
              <g opacity={0.33} fill="#e9eef6">
                <circle cx={70} cy={80} r={11} /><circle cx={120} cy={80} r={11} /><rect x={72} y={124} width={46} height={8} rx={4} />
              </g>
            ) : null}
          </svg>
        );
      })}
    </div>
  );
};

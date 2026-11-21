// 2D layer over the picture, laid out for the frame's orientation: portrait 1080 × 1920 (default) or
// landscape 1920 × 1080. Portrait keeps everything inside the TikTok / Reels safe area (top 230 px, bottom
// 420 px and the right-hand button column stay clear), shades top and bottom instead of letterbox bars and
// burns in short word-timed captions. The story's UI overlays (titles, lower thirds, tags, callouts on 3D
// points, cards, stamps, clock, steps), title card, disclaimer and end card; branding only from the user's
// own brand kit (story.brand, resolved by make.mjs) — intro, outro and an optional watermark.

import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";
import { AMBER, Callout, Card, CYAN, Flow, INK, Lower, span, Stamp, Tag, Title, Clock } from "../cine/ui.tsx";
import type { Cam } from "../cine/Post.tsx";
import type { Plan, UiP } from "../director/compile.ts";
import { project } from "./project.ts";

const FONT = "Manrope, sans-serif";
const ease = (x: number) => { const k = Math.min(1, Math.max(0, x)); return k * k * (3 - 2 * k); };

type Pos = "tl" | "tr" | "bl" | "br" | "c";
type Lay = {
  W: number; H: number; portrait: boolean;
  safe: { l: number; r: number; t: number; b: number };
  pos: Record<Pos, [number, number]>;
  lower: { x: number; y: number; size: number };
  card: { y: number; w: number; title: number; line: number };
  stamp: [number, number]; title: { y: number; size: number }; clock: number;
  steps: { x: number; y: number; w: number; vertical: boolean };
  cap: { y: number; size: number; w: number };
  tag: number;
};
const PORTRAIT: Lay = {
  W: 1080, H: 1920, portrait: true,
  safe: { l: 72, r: 930, t: 230, b: 1500 },
  pos: { tl: [72, 320], tr: [930, 320], bl: [72, 1110], br: [930, 1110], c: [501, 860] },
  lower: { x: 72, y: 1190, size: 50 },
  card: { y: 330, w: 858, title: 36, line: 34 },
  stamp: [501, 1010], title: { y: 820, size: 66 }, clock: 980,
  steps: { x: 501, y: 460, w: 640, vertical: true },
  cap: { y: 1335, size: 58, w: 840 },
  tag: 30,
};
const LANDSCAPE: Lay = {
  W: 1920, H: 1080, portrait: false,
  safe: { l: 120, r: 1800, t: 90, b: 990 },
  pos: { tl: [140, 200], tr: [1780, 200], bl: [140, 840], br: [1780, 840], c: [960, 540] },
  lower: { x: 120, y: 860, size: 40 },
  card: { y: 300, w: 600, title: 30, line: 27 },
  stamp: [1450, 300], title: { y: 540, size: 84 }, clock: 540,
  steps: { x: 960, y: 540, w: 300, vertical: false },
  cap: { y: 935, size: 44, w: 1400 },
  tag: 26,
};

export const Letterbox: React.FC<{ k: number }> = ({ k }) => {
  const bar = interpolate(k, [0, 1], [0, (1080 - 1920 / 2.2) / 2]);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: bar, background: "#000" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: bar, background: "#000" }} />
    </AbsoluteFill>
  );
};

/** portrait: soft shade under the app's top bar and behind the captions — the picture stays full height */
const PortraitShade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 320, background: "linear-gradient(rgba(0,0,0,0.42), rgba(0,0,0,0))" }} />
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 760, background: "linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0.5))" }} />
  </AbsoluteFill>
);

/** the subject's face on screen (overlay pixels): text keeps off it */
type Face = { top: number; bottom: number; left: number; right: number } | null;
const faceOf = (plan: Plan, t: number, cam: Cam, L: Lay): Face => {
  const sh = plan.shotAt(t);
  if (!sh.who || sh.kind === "pov") return null;
  const p = plan.poseOf(sh.who, t);
  if (!p) return null;
  const c = project(cam, [p.x, p.y + 1.5 + p.hipY, p.z], L.W, L.H);
  if (c.z <= 0.05) return null;
  const r = (0.16 / c.z / Math.tan((cam.fov * Math.PI) / 360)) * (L.H / 2);
  return { top: c.y - r * 1.25, bottom: c.y + r * 1.35, left: c.x - r, right: c.x + r };
};
/** move a block of text (centre y, height h) off the face: below it when there is room, else above it */
const avoid = (y: number, h: number, f: Face, L: Lay) => {
  if (!f || y + h / 2 < f.top || y - h / 2 > f.bottom) return y;
  const below = f.bottom + h / 2 + 30, above = f.top - h / 2 - 30;
  if (below + h / 2 < L.lower.y - 70) return below;
  if (above - h / 2 > L.safe.t) return above;
  // a close-up face fills the frame: the top of the safe area (over the hair) hides the least of it
  return L.safe.t + h / 2 + 10;
};

const UiItem: React.FC<{ u: UiP; t: number; cam: Cam; plan: Plan; bars: number; L: Lay; face: Face; dim: number }> = ({ u, t, cam, plan, bars, L, face, dim }) => {
  // the title / end card owns the screen while it shows: other overlays step back
  const a = span(t, u.t0, u.t1) * dim;
  if (a <= 0.001) return null;
  const x = u.ui;
  const lowY = L.lower.y - 40 * bars;
  switch (x.type) {
    case "title": return <Title a={a} text={x.text} sub={x.sub} kicker={x.kicker} y={L.portrait ? avoid(L.title.y, 180, face, L) : L.title.y} size={L.title.size} maxWidth={L.safe.r - L.safe.l} left={L.portrait ? L.safe.l : 0} right={L.portrait ? L.W - L.safe.r : 0} />;
    case "lower": return <Lower a={a} text={x.text} sub={x.sub} y={lowY + (L.portrait ? 0 : 40)} x={L.lower.x} size={L.lower.size} maxWidth={L.safe.r - L.safe.l} />;
    case "tag": { const [px, py0] = L.pos[x.pos ?? "tl"]; const py = L.portrait ? avoid(py0, 80, face, L) : py0; return <Tag x={px} y={py + (x.pos?.startsWith("t") ? 40 * bars : x.pos?.startsWith("b") ? -40 * bars : 0)} a={a} text={x.text} sub={x.sub} size={L.tag} anchor={x.pos?.endsWith("r") ? "r" : x.pos === "c" ? "c" : "l"} />; }
    case "callout": {
      const S = plan.scenes[u.scene];
      const moved = plan.objectsAt(t)[x.poi];
      const inst = plan.built?.insts.find((i) => i.id === x.poi);
      const w = moved && inst ? ([moved.pos[0], moved.pos[1] + inst.info.bounds[1] * 0.7 * inst.scale, moved.pos[2]] as [number, number, number]) : S.place.pois[x.poi] ?? (() => { const p = plan.poseOf(x.poi, t); return p ? ([p.x, p.y + 1.7, p.z] as [number, number, number]) : undefined; })();
      if (!w) return null;
      const p = project(cam, w, L.W, L.H);
      // keep the label inside the safe area: lead it towards the side with more room
      const left = p.x > (L.safe.l + L.safe.r) / 2 + (L.portrait ? 60 : 340);
      // the label (estimated width) stays inside the safe area: lead towards the side where it fits
      const lw = Math.max(x.text.length, (x.sub ?? "").length * 0.72) * L.tag * 0.66 + 48;
      const reach = L.portrait ? 110 : 170;
      const fitsR = p.x + reach + 8 + lw <= L.safe.r, fitsL = p.x - reach - 8 - lw >= L.safe.l;
      let dx = (left ? (fitsL || !fitsR ? -1 : 1) : (fitsR || !fitsL ? 1 : -1)) * reach;
      if (dx > 0 && p.x + dx + 8 + lw > L.safe.r) dx = Math.max(12, L.safe.r - lw - 8 - p.x);
      if (dx < 0 && p.x + dx - 8 - lw < L.safe.l) dx = -Math.max(12, p.x - L.safe.l - lw - 8);
      let dy = p.y < L.safe.t + 150 ? 90 : -90;
      if (p.y + dy < L.safe.t + 40) dy = L.safe.t + 40 - p.y;
      if (p.y + dy > L.lower.y - 90) dy = L.lower.y - 90 - p.y;
      return <Callout p={p} a={a} text={x.text} sub={x.sub} dx={dx} dy={dy} W={L.W} H={L.H} size={L.tag} />;
    }
    case "card": {
      const left = (x.pos ?? "l") === "l";
      const cx = L.portrait ? L.safe.l : left ? 120 : 1920 - 120 - L.card.w;
      return (
        <Card x={cx} y={L.portrait ? avoid(L.card.y + 40 + x.lines.length * 25, 80 + x.lines.length * 50, face, L) - 40 - x.lines.length * 25 : L.card.y} w={L.card.w} a={a}>
          {x.title ? <div style={{ fontSize: L.card.title, fontWeight: 600, color: CYAN, letterSpacing: "0.06em", marginBottom: 16 }}>{x.title}</div> : null}
          {x.lines.map((l, i) => (
            <div key={i} style={{ fontSize: L.card.line, lineHeight: 1.45, color: INK, opacity: ease((t - u.t0 - 0.35 - i * 0.45) / 0.4), display: "flex", gap: 14 }}>
              <span style={{ color: AMBER }}>•</span><span>{l}</span>
            </div>
          ))}
        </Card>
      );
    }
    case "stamp": return <Stamp x={L.stamp[0]} y={L.portrait ? avoid(L.stamp[1], 110, face, L) : L.stamp[1] + 40 * bars} a={a} text={x.text} size={L.portrait ? 72 : 64} />;
    case "clock": return <Clock a={a} text={x.text} sub={x.sub} y={L.portrait ? avoid(L.clock, 200, face, L) : L.clock} />;
    case "steps": {
      const k = ease((t - u.t0 - 0.3) / Math.max(0.5, (u.t1 - u.t0) * 0.6));
      return L.steps.vertical
        ? <Flow x={L.steps.x - L.steps.w / 2} y={L.steps.y} a={a} items={x.items} k={k * x.items.length} w={L.steps.w} vertical />
        : <Flow x={960 - (x.items.length * 330) / 2} y={540} a={a} items={x.items} k={k} />;
    }
  }
  return null;
};

/** word-timed caption line, current word lit (the brand accent when it reads, else warm yellow) */
const Captions: React.FC<{ plan: Plan; t: number; L: Lay; hide: number }> = ({ plan, t, L, hide }) => {
  const c = plan.captions.find((x) => t >= x.t0 - 0.04 && t < x.t1);
  if (!c || hide > 0.98) return null;
  const a = ease((t - c.t0 + 0.04) / 0.1) * (1 - ease((t - c.t1 + 0.12) / 0.12)) * (1 - hide);
  const hot = plan.brand?.accent && /^#[0-9a-f]{6}$/i.test(plan.brand.accent) ? plan.brand.accent : "#ffd76a";
  // the line sits on its own dark plate: an outline alone vanishes on a bright or same-coloured background (a
  // yellow shirt under the lit yellow word)
  return (
    <div style={{ position: "absolute", left: (L.safe.l + L.safe.r) / 2 - L.cap.w / 2, width: L.cap.w, top: L.cap.y, transform: `translateY(-50%) scale(${0.96 + 0.04 * a})`, textAlign: "center", opacity: a, fontFamily: FONT, fontWeight: 800, fontSize: L.cap.size, lineHeight: 1.12, letterSpacing: "0.01em" }}>
      <span style={{ display: "inline", padding: `${L.cap.size * 0.1}px ${L.cap.size * 0.3}px`, borderRadius: L.cap.size * 0.26, background: "rgba(8,10,14,0.62)", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>
        {c.words.map((w, i) => {
          const on = t >= w.t0 - 0.02 && t < w.t1 + 0.05;
          return <span key={i} style={{ color: on ? hot : "#ffffff", paintOrder: "stroke fill", WebkitTextStroke: "6px rgba(0,0,0,0.85)", textShadow: "0 3px 10px rgba(0,0,0,0.6)" }}>{w.w}{i < c.words.length - 1 ? " " : ""}</span>;
        })}
      </span>
    </div>
  );
};

export const FilmOverlay: React.FC<{ plan: Plan; t: number; cam: Cam }> = ({ plan, t, cam }) => {
  const L = plan.format === "portrait" ? PORTRAIT : LANDSCAPE;
  const bars = plan.bars(t);
  const tc = plan.titleCard, dc = plan.disclaimer, ec = plan.endCard, br = plan.brand;
  const ta = tc ? span(t, tc.t0, tc.t1, 0.9, 0.8) : 0;
  const da = dc ? span(t, dc.t0, dc.t1, 0.6, 0.6) : 0;
  const ea = ease((t - ec.t0) / 1.2) * (1 - ease((t - (ec.t1 - 0.9)) / 0.9));
  // once the end card is up the story's overlays are done: they never come back while it fades out
  const eOn = ease((t - ec.t0) / 1.2);
  const ia = br?.intro ? span(t, br.intro.t0, br.intro.t1, 0.25, 0.35) : 0;
  const face = L.portrait ? faceOf(plan, t, cam, L) : null;
  const col: React.CSSProperties = L.portrait ? { position: "absolute", left: L.safe.l, right: L.W - L.safe.r, top: 0, bottom: 0 } : { position: "absolute", inset: 0 };
  return (
    <div style={{ position: "absolute", inset: 0, fontFamily: FONT }}>
      {L.portrait ? <PortraitShade /> : null}
      {plan.ui.map((u, i) => (t >= u.t0 - 0.1 && t <= u.t1 + 0.1 ? <UiItem key={i} u={u} t={t} cam={cam} plan={plan} bars={bars} L={L} face={face} dim={1 - Math.max(ta, eOn, ia)} /> : null))}
      {L.portrait ? null : <Letterbox k={bars} />}
      <Captions plan={plan} t={t} L={L} hide={Math.max(ta, eOn, ia)} />
      {br?.watermark && br.logo && eOn < 0.5 ? <Img src={staticFile(br.logo)} style={L.portrait ? { position: "absolute", right: L.W - L.safe.r, top: L.safe.b - 82, height: 72, opacity: 0.7 } : { position: "absolute", left: L.safe.l, top: L.safe.t + 30, height: 56, opacity: 0.7 }} /> : null}
      {ia > 0.001 && br ? (
        <div style={{ ...col, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#e9eef8", opacity: ia }}>
          {br.logo ? <Img src={staticFile(br.logo)} style={{ height: L.portrait ? 150 : 120, marginBottom: 26 }} /> : null}
          {br.name ? <div style={{ fontSize: L.portrait ? 44 : 38, fontWeight: 300, letterSpacing: "0.32em", paddingLeft: "0.32em", textAlign: "center" }}>{br.name}</div> : null}
        </div>
      ) : null}
      {ta > 0.001 && tc ? (
        <div style={{ ...col, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#e9eef8", background: L.portrait ? undefined : `rgba(0,0,0,${0.35 * ta})` }}>
          {L.portrait ? <div style={{ position: "absolute", left: -L.safe.l, right: -(L.W - L.safe.r), top: 0, bottom: 0, background: `rgba(0,0,0,${0.35 * ta})` }} /> : null}
          {tc.kicker ? <div style={{ position: "relative", fontSize: L.portrait ? 26 : 22, fontWeight: 500, letterSpacing: "0.45em", opacity: ta * 0.75, marginBottom: 26, paddingLeft: "0.45em", textAlign: "center" }}>{tc.kicker}</div> : null}
          <div style={{ position: "relative", fontSize: L.portrait ? 76 : 74, fontWeight: 200, whiteSpace: L.portrait ? "normal" : "nowrap", textAlign: "center", lineHeight: 1.15, letterSpacing: `${(L.portrait ? 0.24 : 0.42) - 0.1 * ta}em`, paddingLeft: "0.2em", opacity: ta, textShadow: "0 0 40px rgba(120,150,220,0.35)" }}>{tc.text}</div>
          {tc.sub ? <><div style={{ position: "relative", width: 120 * ta, height: 1, background: "rgba(233,238,248,0.6)", margin: "30px 0 26px" }} /><div style={{ position: "relative", fontSize: L.portrait ? 34 : 30, fontWeight: 300, letterSpacing: "0.04em", opacity: ta * 0.85, textAlign: "center" }}>{tc.sub}</div></> : null}
        </div>
      ) : null}
      {da > 0.001 && dc ? <div style={{ position: "absolute", left: L.safe.l, maxWidth: L.safe.r - L.safe.l, ...(L.portrait ? { top: L.safe.t + 10 } : { bottom: 70 + 84 * bars }), fontSize: L.portrait ? 26 : 24, fontWeight: 500, color: "#dfe6f2", opacity: da * 0.9, letterSpacing: "0.04em", textShadow: "0 2px 12px #000" }}>{dc.text}</div> : null}
      {ea > 0.001 ? (
        <div style={{ position: "absolute", inset: 0, background: `rgba(2,4,8,${0.85 * ea})` }}>
          <div style={{ ...col, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#e9eef8" }}>
            <div style={{ fontSize: L.portrait ? 64 : 64, fontWeight: 200, letterSpacing: L.portrait ? "0.2em" : "0.3em", paddingLeft: "0.2em", opacity: ea, whiteSpace: L.portrait ? "normal" : "nowrap", textAlign: "center", lineHeight: 1.2 }}>{ec.text}</div>
            {ec.sub ? <div style={{ fontSize: L.portrait ? 32 : 28, fontWeight: 300, marginTop: 26, opacity: ea * 0.8, textAlign: "center" }}>{ec.sub}</div> : null}
            {br ? (
              <div style={{ marginTop: L.portrait ? 90 : 60, display: "flex", flexDirection: "column", alignItems: "center", opacity: ease((t - ec.t0 - 0.5) / 0.8) * ea }}>
                {br.logo ? <Img src={staticFile(br.logo)} style={{ height: L.portrait ? 130 : 96, marginBottom: 22 }} /> : null}
                {br.name ? <div style={{ fontSize: L.portrait ? 40 : 34, fontWeight: 600, letterSpacing: "0.08em" }}>{br.name}</div> : null}
                {br.handle ? <div style={{ fontSize: L.portrait ? 32 : 28, fontWeight: 400, marginTop: 10, color: br.accent ?? CYAN }}>{br.handle}</div> : null}
                {br.cta ? <div style={{ fontSize: L.portrait ? 30 : 26, fontWeight: 400, marginTop: 18, opacity: 0.85, textAlign: "center", maxWidth: L.safe.r - L.safe.l }}>{br.cta}</div> : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

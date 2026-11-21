// Procedural set textures (drawn once, deterministic, no files): plaster, panel doors, breeze
// blocks, gypsum ceiling, concrete, LED clock, the phone screen states, poster.

import { canvasTex } from "../mats.ts";
import { mulberry32 } from "../../kits/worldforge/noise.ts";

/** Mottled wall paint with a little grime toward the bottom (grey, multiplied by the material colour). */
export const plasterTex = (key: string, rep: [number, number] = [1, 1], grime = 0.25) =>
  canvasTex(`plaster${key}`, 512, 512, (g, w, h) => {
    const r = mulberry32(31);
    g.fillStyle = "#e9e9e9";
    g.fillRect(0, 0, w, h);
    for (let k = 0; k < 900; k++) {
      g.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "90,90,90"},${0.015 + r() * 0.03})`;
      g.beginPath();
      g.ellipse(r() * w, r() * h, 6 + r() * 40, 4 + r() * 24, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    const gr = g.createLinearGradient(0, h * 0.55, 0, h);
    gr.addColorStop(0, "rgba(60,50,40,0)");
    gr.addColorStop(1, `rgba(60,50,40,${grime})`);
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    for (let k = 0; k < 40; k++) {
      g.strokeStyle = `rgba(70,60,50,${0.03 + r() * 0.05})`;
      g.lineWidth = 1 + r() * 2;
      const x = r() * w;
      g.beginPath();
      g.moveTo(x, h * (0.6 + r() * 0.3));
      g.lineTo(x + (r() - 0.5) * 6, h);
      g.stroke();
    }
  }, rep);

/** Varnished plywood panel door: vertical grain, four recessed panels, wear around the handle. */
export const doorTex = (key: string, base = "#5a3520") =>
  canvasTex(`door${key}`, 512, 1024, (g, w, h) => {
    const r = mulberry32(key.length * 13 + 7);
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let k = 0; k < 160; k++) {
      g.strokeStyle = `rgba(${r() > 0.6 ? "120,80,50" : "25,12,6"},${0.08 + r() * 0.14})`;
      g.lineWidth = 0.6 + r() * 2.2;
      const x = r() * w;
      g.beginPath();
      g.moveTo(x, 0);
      g.bezierCurveTo(x + (r() - 0.5) * 30, h * 0.33, x + (r() - 0.5) * 30, h * 0.66, x + (r() - 0.5) * 16, h);
      g.stroke();
    }
    const panel = (x: number, y: number, pw: number, ph: number) => {
      g.strokeStyle = "rgba(15,8,4,0.7)";
      g.lineWidth = 7;
      g.strokeRect(x, y, pw, ph);
      g.strokeStyle = "rgba(160,110,70,0.25)";
      g.lineWidth = 3;
      g.strokeRect(x + 6, y + 6, pw - 12, ph - 12);
    };
    panel(60, 60, 170, 400); panel(282, 60, 170, 400);
    panel(60, 540, 170, 420); panel(282, 540, 170, 420);
    const gr = g.createRadialGradient(w * 0.9, h * 0.52, 0, w * 0.9, h * 0.52, 120);
    gr.addColorStop(0, "rgba(20,10,4,0.35)");
    gr.addColorStop(1, "rgba(20,10,4,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  });

/** Plank door for the gudang (rougher, paint flaking). */
export const plankDoorTex = () =>
  canvasTex("plankdoor", 512, 1024, (g, w, h) => {
    const r = mulberry32(77);
    const n = 6;
    for (let i = 0; i < n; i++) {
      g.fillStyle = `hsl(${24 + r() * 8}, ${20 + r() * 10}%, ${16 + r() * 7}%)`;
      g.fillRect((i * w) / n, 0, w / n, h);
      for (let k = 0; k < 30; k++) {
        g.strokeStyle = `rgba(0,0,0,${0.1 + r() * 0.2})`;
        g.lineWidth = 0.5 + r() * 2;
        const x = (i * w) / n + r() * (w / n);
        g.beginPath();
        g.moveTo(x, 0);
        g.lineTo(x + (r() - 0.5) * 10, h);
        g.stroke();
      }
      g.fillStyle = "rgba(0,0,0,0.7)";
      g.fillRect((i * w) / n, 0, 4, h);
    }
    g.fillStyle = "rgba(40,24,14,0.9)";
    g.fillRect(0, h * 0.18, w, 40);
    g.fillRect(0, h * 0.78, w, 40);
  });

/** Breeze block (roster) pattern: white = solid, black = hole (used as alpha map). */
export const rosterTex = () =>
  canvasTex("roster", 512, 128, (g, w, h) => {
    g.fillStyle = "#fff";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#000";
    const cell = 64;
    for (let x = 0; x < w; x += cell) {
      g.beginPath();
      g.ellipse(x + cell / 2, h / 2, cell * 0.3, h * 0.36, 0, 0, Math.PI * 2);
      g.fill();
      g.fillRect(x + cell * 0.12, h * 0.12, cell * 0.12, h * 0.76);
      g.fillRect(x + cell * 0.76, h * 0.12, cell * 0.12, h * 0.76);
    }
  }, undefined, false);

/** Gypsum ceiling boards with seams. */
export const ceilTex = (rep: [number, number]) =>
  canvasTex(`ceil${rep}`, 256, 512, (g, w, h) => {
    const r = mulberry32(41);
    g.fillStyle = "#ececea";
    g.fillRect(0, 0, w, h);
    for (let k = 0; k < 300; k++) {
      g.fillStyle = `rgba(0,0,0,${r() * 0.02})`;
      g.fillRect(r() * w, r() * h, 2 + r() * 8, 2 + r() * 8);
    }
    g.fillStyle = "rgba(0,0,0,0.22)";
    g.fillRect(0, 0, w, 2);
    g.fillRect(0, 0, 2, h);
  }, rep);

export const concreteTex = (rep: [number, number]) =>
  canvasTex(`concrete${rep}`, 512, 512, (g, w, h) => {
    const r = mulberry32(53);
    g.fillStyle = "#8c8a86";
    g.fillRect(0, 0, w, h);
    for (let k = 0; k < 3000; k++) {
      g.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "0,0,0"},${0.02 + r() * 0.05})`;
      g.fillRect(r() * w, r() * h, 1 + r() * 4, 1 + r() * 4);
    }
    for (let k = 0; k < 12; k++) {
      g.strokeStyle = `rgba(0,0,0,${0.08 + r() * 0.1})`;
      g.lineWidth = 1;
      g.beginPath();
      let x = r() * w, y = r() * h;
      g.moveTo(x, y);
      for (let s = 0; s < 8; s++) { x += (r() - 0.5) * 60; y += (r() - 0.5) * 60; g.lineTo(x, y); }
      g.stroke();
    }
  }, rep);

/** 7-segment LED digits (red), e.g. "02:17"; `colon` toggles the blinking colon. */
export const ledTex = (text: string, colon: boolean) =>
  canvasTex(`led${text}${colon}`, 512, 192, (g, w, h) => {
    g.fillStyle = "#000";
    g.fillRect(0, 0, w, h);
    const SEG: Record<string, string> = { "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcfgd" };
    const digit = (x: number, ch: string) => {
      const on = SEG[ch] ?? "";
      const sw = 70, sh = 130, t = 13, y = 30;
      const seg = (id: string, x0: number, y0: number, ww: number, hh: number) => {
        g.fillStyle = on.includes(id) ? "#ff3b2a" : "rgba(255,40,20,0.07)";
        g.beginPath();
        g.roundRect(x0, y0, ww, hh, 5);
        g.fill();
      };
      seg("a", x + t, y, sw - 2 * t, t);
      seg("g", x + t, y + sh / 2 - t / 2, sw - 2 * t, t);
      seg("d", x + t, y + sh - t, sw - 2 * t, t);
      seg("f", x, y + t, t, sh / 2 - t);
      seg("b", x + sw - t, y + t, t, sh / 2 - t);
      seg("e", x, y + sh / 2, t, sh / 2 - t);
      seg("c", x + sw - t, y + sh / 2, t, sh / 2 - t);
    };
    const chars = text.replace(":", "");
    const xs = [40, 135, 270, 365];
    chars.split("").forEach((c, i) => digit(xs[i], c));
    g.fillStyle = colon ? "#ff3b2a" : "rgba(255,40,20,0.07)";
    g.beginPath(); g.arc(236, 70, 8, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(236, 126, 8, 0, Math.PI * 2); g.fill();
  }, undefined, true);

export type PhoneState = "off" | "notif";
export type PhoneMsg = { from?: string; text?: string; time?: string; date?: string };
/** Phone screen: lock screen with one notification (sender + up to two lines). Readable in an insert. */
export const phoneScreenTex = (state: PhoneState, msg: PhoneMsg = {}) =>
  canvasTex(`phone${state}${JSON.stringify(msg)}`, 720, 1440, (g, w, h) => {
    if (state === "off") {
      g.fillStyle = "#000";
      g.fillRect(0, 0, w, h);
      return;
    }
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, "#1a2b4a");
    gr.addColorStop(0.55, "#0e1830");
    gr.addColorStop(1, "#24183a");
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    // soft wallpaper shapes
    for (const [x, y, rr, c] of [[180, 420, 260, "rgba(80,120,200,0.18)"], [560, 980, 320, "rgba(120,80,180,0.14)"]] as const) {
      const rg = g.createRadialGradient(x, y, 0, x, y, rr);
      rg.addColorStop(0, c);
      rg.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = rg;
      g.fillRect(0, 0, w, h);
    }
    g.fillStyle = "#eaf2ff";
    g.textAlign = "center";
    g.font = "500 38px Manrope, sans-serif";
    g.fillText(msg.date ?? "Sabtu, 8 Maret", w / 2, 200);
    g.font = "300 190px Manrope, sans-serif";
    g.fillText(msg.time ?? "23.47", w / 2, 390);
    // notification card
    const x = 40, y = 520, cw = w - 80, ch = 270;
    g.fillStyle = "rgba(235,240,250,0.9)";
    g.beginPath();
    g.roundRect(x, y, cw, ch, 44);
    g.fill();
    g.fillStyle = "#2f8f63";
    g.beginPath();
    g.roundRect(x + 34, y + 34, 76, 76, 20);
    g.fill();
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.ellipse(x + 72, y + 68, 22, 18, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(x + 58, y + 80); g.lineTo(x + 52, y + 94); g.lineTo(x + 70, y + 84); g.fill();
    g.textAlign = "left";
    g.fillStyle = "#11151d";
    g.font = "700 44px Manrope, sans-serif";
    g.fillText(msg.from ?? "Pesan baru", x + 134, y + 70);
    g.fillStyle = "#59606c";
    g.font = "500 30px Manrope, sans-serif";
    g.textAlign = "right";
    g.fillText("sekarang", x + cw - 36, y + 68);
    g.textAlign = "left";
    g.fillStyle = "#1b2029";
    g.font = "500 38px Manrope, sans-serif";
    // wrap the message into two lines
    const words = (msg.text ?? "Kamu sudah sampai?").split(" ");
    const lines = [""];
    for (const wd of words) { const tryL = (lines[lines.length - 1] + " " + wd).trim(); if (g.measureText(tryL).width > cw - 72 && lines.length < 2) lines.push(wd); else lines[lines.length - 1] = tryL; }
    lines.forEach((l, i) => g.fillText(l, x + 36, y + 170 + i * 52));
    g.fillStyle = "rgba(234,242,255,0.75)";
    g.font = "500 30px Manrope, sans-serif";
    g.textAlign = "center";
    g.fillText("Geser ke atas untuk membuka", w / 2, h - 90);
  });

/** Band-style poster for a bedroom wall (abstract, no real artwork). */
export const posterTex = () =>
  canvasTex("poster", 256, 360, (g, w, h) => {
    g.fillStyle = "#1f2a33";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#e4b34a";
    g.beginPath();
    g.arc(w / 2, h * 0.42, 70, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#1f2a33";
    for (let i = 0; i < 6; i++) g.fillRect(0, h * 0.42 + i * 16 - 20, w, 6);
    g.fillStyle = "#e8e1d2";
    g.font = "700 30px Manrope, sans-serif";
    g.textAlign = "center";
    g.fillText("SENJA", w / 2, h * 0.82);
    g.font = "500 13px Manrope, sans-serif";
    g.fillText("LIVE · TOUR 2026", w / 2, h * 0.9);
  });

export const numberTex = (label: string) =>
  canvasTex(`num${label}`, 128, 128, (g, w, h) => {
    g.fillStyle = "#c9c2b0";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#5a5246";
    g.lineWidth = 6;
    g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = "#2a2622";
    g.font = "700 74px Manrope, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(label, w / 2, h / 2 + 4);
  });

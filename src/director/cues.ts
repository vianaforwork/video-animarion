// Spoken-word cues → VO seconds, and the VO's pauses (where cuts like to land).

import type { Cue, Word } from "./story.ts";

export const norm = (w: string) => w.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]/g, "");

export type Cues = {
  words: Word[];
  offset: number;
  voEnd: number;
  /** VO seconds of a cue (throws a plain-language error when the word isn't spoken) */
  at: (c: Cue, label?: string, after?: number) => number;
  /** pauses in the VO: [start, end] VO seconds, gaps ≥ 0.18 s */
  pauses: [number, number][];
  /** the best cut time (VO s) for an action that starts at `v`: a pause just before it, else v − 0.12 */
  cutFor: (v: number) => number;
};

export const makeCues = (words: Word[], offset: number): Cues => {
  const map = new Map<string, number[]>();
  words.forEach(([w, s]) => {
    const k = norm(w);
    if (!k) return;
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(s);
  });
  const pauses: [number, number][] = [];
  for (let i = 1; i < words.length; i++) if (words[i][1] - words[i - 1][2] >= 0.18) pauses.push([words[i - 1][2], words[i][1]]);
  const voEnd = words.length ? words[words.length - 1][2] : 0;
  const toks = words.map(([w]) => norm(w));
  /** VO seconds of a cue. Without "#n" the first occurrence at/after `after` (VO s) is used, so beats
   *  written in order never need counting. A cue may be a short phrase ("di balik"). */
  const at = (c: Cue, label = "cue", after = -1) => {
    if (typeof c === "number") return c;
    const [w, n] = c.split("#");
    const parts = w.split(/\s+/).map(norm).filter(Boolean);
    if (!parts.length) throw new Error(`${label}: empty cue`);
    const hits: number[] = [];
    for (let i = 0; i + parts.length <= toks.length; i++) if (parts.every((p, k) => toks[i + k] === p)) hits.push(words[i][1]);
    if (!hits.length) {
      const k = parts[0];
      const near = [...map.keys()].filter((x) => x.startsWith(k.slice(0, 3))).slice(0, 6);
      throw new Error(`${label}: "${w}" is not spoken in the VO${near.length ? ` (similar words: ${near.join(", ")})` : ""}`);
    }
    if (n !== undefined) {
      const i = Number(n);
      if (!(i >= 0 && i < hits.length)) throw new Error(`${label}: "${w}" is spoken ${hits.length}× — "${c}" asks for occurrence #${n} (use #0…#${hits.length - 1}, or leave "#n" out to take the next one in order)`);
      return hits[i];
    }
    const next = hits.find((h) => h >= after - 0.05);
    if (next === undefined) throw new Error(`${label}: "${w}" is not spoken again after ${after.toFixed(2)} s in the VO (beats must be in VO order; spoken at ${hits.map((h) => h.toFixed(2)).join(", ")} s)`);
    return next;
  };
  const cutFor = (v: number) => {
    // the latest pause that ends just before (or at) the word: cut inside it, shortly before the word
    let best: [number, number] | null = null;
    for (const p of pauses) if (p[1] <= v + 0.05 && p[1] >= v - 0.9 && (!best || p[1] > best[1])) best = p;
    return best ? Math.max(best[0] + 0.05, best[1] - 0.15) : v - 0.12;
  };
  return { words, offset, voEnd, at, pauses, cutFor };
};

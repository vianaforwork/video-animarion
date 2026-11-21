// Character looks library: ready-made people for any story. A story picks a `look` and may override
// colours / features per person (story.cast[].custom); identity then never changes between shots.

import type { CharSpec } from "./Character.tsx";

type Look = Omit<CharSpec, "key">;

export const LOOKS: Record<string, Look> = {
  /** young man, dark blue hoodie, sandals */
  pemuda: {
    skin: "#c08a62", hair: "#120e0b", iris: "#6a4024", lip: "#7c4236", brow: "#120d0a",
    scale: 0.92, headScale: 1.08,
    top: "hoodie", topColor: "#2b3f66", trim: "#eceae4",
    legs: "#3a3c43", feet: "sandal", sandal: "#1e2a44",
    hairStyle: "crop",
    face: { jaw: 0.35, cheek: 0.4, nose: 0.5, brow: 0.45, chin: 0.45 },
  },
  /** young man, mustard t-shirt, messy hair */
  "pemuda-kaos": {
    skin: "#a8744f", hair: "#0f0b09", iris: "#5a3420", lip: "#6e3a30", brow: "#0e0a08",
    scale: 0.95, headScale: 1.1,
    top: "tee", topColor: "#c8962e", trim: "#b5862a",
    legs: "#2c3b55", feet: "sandal", sandal: "#151515",
    hairStyle: "messy",
    face: { jaw: 0.75, cheek: 0.75, nose: 0.35, brow: 0.8, chin: 0.3 },
  },
  /** young woman, long hair, sage jacket */
  pemudi: {
    skin: "#c99572", hair: "#160f0b", iris: "#5b3a22", lip: "#9a4a46", brow: "#1a120d",
    scale: 0.86, headScale: 1.08,
    top: "jacket", topColor: "#7d8f74", trim: "#e9e3d6",
    legs: "#2d3240", feet: "shoe", sandal: "#e8e4dc",
    hairStyle: "long",
    face: { jaw: 0.15, cheek: 0.6, nose: 0.3, brow: 0.25, chin: 0.35 },
  },
  /** young woman, hijab, long-sleeved top */
  "pemudi-hijab": {
    skin: "#c48f68", hair: "#160f0b", iris: "#4d3020", lip: "#94473f", brow: "#1a120d",
    scale: 0.85, headScale: 1.08,
    top: "jacket", topColor: "#b4677a", trim: "#f0e8e2",
    legs: "#33384a", feet: "shoe", sandal: "#2c2c30",
    hairStyle: "crop", hijab: "#e6dccd",
    face: { jaw: 0.2, cheek: 0.65, nose: 0.3, brow: 0.3, chin: 0.35 },
  },
  /** middle-aged man, batik shirt, glasses */
  bapak: {
    skin: "#a7704c", hair: "#3a3632", iris: "#3a2416", lip: "#6a3a30", brow: "#2d2824",
    scale: 0.9, headScale: 1.08,
    top: "tee", topColor: "#7a4a2a", trim: "#5e3820", batik: "#e0b56a", glasses: true,
    legs: "#4a3f35", feet: "sandal", sandal: "#3a2c22",
    hairStyle: "crop",
    face: { jaw: 0.6, cheek: 0.35, nose: 0.6, brow: 0.5, chin: 0.55 },
  },
  /** middle-aged woman, hijab, batik top */
  ibu: {
    skin: "#b98260", hair: "#1a1410", iris: "#4a2e1c", lip: "#8a4440", brow: "#2a2018",
    scale: 0.84, headScale: 1.08,
    top: "jacket", topColor: "#5c3a5e", trim: "#d9c7a8", batik: "#d9b46a",
    legs: "#2f2a33", feet: "sandal", sandal: "#3a2c22",
    hairStyle: "crop", hijab: "#3b4a6b",
    face: { jaw: 0.4, cheek: 0.75, nose: 0.4, brow: 0.35, chin: 0.45 },
  },
  /** old man, grey hair, white beard, cardigan */
  kakek: {
    skin: "#a06e4e", hair: "#c9c6c0", iris: "#3a2a1e", lip: "#6a3c34", brow: "#b8b4ae",
    scale: 0.87, headScale: 1.07,
    top: "jacket", topColor: "#6b5a48", trim: "#d8cdb8",
    legs: "#3d3a36", feet: "sandal", sandal: "#2a2522",
    hairStyle: "crop", beard: "#bdb8b0", glasses: true,
    face: { jaw: 0.55, cheek: 0.3, nose: 0.65, brow: 0.6, chin: 0.5 },
  },
  /** child (about 9), striped tee */
  anak: {
    skin: "#c28c64", hair: "#120e0b", iris: "#5a3a22", lip: "#9a5048", brow: "#16100c",
    scale: 0.66, headScale: 1.22,
    top: "tee", topColor: "#d0573f", trim: "#f2eee6",
    legs: "#2f3f63", feet: "shoe", sandal: "#e8e6e0",
    hairStyle: "messy",
    face: { jaw: 0.1, cheek: 0.85, nose: 0.15, brow: 0.2, chin: 0.2 },
  },
  /** nurse: white hijab, teal scrubs, white shoes */
  perawat: {
    skin: "#c08b66", hair: "#160f0b", iris: "#4d3020", lip: "#9a4a46", brow: "#1a120d",
    scale: 0.85, headScale: 1.08,
    top: "jacket", topColor: "#8fcac6", trim: "#eef6f5",
    legs: "#8fcac6", feet: "shoe", sandal: "#f2f2ee",
    hairStyle: "crop", hijab: "#d6dfe0",
    face: { jaw: 0.25, cheek: 0.6, nose: 0.3, brow: 0.3, chin: 0.35 },
  },
  /** doctor: white coat, glasses, short hair */
  dokter: {
    skin: "#b98262", hair: "#1a1410", iris: "#3a2416", lip: "#7a4036", brow: "#1a1410",
    scale: 0.92, headScale: 1.07,
    top: "jacket", topColor: "#f2f3f0", trim: "#cfd6dc",
    legs: "#2d3240", feet: "shoe", sandal: "#2a2522",
    hairStyle: "crop", glasses: true,
    face: { jaw: 0.55, cheek: 0.4, nose: 0.55, brow: 0.5, chin: 0.5 },
  },
  /** market seller: patterned top, apron-coloured jacket, hijab */
  pedagang: {
    skin: "#a8724e", hair: "#1a1410", iris: "#4a2e1c", lip: "#8a4440", brow: "#2a2018",
    scale: 0.84, headScale: 1.09,
    top: "jacket", topColor: "#2f6f6a", trim: "#e8d7b0",
    legs: "#3a3340", feet: "sandal", sandal: "#2a2522",
    hairStyle: "crop", hijab: "#c98a3a",
    face: { jaw: 0.5, cheek: 0.8, nose: 0.45, brow: 0.35, chin: 0.45 },
  },
  /** hiker / camper: orange jacket, knit cap */
  pendaki: {
    skin: "#b98260", hair: "#120e0b", iris: "#5a3a22", lip: "#8a4a40", brow: "#16100c",
    scale: 0.92, headScale: 1.08,
    top: "jacket", topColor: "#d0662a", trim: "#2b2f36",
    legs: "#3a4250", feet: "shoe", sandal: "#3a3028",
    hairStyle: "crop", cap: "#2f4a6a",
    face: { jaw: 0.45, cheek: 0.45, nose: 0.5, brow: 0.5, chin: 0.45 },
  },
  /** lighthouse keeper / fisherman: knit cap, grey beard, navy jacket */
  "penjaga-mercusuar": {
    skin: "#9c6646", hair: "#8f8b85", iris: "#3a2a1e", lip: "#6a3a30", brow: "#77736d",
    scale: 0.92, headScale: 1.07,
    top: "jacket", topColor: "#26354d", trim: "#c9b48a",
    legs: "#3b3a38", feet: "shoe", sandal: "#2b2420",
    hairStyle: "crop", cap: "#8a3a2c", beard: "#77726c",
    face: { jaw: 0.7, cheek: 0.35, nose: 0.65, brow: 0.7, chin: 0.55 },
  },
};

export type CustomLook = Partial<Omit<CharSpec, "key" | "face">> & { face?: Partial<CharSpec["face"]> };

export const lookSpec = (key: string, look: string, custom?: CustomLook): CharSpec => {
  const base = LOOKS[look];
  if (!base) throw new Error(`unknown look "${look}" (use one of: ${Object.keys(LOOKS).join(", ")})`);
  return { ...base, ...custom, face: { ...base.face, ...(custom?.face ?? {}) }, key };
};

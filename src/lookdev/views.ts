import type { LookView } from "./WorldLook.tsx";

export const COAST_VIEWS: LookView[] = [
  { label: "establish (night)", place: "cliff", time: "night", cam: { pos: [26, 24, 22], target: [2, 16, -2], fov: 38 }, s: { seaLight: 1 } },
  { label: "from the sea", place: "cliff", time: "night", cam: { pos: [-10, 6, -48], target: [2, 18, 0], fov: 40 } },
  { label: "edge looking out", place: "cliff", time: "night", cam: { pos: [4.2, 13.6, -3.5], target: [-40, 2, -200], fov: 40 }, s: { seaLight: 1, fog: 0.6 } },
  { label: "long lens sea light", place: "cliff", time: "night", cam: { pos: [2.4, 13.6, -6.8], target: [-48, 4, -235], fov: 6 }, s: { seaLight: 1, fog: 0.4 } },
  { label: "gallery", place: "gallery", time: "night", cam: { pos: [3.6, 29.6, -3.8], target: [0, 29.5, 0], fov: 40 }, s: { seaLight: 1 } },
  { label: "cottage interior", place: "cottage", time: "night", cam: { pos: [8.0, 13.55, 1.9], target: [10.6, 12.95, -1.6], fov: 50 } },
  { label: "boat at night", place: "sea", time: "night", cam: { pos: [-36, 5, -215], target: [-48, 2.5, -235], fov: 35 }, s: { boat: 1, seaLight: 1, fog: 0.4 } },
  { label: "boat revealed (dawn)", place: "sea", time: "dawn", cam: { pos: [-30, 6, -205], target: [-48, 2, -235], fov: 35 }, s: { boat: 1, seaLight: 1, fog: 0.3 } },
  { label: "day establish", place: "cliff", time: "day", cam: { pos: [26, 24, 22], target: [2, 16, -2], fov: 38 } },
];

export const KOS_VIEWS: LookView[] = [
  { label: "hall night", place: "hall", time: "night", cam: { pos: [0.3, 1.55, -1.0], target: [-0.2, 1.4, -15], fov: 40 } },
  { label: "hall lamps on", place: "hall", time: "night", s: { tubes: 1 }, cam: { pos: [0.3, 1.55, -1.0], target: [-0.2, 1.4, -15], fov: 40 } },
  { label: "room night", place: "room", time: "night", cam: { pos: [-1.3, 1.6, -4.2], target: [-3.4, 0.9, -6.2], fov: 50 } },
  { label: "room day", place: "room", time: "day", cam: { pos: [-1.3, 1.6, -4.2], target: [-3.4, 0.9, -6.2], fov: 50 } },
  { label: "yard night", place: "yard", time: "night", cam: { pos: [2.5, 2.2, 7.5], target: [0, 1.6, 0.5], fov: 42 } },
  { label: "end of hall", place: "hall", time: "night", cam: { pos: [0.1, 1.55, -9.5], target: [-0.3, 1.45, -15], fov: 26 } },
];

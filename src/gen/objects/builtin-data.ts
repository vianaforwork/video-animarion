// Built-in objects drawn by code (organic shapes that primitives cannot make well: trees, bushes, rocks,
// ferns). Metadata only — the renderer is builtin.tsx. Everything else lives in library/objects/*.json.
import type { V3 } from "../spec.ts";

/** `solid`: the part that blocks bodies and cameras [min, max] in local metres (trees: the trunk); default = bounds.
 *  `crown`: foliage a camera must not sit inside (the view may pass through it). */
export type BuiltinMeta = { doc: string; bounds: V3; anchors?: Record<string, V3>; walkable?: boolean; hand?: boolean; states?: Record<string, number>; solid?: [V3, V3]; crown?: [V3, V3] };

export const BUILTIN: Record<string, BuiltinMeta> = {
  "tree-pine": { doc: "tall conifer (forest, hills)", bounds: [3.2, 11, 3.2], solid: [[-0.2, 0, -0.2], [0.2, 4, 0.2]], crown: [[-1.45, 1.5, -1.45], [1.45, 11, 1.45]] },
  "tree-broad": { doc: "broad-leaf tree with a round crown (forest, parks, villages)", bounds: [5, 8, 5], solid: [[-0.28, 0, -0.28], [0.28, 4.6, 0.28]], crown: [[-2.5, 3.6, -2.2], [2.7, 8, 2.5]] },
  "tree-palm": { doc: "coconut palm (coast, villages)", bounds: [4, 9, 4], solid: [[-0.18, 0, -0.18], [0.75, 8.2, 0.18]], crown: [[-1.8, 7.4, -2.3], [3.3, 9.2, 2.3]] },
  bush: { doc: "leafy bush ~1 m", bounds: [1.4, 1.0, 1.4], crown: [[-0.75, 0, -0.7], [0.8, 1.0, 0.7]] },
  fern: { doc: "low fern / undergrowth", bounds: [0.9, 0.5, 0.9], walkable: true },
  rock: { doc: "mossy rock ~0.8 m", bounds: [1.0, 0.6, 0.9] },
  log: { doc: "fallen mossy log ~3 m", bounds: [3.2, 0.5, 0.5] },
  "grass-tuft": { doc: "grass tuft (scatter only)", bounds: [0.3, 0.35, 0.3], walkable: true },
};

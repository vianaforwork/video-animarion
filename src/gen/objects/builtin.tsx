// Built-in organic objects (trees, bushes, ferns, rocks, logs, grass). Each is a short list of parts
// (geometry + material + local matrix); one object renders the parts, a scatter renders each part as one
// InstancedMesh over all items (hundreds of trees stay cheap).

import React, { useMemo } from "react";
import { BufferGeometry, Color, ConeGeometry, CylinderGeometry, IcosahedronGeometry, InstancedMesh, type Material, Matrix4, Quaternion, Vector3, Euler } from "three";
import { cached } from "../../kits/worldforge/geo.ts";
import { fbm } from "../../kits/worldforge/noise.ts";
import { phys } from "../../cine/mats.ts";
import type { V3 } from "../spec.ts";

type BPart = { geo: BufferGeometry; mat: Material; m: Matrix4; tint?: boolean };

const blob = (key: string, seed: number, k = 0.3) =>
  cached(`blob${key}`, () => {
    const g = new IcosahedronGeometry(1, 2);
    const a = g.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const v = new Vector3(a.getX(i), a.getY(i), a.getZ(i));
      v.multiplyScalar(1 + k * fbm(v.x * 1.6 + seed, v.y * 1.6 + v.z * 1.3, 3));
      a.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  });
const M = (p: V3, s: V3 = [1, 1, 1], r: V3 = [0, 0, 0]) => new Matrix4().compose(new Vector3(...p), new Quaternion().setFromEuler(new Euler(...r)), new Vector3(...s));
const bark = () => phys("bBark", { color: "#4b3a2b", roughness: 0.95 });
const needle = () => phys("bNeedle", { color: "#ffffff", roughness: 0.85 });
const leafM = () => phys("bLeaf", { color: "#ffffff", roughness: 0.8, sheen: 0.3, sheenColor: "#d8ffc0" });

export const builtinParts = (id: string): BPart[] =>
  (({
    "tree-pine": () => [
      { geo: cached("bTrunkPine", () => new CylinderGeometry(0.1, 0.2, 4, 10)), mat: bark(), m: M([0, 2, 0]) },
      ...[0, 1, 2, 3, 4].map((k) => ({ geo: cached("bCone", () => new ConeGeometry(1, 1, 9)), mat: needle(), m: M([0, 2.6 + k * 1.6, 0], [1.65 - k * 0.27, 2.6, 1.65 - k * 0.27], [0, k * 0.7, 0]), tint: true })),
    ],
    "tree-broad": () => [
      { geo: cached("bTrunkBroad", () => new CylinderGeometry(0.16, 0.3, 4.6, 10)), mat: bark(), m: M([0, 2.3, 0]) },
      { geo: cached("bBranch", () => new CylinderGeometry(0.06, 0.1, 2.2, 7)), mat: bark(), m: M([0.6, 4.2, 0.1], [1, 1, 1], [0, 0, -0.7]) },
      { geo: cached("bBranch", () => new CylinderGeometry(0.06, 0.1, 2.2, 7)), mat: bark(), m: M([-0.5, 4.0, -0.3], [1, 1, 1], [0.3, 0, 0.8]) },
      ...([[0, 5.6, 0, 2.1], [1.3, 5.0, 0.4, 1.5], [-1.2, 5.1, -0.3, 1.6], [0.2, 6.6, -0.6, 1.4], [-0.3, 5.2, 1.2, 1.4]] as number[][]).map(([x, y, z, r], k) => ({ geo: blob(`crown${k % 3}`, k * 3.1, 0.35), mat: leafM(), m: M([x, y, z], [r, r * 0.82, r]), tint: true })),
    ],
    "tree-palm": () => [
      ...[0, 1, 2, 3].map((k) => ({ geo: cached("bPalmSeg", () => new CylinderGeometry(0.13, 0.16, 2.2, 9)), mat: bark(), m: M([k * 0.18, 1.1 + k * 2.05, 0], [1, 1, 1], [0, 0, -0.09]) })),
      ...[0, 1, 2, 3, 4, 5, 6].map((k) => ({ geo: cached("bFrond", () => new ConeGeometry(0.35, 3.0, 4)), mat: leafM(), m: M([0.75 + Math.sin((k / 7) * 6.28) * 1.2, 8.3, Math.cos((k / 7) * 6.28) * 1.2], [1, 1, 0.18], [Math.cos((k / 7) * 6.28) * 1.2, (k / 7) * 6.28, -Math.sin((k / 7) * 6.28) * 1.2]), tint: true })),
    ],
    bush: () => ([[0, 0.45, 0, 0.55], [0.35, 0.38, 0.15, 0.42], [-0.3, 0.36, -0.1, 0.45]] as number[][]).map(([x, y, z, r], k) => ({ geo: blob(`bush${k}`, k * 5.7, 0.3), mat: leafM(), m: M([x, y, z], [r, r * 0.85, r]), tint: true })),
    fern: () => [0, 1, 2, 3, 4, 5].map((k) => ({ geo: cached("bFernLeaf", () => new ConeGeometry(0.09, 0.6, 3)), mat: leafM(), m: M([Math.sin(k) * 0.18, 0.2, Math.cos(k) * 0.18], [1, 1, 0.25], [Math.cos(k) * 1.1, k, -Math.sin(k) * 1.1]), tint: true })),
    rock: () => [{ geo: blob("rock", 2.2, 0.3), mat: phys("bRock", { color: "#ffffff", roughness: 0.93, flatShading: true }), m: M([0, 0.22, 0], [0.5, 0.32, 0.45]), tint: true }],
    log: () => [
      { geo: cached("bLog", () => new CylinderGeometry(0.22, 0.25, 3.0, 12)), mat: bark(), m: M([0, 0.22, 0], [1, 1, 1], [0, 0, Math.PI / 2]) },
      { geo: blob("moss", 1.1, 0.25), mat: phys("bMoss", { color: "#3f5a2a", roughness: 0.95 }), m: M([0.3, 0.42, 0], [0.9, 0.08, 0.2]) },
    ],
    "grass-tuft": () => [0, 1, 2, 3].map((k) => ({ geo: cached("bBlade", () => new ConeGeometry(0.03, 0.35, 3).translate(0, 0.175, 0)), mat: leafM(), m: M([Math.sin(k * 1.7) * 0.06, 0, Math.cos(k * 1.7) * 0.06], [1, 1, 1], [Math.sin(k) * 0.3, 0, Math.cos(k) * 0.3]), tint: true })),
  }) as Record<string, () => BPart[]>)[id]?.() ?? [];

const TINT: Record<string, [string, string]> = {
  "tree-pine": ["#1f3a24", "#2d4a2a"], "tree-broad": ["#2f5a2a", "#4a6a2a"], "tree-palm": ["#3f6a2a", "#5a7a30"], bush: ["#2f5228", "#4a6a30"], fern: ["#2f5a28", "#507a34"],
  rock: ["#5e5a55", "#7a756e"], log: ["#ffffff", "#ffffff"], "grass-tuft": ["#3f5a2a", "#6a7a3a"],
};

export const Builtin: React.FC<{ id: string; color?: string }> = ({ id, color }) => {
  const parts = useMemo(() => builtinParts(id), [id]);
  const tint = color ?? TINT[id]?.[0] ?? "#ffffff";
  return (
    <group>
      {parts.map((p, i) => {
        const pos = new Vector3(), q = new Quaternion(), s = new Vector3();
        p.m.decompose(pos, q, s);
        const mat = p.tint ? phys(`bt${id}${tint}${(p.mat as unknown as { uuid: string }).uuid}`, { color: tint, roughness: 0.85 }) : p.mat;
        return <mesh key={i} geometry={p.geo} material={mat} position={pos} quaternion={q} scale={s} castShadow receiveShadow />;
      })}
    </group>
  );
};

/** Many copies of a built-in object as instanced meshes (one per part), tinted per item. */
export const BuiltinScatter: React.FC<{ id: string; items: { pos: V3; yaw: number; scale: number }[]; seed?: number }> = ({ id, items, seed = 1 }) => {
  const meshes = useMemo(() => {
    const parts = builtinParts(id);
    const [c0, c1] = TINT[id] ?? ["#ffffff", "#ffffff"];
    const A = new Color(c0), B = new Color(c1), c = new Color();
    return parts.map((p) => {
      const mat = p.tint ? phys(`bti${(p.mat as unknown as { uuid: string }).uuid}`, { color: "#ffffff", roughness: 0.85, flatShading: id === "rock" }) : p.mat;
      const m = new InstancedMesh(p.geo, mat, items.length);
      items.forEach((it, i) => {
        const W = new Matrix4().compose(new Vector3(...it.pos), new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), it.yaw), new Vector3(it.scale, it.scale, it.scale)).multiply(p.m);
        m.setMatrixAt(i, W);
        if (p.tint) m.setColorAt(i, c.copy(A).lerp(B, ((Math.sin(i * 12.9898 + seed) * 43758.5453) % 1 + 1) % 1));
      });
      m.castShadow = id !== "grass-tuft" && id !== "fern";
      m.receiveShadow = true;
      return m;
    });
  }, [id, items, seed]);
  return <group>{meshes.map((m, i) => <primitive key={i} object={m} />)}</group>;
};

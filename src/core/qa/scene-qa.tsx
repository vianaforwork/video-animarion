// Scene QA probe (anti-tembus, anti-loncat): reads the 3D scene itself, so it knows what passes through what.
//   <Solid id="raka" kind="body">…</Solid>   tags a character, a held/moving prop or a piece of furniture.
//   <QaProbe />                             the last child inside the ThreeCanvas (Stage3D mounts it already).
// In a normal render the probe does nothing. `node scripts/qa-scene.mjs --comp=<id>` renders the composition without
// images and with inputProps.voynannQa set; then, on every frame, the probe logs where each tagged solid and its parts
// are (one-frame jumps, one-frame blinks) and, every few frames, how deep tagged solids pass through each other
// (tembus) and whether the camera can see the place.
// Tag the things that act: every character, everything a hand holds or that moves past a body, and the furniture a
// body sits on, leans on or walks past. Do not tag the ground, the sky, captions or particles. Model a seat or a
// table as closed geometry (a box, not a single plane) so "inside" can be measured.

import React, { useRef } from "react";
import { useFrame, useThree, type ThreeElements } from "@react-three/fiber";
import { getInputProps, Internals, useCurrentFrame } from "remotion";
import { Box3, BufferGeometry, DoubleSide, Frustum, InstancedMesh, Matrix4, Mesh, Object3D, Ray, Raycaster, SkinnedMesh, Vector3, type Material } from "three";
import { MeshBVH, StaticGeometryGenerator } from "three-mesh-bvh";

export type SolidKind = "body" | "prop" | "set";
type Tag = { id: string; kind: SolidKind; touch: string[]; tol?: number; jerk: boolean };

/** Tags everything inside as one solid for the scene QA (renders exactly as a plain group).
 *  kind: "body" a character, "prop" a held or moving object, "set" furniture / walls (set vs set is not checked).
 *  touch: ids of solids this one is meant to touch (a hand on a cup, a sitter on a seat): those pairs may press in
 *  3 × deeper; "*" = anything (a seat, a bed, a bench people sit or lean on). tol: depth in scene units that still reads as touching (default 1.5 % of the smaller solid).
 *  jerk: check its parts for one-frame jumps (default: bodies and props). */
export const Solid: React.FC<Omit<ThreeElements["group"], "id"> & { id: string; kind?: SolidKind; touch?: string[]; tol?: number; jerk?: boolean }> = ({
  id,
  kind = "body",
  touch = [],
  tol,
  jerk,
  children,
  userData,
  ...group
}) => {
  const tag: Tag = { id, kind, touch, tol, jerk: jerk ?? kind !== "set" };
  return (
    <group {...group} userData={{ ...(userData ?? {}), voynannSolid: tag }}>
      {children}
    </group>
  );
};

type QaOpts = { clipEvery?: number; noOverlay?: boolean };
const qaOpts = (): QaOpts | null => {
  try {
    const p = getInputProps() as Record<string, unknown>;
    return (p?.voynannQa as QaOpts) ?? null;
  } catch {
    return null;
  }
};

/** True during the QA pass: the 2D overlay (captions, titles) is left out so only the 3D is scanned for glitches.
 *  Stage3D does it; a kit with its own canvas wraps its overlay in `{qaNoOverlay() ? null : …}`. */
export const qaNoOverlay = (): boolean => !!(qaOpts() as { noOverlay?: boolean } | null)?.noOverlay;

/** Mount once, last inside the ThreeCanvas. Renders nothing; active only under scripts/qa-scene.mjs. */
export const QaProbe: React.FC = () => {
  const opts = qaOpts();
  return opts ? <Probe every={Math.max(1, Math.round(opts.clipEvery ?? 3))} /> : null;
};

// ---------------------------------------------------------------------------------------------------------------

type GeoInfo = { bvh: MeshBVH; closed: boolean; samples: Float32Array };
type Part = { info: GeoInfo; toWorld: Matrix4; toLocal: Matrix4; box: Box3; mesh: Mesh };
type SolidNow = { tag: Tag; group: Object3D; meshes: Mesh[]; box: Box3; diag: number; anchors: { c: number[]; n: number; p: Record<number, number[]> } };

const r4 = (v: number) => Math.round(v * 1e4) / 1e4;

/** Closed (watertight) after welding equal positions: every edge shared by exactly two triangles. */
const closedOf = (g: BufferGeometry): boolean => {
  const pos = g.attributes.position;
  if (!pos || pos.count > 60000) return false;
  if (!g.boundingBox) g.computeBoundingBox();
  const s = g.boundingBox!.getSize(new Vector3()).length() || 1;
  const q = s * 1e-4;
  const ids = new Int32Array(pos.count);
  const weld = new Map<string, number>();
  for (let i = 0; i < pos.count; i++) {
    const k = `${Math.round(pos.getX(i) / q)},${Math.round(pos.getY(i) / q)},${Math.round(pos.getZ(i) / q)}`;
    let v = weld.get(k);
    if (v === undefined) weld.set(k, (v = weld.size));
    ids[i] = v;
  }
  const idx = g.index;
  const tri = idx ? idx.count / 3 : pos.count / 3;
  if (!tri) return false;
  const edges = new Map<number, number>();
  const W = weld.size + 1;
  const add = (a: number, b: number) => {
    if (a === b) return;
    const k = a < b ? a * W + b : b * W + a;
    edges.set(k, (edges.get(k) ?? 0) + 1);
  };
  for (let t = 0; t < tri; t++) {
    const a = ids[idx ? idx.getX(t * 3) : t * 3], b = ids[idx ? idx.getX(t * 3 + 1) : t * 3 + 1], c = ids[idx ? idx.getX(t * 3 + 2) : t * 3 + 2];
    add(a, b);
    add(b, c);
    add(c, a);
  }
  for (const n of edges.values()) if (n !== 2) return false;
  return true;
};

/** Up to `n` points spread over the surface by area (deterministic), in the geometry's own space. */
const surfaceSamples = (g: BufferGeometry, n = 600): Float32Array => {
  const pos = g.attributes.position, idx = g.index;
  const tri = idx ? idx.count / 3 : pos.count / 3;
  const v = (t: number, k: number, out: Vector3) => out.fromBufferAttribute(pos, idx ? idx.getX(t * 3 + k) : t * 3 + k);
  const a = new Vector3(), b = new Vector3(), c = new Vector3(), e1 = new Vector3(), e2 = new Vector3();
  const area = new Float64Array(tri);
  let total = 0;
  for (let t = 0; t < tri; t++) {
    v(t, 0, a), v(t, 1, b), v(t, 2, c);
    total += area[t] = e1.subVectors(b, a).cross(e2.subVectors(c, a)).length() / 2;
  }
  const out: number[] = [];
  // every vertex first (corners and thin limbs), then area-weighted points on the faces
  const stride = Math.max(1, Math.ceil(pos.count / (n / 2)));
  for (let i = 0; i < pos.count; i += stride) out.push(pos.getX(i), pos.getY(i), pos.getZ(i));
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const want = Math.max(0, n - out.length / 3);
  if (total > 0)
    for (let t = 0, acc = 0, next = rnd() * (total / Math.max(1, want)); t < tri && out.length / 3 < n; t++) {
      acc += area[t];
      while (next <= acc && out.length / 3 < n) {
        let u = rnd(), w = rnd();
        if (u + w > 1) (u = 1 - u), (w = 1 - w);
        v(t, 0, a), v(t, 1, b), v(t, 2, c);
        out.push(a.x + (b.x - a.x) * u + (c.x - a.x) * w, a.y + (b.y - a.y) * u + (c.y - a.y) * w, a.z + (b.z - a.z) * u + (c.z - a.z) * w);
        next += total / Math.max(1, want);
      }
    }
  return new Float32Array(out);
};

const infoCache = new WeakMap<BufferGeometry, GeoInfo>();
const closedCache = new WeakMap<BufferGeometry, boolean>();
const rigidInfo = (g: BufferGeometry): GeoInfo => {
  let i = infoCache.get(g);
  if (!i) infoCache.set(g, (i = { bvh: new MeshBVH(g, { indirect: true }), closed: closedOf(g), samples: surfaceSamples(g) }));
  return i;
};

const drawn = (m: Mesh) => {
  const mats = (Array.isArray(m.material) ? m.material : [m.material]) as Material[];
  return mats.some((x) => x && x.visible !== false && x.colorWrite !== false && !(x.transparent && x.opacity < 0.05));
};
const shown = (o: Object3D) => {
  for (let p: Object3D | null = o; p; p = p.parent) if (!p.visible) return false;
  return true;
};

/** Visible meshes of a solid, without descending into nested solids. */
const meshesOf = (root: Object3D): Mesh[] => {
  const out: Mesh[] = [];
  const walk = (o: Object3D) => {
    if (!o.visible) return;
    if (o !== root && o.userData?.voynannSolid) return;
    if ((o as Mesh).isMesh && !o.userData?.qaIgnore && drawn(o as Mesh)) out.push(o as Mesh);
    for (const c of o.children) walk(c);
  };
  walk(root);
  return out;
};

const partsOf = (s: SolidNow): Part[] => {
  const parts: Part[] = [];
  for (const m of s.meshes) {
    const g = m.geometry as BufferGeometry;
    if (!g?.attributes?.position) continue;
    if ((m as SkinnedMesh).isSkinnedMesh || (g.morphAttributes?.position?.length ?? 0) > 0) {
      // bake the posed (skinned / morphed) shape in world space for this frame
      const gen = new StaticGeometryGenerator([m]);
      gen.applyWorldTransforms = true;
      const baked = gen.generate();
      let closed = closedCache.get(g);
      if (closed === undefined) closedCache.set(g, (closed = closedOf(g)));
      baked.computeBoundingBox();
      const info = { bvh: new MeshBVH(baked, { indirect: true }), closed, samples: surfaceSamples(baked) };
      parts.push({ info, toWorld: new Matrix4(), toLocal: new Matrix4(), box: baked.boundingBox!.clone(), mesh: m });
    } else if ((m as InstancedMesh).isInstancedMesh) {
      const im = m as InstancedMesh, info = rigidInfo(g);
      if (!g.boundingBox) g.computeBoundingBox();
      const mi = new Matrix4();
      for (let i = 0; i < Math.min(im.count, 256); i++) {
        im.getMatrixAt(i, mi);
        const w = new Matrix4().multiplyMatrices(m.matrixWorld, mi);
        parts.push({ info, toWorld: w, toLocal: w.clone().invert(), box: g.boundingBox!.clone().applyMatrix4(w), mesh: m });
      }
    } else {
      const info = rigidInfo(g);
      if (!g.boundingBox) g.computeBoundingBox();
      const w = m.matrixWorld.clone();
      parts.push({ info, toWorld: w, toLocal: w.clone().invert(), box: g.boundingBox!.clone().applyMatrix4(w), mesh: m });
    }
  }
  return parts;
};

const DIR = new Vector3(0.5774, 0.5774, 0.5774);
/** Deepest point of part `a`'s surface inside closed part `b`: depth (scene units), the point and b's surface there. */
const deepest = (a: Part, b: Part, limitBox: Box3) => {
  const s = a.info.samples, p = new Vector3(), pl = new Vector3(), ray = new Ray();
  let best = 0;
  let at: Vector3 | null = null, from: Vector3 | null = null;
  for (let i = 0; i < s.length; i += 3) {
    p.set(s[i], s[i + 1], s[i + 2]).applyMatrix4(a.toWorld);
    if (!limitBox.containsPoint(p) || !b.box.containsPoint(p)) continue;
    pl.copy(p).applyMatrix4(b.toLocal);
    ray.set(pl, DIR);
    const hits = b.info.bvh.raycast(ray, DoubleSide);
    if (hits.length % 2 === 0) continue;
    const c = b.info.bvh.closestPointToPoint(pl);
    if (!c) continue;
    const sw = c.point.clone().applyMatrix4(b.toWorld);
    const d = sw.distanceTo(p);
    if (d > best) (best = d), (at = sw), (from = p.clone());
  }
  return at ? { depth: best, at, from: from! } : null;
};

// The film's absolute frame: inside a <Sequence> useCurrentFrame() restarts at 0, which would mix the scenes up.
const timeline = (Internals as unknown as { Timeline?: { useTimelinePosition?: () => number } }).Timeline?.useTimelinePosition;
const useFilmFrame: () => number = timeline ?? useCurrentFrame;

const Probe: React.FC<{ every: number }> = ({ every }) => {
  const frame = useFilmFrame();
  const fr = useRef(frame);
  fr.current = frame;
  const { scene, camera } = useThree();
  useFrame(() => {
    const f = fr.current;
    scene.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    const solids: SolidNow[] = [];
    scene.traverse((o) => {
      const tag = o.userData?.voynannSolid as Tag | undefined;
      if (!tag || !shown(o)) return;
      const meshes = meshesOf(o);
      if (!meshes.length) return;
      const box = new Box3();
      for (const m of meshes) box.expandByObject(m, false);
      if (box.isEmpty()) return;
      // anchors, keyed by the object's own id so a part that appears / disappears never shifts the others:
      // bones of a skinned body, else mesh origins (limbs, held props) — at most 48, the same ones every frame —
      // plus the mean of all of them (a box centre would jump whenever a swinging limb becomes the extreme)
      const pts = new Map<number, Vector3>();
      for (const m of meshes) {
        if ((m as SkinnedMesh).isSkinnedMesh) for (const b of (m as SkinnedMesh).skeleton.bones) pts.set(b.id, new Vector3().setFromMatrixPosition(b.matrixWorld));
        else pts.set(m.id, new Vector3().setFromMatrixPosition(m.matrixWorld));
      }
      const c = [...pts.values()].reduce((a, v) => a.add(v), new Vector3()).divideScalar(Math.max(1, pts.size));
      const keys = [...pts.keys()].sort((a, b) => a - b).slice(0, 48);
      const anchors = { c: [c.x, c.y, c.z].map(r4), n: pts.size, p: Object.fromEntries(keys.map((k) => { const v = pts.get(k)!; return [k, [v.x, v.y, v.z].map(r4)]; })) };
      solids.push({ tag, group: o, meshes, box, diag: box.getSize(new Vector3()).length(), anchors });
    });
    const camDir = new Vector3();
    camera.getWorldDirection(camDir);
    const frustum = new Frustum().setFromProjectionMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    // seen = in the frame and not hidden: a ray from the lens reaches its centre, top or bottom before anything else
    let occluders: Object3D[] | null = null;
    const camPos = new Vector3().setFromMatrixPosition(camera.matrixWorld);
    const seen = (so: SolidNow) => {
      if (!so.tag.jerk || !frustum.intersectsBox(so.box)) return false;
      if (!occluders) {
        occluders = [];
        scene.traverseVisible((o) => {
          if ((o as Mesh).isMesh && !o.userData?.qaIgnore && drawn(o as Mesh)) occluders!.push(o);
        });
      }
      const own = new Set<Object3D>(so.meshes);
      const c = so.box.getCenter(new Vector3()), h = (so.box.max.y - so.box.min.y) * 0.35;
      for (const p of [c, c.clone().setY(c.y + h), c.clone().setY(c.y - h)]) {
        const d = camPos.distanceTo(p);
        const hit = new Raycaster(camPos, p.clone().sub(camPos).normalize(), 0, d).intersectObjects(occluders, false).find((x) => !own.has(x.object));
        if (!hit) return true;
      }
      return false;
    };
    const rec: Record<string, unknown> = {
      f,
      cam: [camera.position.x, camera.position.y, camera.position.z, camDir.x, camDir.y, camDir.z].map((v) => Math.round(v * 1e6) / 1e6),
      s: Object.fromEntries(solids.map((s) => [s.tag.id, { k: s.tag.kind, j: s.tag.jerk ? 1 : 0, v: seen(s) ? 1 : 0, d: r4(s.diag), ...s.anchors }])),
    };
    if (f % every === 0 && solids.length > 1) {
      const hits: unknown[] = [];
      const parts = new Map(solids.map((s) => [s, partsOf(s)] as const));
      // occluders: everything drawn except the solid that pokes in (its own surface frames the seam)
      const others = (pen: SolidNow) => {
        const own = new Set(pen.meshes);
        const list: Object3D[] = [];
        scene.traverseVisible((o) => {
          if ((o as Mesh).isMesh && !own.has(o as Mesh) && !o.userData?.qaIgnore && drawn(o as Mesh)) list.push(o);
        });
        return list;
      };
      for (let i = 0; i < solids.length; i++)
        for (let j = i + 1; j < solids.length; j++) {
          const A = solids[i], B = solids[j];
          if (A.tag.kind === "set" && B.tag.kind === "set") continue;
          if (A.tag.id === B.tag.id || !A.box.intersectsBox(B.box)) continue;
          const touch = A.tag.touch.includes(B.tag.id) || B.tag.touch.includes(A.tag.id) || A.tag.touch.includes("*") || B.tag.touch.includes("*");
          const tol = Math.min(A.tag.tol ?? 0.015 * A.diag, B.tag.tol ?? 0.015 * B.diag) * (touch ? 3 : 1);
          const overlap = A.box.clone().intersect(B.box).expandByScalar(tol);
          let worst: { depth: number; at: Vector3; from: Vector3; cross?: boolean; pen: SolidNow } | null = null;
          for (const [X, Y] of [[A, B], [B, A]] as const)
            for (const pa of parts.get(X)!)
              for (const pb of parts.get(Y)!) {
                if (!pa.box.intersectsBox(pb.box)) continue;
                if (pb.info.closed) {
                  const d = deepest(pa, pb, overlap);
                  if (d && (!worst || d.depth > worst.depth)) worst = { ...d, pen: X };
                } else if (!pa.info.closed && !touch && X === A && A.tag.kind !== "set" && B.tag.kind !== "set") {
                  // two open surfaces (paper, cloth, a sign plane): any crossing shows
                  const g = (pa.info.bvh as unknown as { geometry: BufferGeometry }).geometry;
                  const m = new Matrix4().multiplyMatrices(pb.toLocal, pa.toWorld);
                  if (pb.info.bvh.intersectsGeometry(g, m)) {
                    const at = pa.box.clone().intersect(pb.box).getCenter(new Vector3());
                    if (!worst) worst = { depth: tol * 1.01, at, from: at, cross: true, pen: X };
                  }
                }
              }
          if (!worst || worst.depth <= tol) continue;
          const ndc = worst.at.clone().project(camera);
          const inFrame = Math.abs(ndc.x) <= 1 && Math.abs(ndc.y) <= 1 && ndc.z >= -1 && ndc.z <= 1;
          let visible = inFrame;
          if (inFrame) {
            const cam = new Vector3().setFromMatrixPosition(camera.matrixWorld);
            const dist = cam.distanceTo(worst.at);
            const rc = new Raycaster(cam, worst.at.clone().sub(cam).normalize(), 0, Math.max(0, dist - Math.max(1e-3, tol)));
            visible = rc.intersectObjects(others(worst.pen), false).length === 0;
          }
          hits.push({
            a: A.tag.id,
            b: B.tag.id,
            depth: r4(worst.depth),
            tol: r4(tol),
            touch: touch ? 1 : 0,
            cross: worst.cross ? 1 : 0,
            p: [worst.at.x, worst.at.y, worst.at.z].map(r4),
            sx: r4((ndc.x + 1) / 2),
            sy: r4((1 - ndc.y) / 2),
            vis: visible ? 1 : 0,
          });
        }
      rec.clip = 1;
      rec.hits = hits;
      // per-frame BVHs of baked (skinned) parts are garbage now; rigid ones stay cached by geometry
    }
    console.log("VOYNANN_QA" + JSON.stringify(rec));
  });
  return null;
};

// CINÉSTORY character: one procedural rig, many people. A CharSpec (the character bible as data) sets
// skin, hair style, face shape, wardrobe and proportions; the rig is posed per frame from a Pose
// (pose.ts). Head = one sculpted sphere (brow ridge, sockets, nose, cheekbones, lips, chin), eyes with
// lids + lash lines; arms FK or 2-bone IK toward a target in chest space (door handle, key, phone).

import React, { useMemo } from "react";
import { CapsuleGeometry, DoubleSide, SphereGeometry, Euler, type Material, Matrix4, MeshPhysicalMaterial, Quaternion, Vector3 } from "three";
import { cached, lathe, sphere, torus, box, cyl } from "../../kits/worldforge/geo.ts";
import { mulberry32 } from "../../kits/worldforge/noise.ts";
import { batikTex, eyeTex, phys, weaveTex } from "../mats.ts";
import type { Arm, Hand, Hold, Leg, Pose } from "./pose.ts";

export type CharSpec = {
  key: string;
  skin: string; hair: string; iris: string; lip: string; brow: string;
  /** whole-body scale (1 = 1.80 m) and head scale */
  scale: number; headScale: number;
  top: "hoodie" | "tee" | "jacket"; topColor: string; trim: string;
  legs: string; feet: "sandal" | "shoe"; sandal: string;
  hairStyle: "crop" | "messy" | "long" | "bald";
  /** face shape: jaw width, cheek fullness, nose length, brow thickness, chin (all ~0..1, 0.5 neutral) */
  face: { jaw: number; cheek: number; nose: number; brow: number; chin: number };
  /** batik shirt pattern (ink colour on topColor) and glasses */
  batik?: string; glasses?: boolean;
  /** knit cap colour, hijab colour (covers hair + neck), beard colour (chin, cheeks, moustache) */
  cap?: string; hijab?: string; beard?: string;
};

const skinMat = (c: string) => phys(`skin${c}`, { color: c, roughness: 0.5, sheen: 0.4, sheenColor: "#ff9f80", sheenRoughness: 0.45, clearcoat: 0.08, clearcoatRoughness: 0.5 });
const fabric = (key: string, c: string, o: Partial<ConstructorParameters<typeof MeshPhysicalMaterial>[0]> = {}) =>
  phys(`fab${key}`, { color: c, roughness: 0.88, sheen: 0.45, sheenColor: "#9aa8c8", sheenRoughness: 0.55, ...o });

const clothes = (c: CharSpec) => {
  const top = c.batik
    ? fabric(`top${c.key}`, "#ffffff", { map: batikTex(`top${c.key}`, c.topColor, c.batik, [3, 3]) })
    : fabric(`top${c.key}`, "#ffffff", { map: weaveTex(`top${c.key}`, c.topColor, [7, 7]) });
  return {
    top,
    sleeve: top,
    pocket: fabric(`pocket${c.key}`, "#e4e6ea", { map: weaveTex(`top${c.key}`, c.topColor, [7, 7]) }),
    legs: fabric(`legs${c.key}`, c.legs, { sheen: 0.5, sheenColor: "#8f97a8" }),
    trim: fabric(`trim${c.key}`, c.trim, { sheen: 0.2 }),
    sole: phys(`sole${c.sandal}`, { color: c.sandal, roughness: 0.7 }),
  };
};

// ── geometry ────────────────────────────────────────────────────────────────

/** Tapered limb along −Y from 0 to −len with round caps. */
const limb = (len: number, r0: number, r1: number, mid = 0) =>
  cached(`limb${len},${r0},${r1},${mid}`, () => {
    const pts: [number, number][] = [];
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * (Math.PI / 2);
      pts.push([Math.sin(a) * r1, -len - Math.cos(a) * r1]);
    }
    for (let i = 1; i < 10; i++) {
      const k = i / 10;
      const bulge = Math.sin(k * Math.PI) * mid;
      pts.push([r1 + (r0 - r1) * k + bulge, -len + len * k]);
    }
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * (Math.PI / 2);
      pts.push([Math.cos(a) * r0, Math.sin(a) * r0]);
    }
    return lathe(`limbL${len},${r0},${r1},${mid}`, pts, 28);
  });

const TORSO: [number, number][] = [
  [0.0, -0.36], [0.172, -0.356], [0.19, -0.336], [0.188, -0.3], [0.191, -0.2], [0.2, -0.06], [0.21, 0.07], [0.216, 0.15],
  [0.207, 0.205], [0.18, 0.238], [0.13, 0.262], [0.08, 0.274], [0.0, 0.279],
];
const PELVIS: [number, number][] = [[0, -0.13], [0.115, -0.125], [0.155, -0.08], [0.162, 0.0], [0.158, 0.09], [0.0, 0.1]];
const capsule = (r: number, l: number) => cached(`cap${r},${l}`, () => new CapsuleGeometry(r, l, 6, 14));

const g2 = (x: number, y: number, sx: number, sy: number) => Math.exp(-(x * x) / (sx * sx) - (y * y) / (sy * sy));

/** Sculpt a unit-sphere point into the head surface (+Z = face), in head units. Shape knobs from the spec. */
const sculpt = (x: number, y: number, z: number, f: CharSpec["face"]): [number, number, number] => {
  const front = Math.max(0, z);
  const ax = Math.abs(x);
  // displacement along the normal (unit sphere: normal = position)
  let d = 0;
  d += 0.035 * (0.6 + f.brow) * g2(ax - 0.3, y - 0.27, 0.32, 0.075) * Math.pow(front, 2); // brow ridge
  d -= 0.06 * g2(ax - 0.375, y - 0.07, 0.17, 0.12) * front; // eye sockets
  const ridge = g2(x, 0, 0.075, 1) * (y < 0.18 && y > -0.33 ? Math.pow((0.18 - y) / 0.51, 1.3) : 0);
  d += (0.2 + 0.08 * f.nose) * ridge * Math.pow(front, 4); // nose bridge → tip
  d += 0.1 * g2(x, y + 0.27, 0.075, 0.065) * front; // tip
  d += 0.06 * g2(ax - 0.12, y + 0.3, 0.06, 0.05) * front; // nostril wings
  d -= 0.025 * g2(ax - 0.2, y + 0.38, 0.05, 0.06) * front; // nasolabial
  d += 0.035 * (0.5 + f.cheek) * g2(ax - 0.55, y + 0.05, 0.2, 0.16) * front; // cheekbones
  d += 0.022 * g2(x, y + 0.5, 0.17, 0.035) * front; // upper lip
  d += 0.026 * g2(x, y + 0.6, 0.15, 0.04) * front; // lower lip
  d -= 0.018 * g2(x, y + 0.69, 0.18, 0.03) * front; // under-lip groove
  d += (0.03 + 0.04 * f.chin) * g2(x, y + 0.82, 0.2, 0.08) * front; // chin
  x *= 1 + d; y *= 1 + d; z *= 1 + d;
  // jaw taper (narrower lower face), forward chin, fuller lower cheeks
  const low = Math.max(0, -y);
  x *= 1 - (0.24 - 0.12 * f.jaw) * Math.pow(low, 1.5);
  z += 0.14 * low * Math.max(0, z) * Math.max(0, z);
  y *= 1 + 0.12 * low;
  return [x * 0.102, y * 0.118, z * 0.112];
};

/** Sculpted head on a unit sphere, then scaled to head size. */
const headGeo = (f: CharSpec["face"]) =>
  cached(`head${f.jaw},${f.cheek},${f.nose},${f.brow},${f.chin}`, () => {
    const g = new SphereGeometry(1, 96, 72);
    const a = g.attributes.position;
    for (let i = 0; i < a.count; i++) a.setXYZ(i, ...sculpt(a.getX(i), a.getY(i), a.getZ(i), f));
    g.computeVertexNormals();
    return g;
  });

/** A shell that follows the sculpted head: `lift(ux, uy, uz)` (relative, on the unit sphere) > 0 stands off the
 *  skin, < 0 dives under it. The skin hides the dived part, so edges are smooth curves (no cut triangles). */
const skinShell = (key: string, f: CharSpec["face"], lift: (x: number, y: number, z: number) => number) =>
  cached(`shell${key}${f.jaw},${f.cheek},${f.nose},${f.brow},${f.chin}`, () => {
    const g = new SphereGeometry(1, 96, 72);
    const a = g.attributes.position;
    for (let i = 0; i < a.count; i++) {
      const ux = a.getX(i), uy = a.getY(i), uz = a.getZ(i);
      const [x, y, z] = sculpt(ux, uy, uz, f);
      const k = 1 + lift(ux, uy, uz);
      a.setXYZ(i, x * k, y * k, z * k);
    }
    g.computeVertexNormals();
    return g;
  });
const sstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

/** Hijab: lifted head surface with an oval face opening; extra volume behind and wrapping under the chin. */
const hijabGeo = (f: CharSpec["face"]) =>
  skinShell("hijab", f, (x, y, z) => {
    const o = (x / 0.6) ** 2 + ((y + 0.04) / 0.8) ** 2;
    const open = sstep(1.12, 0.9, o) * sstep(0.0, 0.25, z);
    const lift = 0.09 + 0.06 * Math.max(0, -z) + 0.1 * Math.max(0, y - 0.6) + 0.3 * Math.max(0, -y - 0.6) * (1 - 0.6 * Math.max(0, z));
    return lift * (1 - open) - 0.06 * open;
  });

/** Beard: jaw, chin and cheeks below the cheekbones, a gap for the mouth; dives under the skin elsewhere. */
const beardGeo = (f: CharSpec["face"]) =>
  skinShell("beard", f, (x, y, z) => {
    const jaw = sstep(-0.4, -0.58, y) * sstep(-0.35, 0.05, z);
    const mouth = Math.exp(-(x * x) / (0.2 * 0.2) - ((y + 0.55) ** 2) / (0.09 * 0.09));
    const m = jaw * (1 - 0.95 * mouth);
    return 0.05 * m - 0.04 * (1 - m);
  });

/** Open sphere shell (phi start/length around Y, theta from the top), for caps, hijab and long hair. */
const shell = (phi0: number, phiL: number, th0: number, thL: number) =>
  cached(`shell${phi0},${phiL},${th0},${thL}`, () => new SphereGeometry(1, 48, 24, phi0, phiL, th0, thL));

// ── IK ──────────────────────────────────────────────────────────────────────

const UA = 0.28, FA = 0.25;
const _q = new Quaternion();
const ikArm = (S: Vector3, T: Vector3, pole: Vector3) => {
  const d0 = new Vector3().subVectors(T, S);
  const d = Math.min(Math.max(d0.length(), Math.abs(UA - FA) + 1e-3), UA + FA - 1e-3);
  const u = d0.normalize();
  const cosA = (UA * UA + d * d - FA * FA) / (2 * UA * d);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
  const w = pole.clone().addScaledVector(u, -pole.dot(u));
  if (w.lengthSq() < 1e-8) w.set(0, 0, -1).addScaledVector(u, -u.z);
  w.normalize();
  const upper = u.clone().multiplyScalar(cosA).addScaledVector(w, sinA).normalize();
  const E = S.clone().addScaledVector(upper, UA);
  const fore = new Vector3().subVectors(S.clone().addScaledVector(u, d), E).normalize();
  const cosB = Math.min(1, Math.max(-1, upper.dot(fore)));
  const bend = Math.acos(cosB);
  const Y = upper.clone().negate();
  let Z = fore.clone().addScaledVector(upper, -fore.dot(upper));
  if (Z.lengthSq() < 1e-8) Z = w.clone().negate();
  Z.normalize();
  const X = new Vector3().crossVectors(Y, Z).normalize();
  Z.crossVectors(X, Y).normalize();
  const m = new Matrix4().makeBasis(X, Y, Z);
  return { q: new Quaternion().setFromRotationMatrix(m), bend };
};

// ── parts ───────────────────────────────────────────────────────────────────

const HandMesh: React.FC<{ s: number; h: Hand; skin: Material; t: number; tremble: number }> = ({ s, h, skin, t, tremble }) => {
  const fingers = [0.026, 0.009, -0.008, -0.025];
  const tr = tremble * 0.09;
  return (
    <group>
      <mesh geometry={box(0.03, 0.085, 0.074, 0.013)} material={skin} position={[0, -0.05, 0.002]} castShadow receiveShadow />
      {fingers.map((fz, i) => {
        const c = i === 0 ? h.index : h.curl;
        const jit = tr * Math.sin(t * 41 + i * 1.7);
        const a = -s * (c * 1.4 + jit);
        return (
          <group key={i} position={[0, -0.09, fz]} rotation={[0, 0, a]}>
            <mesh geometry={capsule(0.0088, 0.03)} material={skin} position={[0, -0.022, 0]} castShadow />
            <group position={[0, -0.045, 0]} rotation={[0, 0, a * 0.9]}>
              <mesh geometry={capsule(0.0082, 0.022)} material={skin} position={[0, -0.017, 0]} castShadow />
            </group>
          </group>
        );
      })}
      <group position={[-s * 0.006, -0.025, 0.036]} rotation={new Euler(0.5, 0, -s * (0.35 + h.thumb * 0.8))}>
        <mesh geometry={capsule(0.0105, 0.035)} material={skin} position={[0, -0.025, 0]} castShadow />
      </group>
    </group>
  );
};

const Phone: React.FC<{ screen: Material; s: number }> = ({ screen, s }) => (
  <group position={[-s * 0.024, -0.075, 0.012]}>
    <mesh geometry={box(0.009, 0.152, 0.074, 0.004)} material={phys("phoneBody", { color: "#16181c", roughness: 0.3, metalness: 0.6 })} castShadow />
    <mesh geometry={box(0.001, 0.146, 0.068, 0.0005)} material={screen} position={[-s * 0.0048, 0, 0]} rotation={[Math.PI, s > 0 ? Math.PI : 0, 0]} />
  </group>
);

/** Props held in one hand (hand space: fingers along −Y, forward +Z). Binoculars are drawn at the eyes by Head. */
const metal = () => phys("propMetal", { color: "#2a2c30", roughness: 0.35, metalness: 0.7 });
const HeldProp: React.FC<{ h: Hold; s: number }> = ({ h, s }) => {
  if (h.kind === "lantern") {
    const glow = phys(`lanternGlass${Math.round(h.on * 20)}`, { color: "#ffe2b0", emissive: "#ffb45e", emissiveIntensity: 0.2 + 2.6 * h.on, roughness: 0.2, transmission: 0.2 });
    return (
      <group position={[0, -0.13, 0.02]}>
        <mesh geometry={torus(0.035, 0.004, 6, 20, Math.PI)} material={metal()} position={[0, 0.05, 0]} />
        <mesh geometry={cyl(0.045, 0.05, 0.02, 16)} material={metal()} position={[0, 0.0, 0]} castShadow />
        <mesh geometry={cyl(0.04, 0.04, 0.11, 16)} material={glow} position={[0, -0.065, 0]} />
        <mesh geometry={cyl(0.05, 0.055, 0.02, 16)} material={metal()} position={[0, -0.13, 0]} castShadow />
      </group>
    );
  }
  if (h.kind === "flashlight") {
    const lens = phys(`torchLens${Math.round(h.on * 20)}`, { color: "#fff6e0", emissive: "#fff2d0", emissiveIntensity: 3 * h.on, roughness: 0.1 });
    return (
      <group position={[0, -0.06, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh geometry={cyl(0.017, 0.017, 0.17, 16)} material={metal()} castShadow />
        <mesh geometry={cyl(0.026, 0.018, 0.05, 16)} material={metal()} position={[0, 0.1, 0]} castShadow />
        <mesh geometry={cyl(0.023, 0.023, 0.004, 16)} material={lens} position={[0, 0.126, 0]} />
      </group>
    );
  }
  if (h.kind === "mug") return <mesh geometry={cyl(0.04, 0.036, 0.1, 18)} material={phys("mug", { color: "#d8d2c4", roughness: 0.4, clearcoat: 0.5 })} position={[-s * 0.045, -0.075, 0.03]} castShadow />;
  if (h.kind === "book") return <mesh geometry={box(0.035, 0.22, 0.16, 0.008)} material={phys("book", { color: "#5a3b2a", roughness: 0.8 })} position={[-s * 0.03, -0.1, 0.0]} castShadow />;
  if (h.kind === "pen") return <mesh geometry={cyl(0.004, 0.004, 0.13, 6)} material={phys("pen", { color: "#1d2b4a", roughness: 0.4 })} position={[0, -0.09, 0.03]} rotation={[0.9, 0, 0]} />;
  if (h.kind === "binoculars") return <Binoculars />;
  return null;
};
const Binoculars: React.FC = () => (
  <group rotation={[Math.PI / 2, 0, 0]}>
    {[1, -1].map((k) => (
      <group key={k} position={[k * 0.034, 0, 0]}>
        <mesh geometry={cyl(0.021, 0.024, 0.12, 16)} material={metal()} castShadow />
        <mesh geometry={cyl(0.026, 0.026, 0.02, 16)} material={phys("binoRub", { color: "#121315", roughness: 0.9 })} position={[0, 0.07, 0]} />
      </group>
    ))}
    <mesh geometry={box(0.05, 0.05, 0.024, 0.008)} material={metal()} />
  </group>
);

const ArmSide: React.FC<{ s: number; a: Arm; hand: Hand; c: CharSpec; t: number; tremble: number; phone?: Material; hold?: Hold | null }> = ({ s, a, hand, c, t, tremble, phone, hold }) => {
  const S = new Vector3(s * 0.19, 0.2, -0.01);
  const cl = clothes(c);
  let q: Quaternion;
  let el = a.el;
  const fk = new Quaternion().setFromEuler(new Euler(-a.sw, s * a.tw, s * a.ab, "XZY"));
  if (a.ik && a.ik.w > 0) {
    const T = new Vector3(a.ik.t[0] * s, a.ik.t[1], a.ik.t[2]);
    const pole = new Vector3(a.ik.pole[0] * s, a.ik.pole[1], a.ik.pole[2]);
    const r = ikArm(S, T, pole);
    q = fk.clone().slerp(r.q, a.ik.w);
    el = el + (r.bend - el) * a.ik.w;
  } else q = fk;
  const jit = tremble * 0.06;
  const wr = new Euler(a.wr[0] + jit * Math.sin(t * 37), s * a.wr[1], s * a.wr[2] + jit * Math.sin(t * 29 + 1), "XYZ");
  const skin = skinMat(c.skin);
  const short = c.top === "tee";
  return (
    <group position={S} quaternion={q}>
      {short ? (
        <>
          <mesh geometry={limb(0.14, 0.064, 0.058)} material={cl.sleeve} castShadow receiveShadow />
          <mesh geometry={limb(0.28, 0.044, 0.037)} material={skin} castShadow receiveShadow />
        </>
      ) : (
        <mesh geometry={limb(0.28, 0.064, 0.054, 0.007)} material={cl.sleeve} castShadow receiveShadow />
      )}
      <group position={[0, -UA, 0]} rotation={[-el, 0, 0]}>
        {short ? (
          <mesh geometry={limb(0.25, 0.037, 0.03, 0.004)} material={skin} castShadow receiveShadow />
        ) : (
          <>
            <mesh geometry={limb(0.225, 0.054, 0.047, 0.005)} material={cl.sleeve} castShadow receiveShadow />
            <mesh geometry={cyl(0.042, 0.04, 0.045, 20)} material={cl.sleeve} position={[0, -0.222, 0]} castShadow />
          </>
        )}
        <group position={[0, -FA, 0]} quaternion={_q.setFromEuler(wr).clone()}>
          <HandMesh s={s} h={hand} skin={skin} t={t} tremble={tremble} />
          {phone ? <Phone screen={phone} s={s} /> : null}
          {hold && !(hold.kind === "binoculars" && hold.on > 0.6) ? <HeldProp h={hold} s={s} /> : null}
        </group>
      </group>
    </group>
  );
};

const LegSide: React.FC<{ s: number; l: Leg; c: CharSpec }> = ({ s, l, c }) => {
  const cl = clothes(c);
  const skin = skinMat(c.skin);
  return (
    <group position={[s * 0.095, -0.05, 0]} rotation={new Euler(-l.sw, s * l.tw, s * l.ab, "XZY")}>
      <mesh geometry={limb(0.43, 0.09, 0.07, 0.005)} material={cl.legs} castShadow receiveShadow />
      <group position={[0, -0.43, 0]} rotation={[l.kn, 0, 0]}>
        <mesh geometry={limb(0.38, 0.066, 0.052, 0.012)} material={cl.legs} castShadow receiveShadow />
        {/* jogger cuff */}
        <mesh geometry={cyl(0.05, 0.048, 0.05, 20)} material={cl.legs} position={[0, -0.37, 0]} castShadow />
        <group position={[0, -0.42, 0]} rotation={[-l.an, 0, 0]}>
          <mesh geometry={cyl(0.034, 0.036, 0.06, 16)} material={skin} position={[0, -0.01, 0]} castShadow />
          {c.feet === "sandal" ? (
            <>
              <mesh geometry={box(0.078, 0.042, 0.215, 0.02)} material={skin} position={[0, -0.05, 0.05]} castShadow receiveShadow />
              <mesh geometry={box(0.098, 0.016, 0.265, 0.007)} material={cl.sole} position={[0, -0.077, 0.052]} castShadow receiveShadow />
              {[1, -1].map((k) => (
                <mesh key={k} geometry={box(0.009, 0.012, 0.11, 0.004)} material={cl.sole} position={[k * 0.03, -0.05, 0.1]} rotation={[0.25, k * 0.42, 0]} castShadow />
              ))}
            </>
          ) : (
            <>
              <mesh geometry={box(0.104, 0.034, 0.28, 0.014)} material={phys("soleShoe", { color: "#3b3c40", roughness: 0.8 })} position={[0, -0.068, 0.055]} castShadow receiveShadow />
              <mesh geometry={box(0.096, 0.08, 0.235, 0.035)} material={cl.sole} position={[0, -0.032, 0.045]} castShadow receiveShadow />
            </>
          )}
        </group>
      </group>
    </group>
  );
};

/** Hair clumps on the cap surface: local y = surface normal, local z = sweep direction. */
const hairClumps = (style: CharSpec["hairStyle"]) => {
  const out: { p: [number, number, number]; q: Quaternion; s: [number, number, number] }[] = [];
  const C = new Vector3(0, 0.016, -0.004);
  const r = mulberry32(style === "crop" ? 5 : 9);
  const put = (az: number, el: number, rad: number, sweep: number, sc: [number, number, number]) => {
    const n = new Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    const pos = C.clone().addScaledVector(n, rad);
    const q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), n);
    q.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), sweep));
    out.push({ p: [pos.x, pos.y, pos.z], q, s: sc });
  };
  if (style === "crop") {
    // soft fringe swept to his right, short textured top, tidy sides
    for (let i = 0; i < 12; i++) put(-0.72 + i * 0.13 + (r() - 0.5) * 0.04, 0.56 + 0.05 * r(), 0.116, 2.7 + 0.08 * i + (r() - 0.5) * 0.3, [0.42, 0.2, 1.25 + 0.3 * r()]);
    for (let i = 0; i < 30; i++) put(r() * Math.PI * 2, 0.75 + 0.6 * r(), 0.119, Math.PI + (r() - 0.5) * 1.2, [0.45 + 0.15 * r(), 0.2, 1.2 + 0.3 * r()]);
  } else {
    // longer, messier top with a side part
    for (let i = 0; i < 12; i++) put(-0.8 + i * 0.14 + (r() - 0.5) * 0.05, 0.52 + 0.08 * r(), 0.12, 2.4 + 0.15 * i + 0.4 * r(), [0.5, 0.3, 1.5 + 0.4 * r()]);
    for (let i = 0; i < 34; i++) put(r() * Math.PI * 2, 0.7 + 0.7 * r(), 0.124, Math.PI + (r() - 0.5) * 2.0, [0.55 + 0.2 * r(), 0.3, 1.4 + 0.5 * r()]);
  }
  return out;
};

const Head: React.FC<{ pose: Pose; c: CharSpec }> = ({ pose, c }) => {
  const f = pose.face;
  const skin = skinMat(c.skin);
  const hair = phys(`hair${c.hair}`, { color: c.hair, roughness: 0.62, sheen: 0.7, sheenColor: "#4a3a30", sheenRoughness: 0.45 });
  const eye = phys(`eye${c.key}`, { map: eyeTex(c.key, c.iris), roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02 });
  const brow = phys(`brow${c.brow}`, { color: c.brow, roughness: 0.75 });
  const lash = phys("lash", { color: "#0b0806", roughness: 0.7 });
  const lip = phys(`lip${c.lip}`, { color: c.lip, roughness: 0.42, clearcoat: 0.2 });
  // upper lid edge sits ~30° above the eye centre when open (lid = 1), closes at 0, wide above 1
  const lidA = Math.min(Math.PI / 2, Math.max(-1.2, Math.PI / 2 - 2.09 * f.lid));
  const browY = 0.03 + 0.008 * f.browUp;
  const clumps = useMemo(() => hairClumps(c.hairStyle === "long" ? "messy" : c.hairStyle === "bald" ? "crop" : c.hairStyle), [c.hairStyle]);
  const open = Math.min(1, f.open + pose.talk);
  const showHair = !c.hijab && c.hairStyle !== "bald";
  const scarf = c.hijab ? phys(`hijab${c.hijab}`, { color: c.hijab, roughness: 0.85, sheen: 0.5, sheenColor: "#ffffff", sheenRoughness: 0.6, side: DoubleSide }) : null;
  const knit = c.cap ? phys(`cap${c.cap}`, { color: c.cap, roughness: 0.95, sheen: 0.6, sheenColor: "#ffffff", sheenRoughness: 0.7 }) : null;
  const beard = c.beard ? phys(`beard${c.beard}`, { color: c.beard, roughness: 0.9, sheen: 0.6, sheenColor: "#ffffff", sheenRoughness: 0.5 }) : null;
  const H = Math.PI / 2;
  const ER = 0.0178;
  return (
    <group position={[0, 0.09, 0.01]} scale={c.headScale}>
      <mesh geometry={headGeo(c.face)} material={skin} castShadow receiveShadow />
      {[1, -1].map((s) => (
        <group key={`ear${s}`} position={[s * 0.1, -0.008, -0.008]} rotation={[0, s * 0.35, 0]}>
          <mesh geometry={sphere(0.032, 20, 14)} material={skin} scale={[0.32, 0.95, 0.66]} castShadow />
          <mesh geometry={torus(0.019, 0.005, 8, 20, Math.PI * 1.4)} material={skin} position={[s * 0.004, 0.002, 0.003]} rotation={[0, s * Math.PI / 2, 1.2]} />
        </group>
      ))}
      {[1, -1].map((s) => (
        <group key={`eye${s}`} position={[s * 0.0375, 0.009, 0.0905]}>
          <mesh geometry={sphere(ER, 40, 24)} material={eye} rotation={[-f.eyeY, f.eyeX, 0]} />
          <group rotation={[lidA, 0, 0]}>
            <mesh geometry={sphere(ER + 0.0017, 32, 12, Math.PI * 2, Math.PI / 2)} material={skin} />
            <mesh geometry={torus(ER + 0.0017, 0.0011, 6, 28, Math.PI)} material={lash} rotation={[Math.PI / 2, 0, 0]} />
          </group>
          <group rotation={[Math.PI + 0.98, 0, 0]}>
            <mesh geometry={sphere(ER + 0.0013, 32, 12, Math.PI * 2, Math.PI / 2)} material={skin} />
          </group>
          <mesh geometry={capsule(0.0045 + 0.0025 * c.face.brow, 0.026)} material={brow} position={[s * 0.003, browY, 0.011]} rotation={[0.25, s * 0.25, Math.PI / 2 + s * (0.06 - 0.38 * f.browIn + 0.1 * f.browUp)]} scale={[1, 1, 0.6]} />
        </group>
      ))}
      <group position={[0, -0.0655, 0.1028]}>
        <mesh geometry={sphere(0.0125, 16, 10)} material={phys("mouthIn", { color: "#1a0a09", roughness: 0.95 })} position={[0, -0.002 - open * 0.002, -0.006]} scale={[1, 0.05 + open * 0.7, 0.45]} />
        <mesh geometry={capsule(0.0036, 0.026)} material={lip} position={[0, 0.0016, -0.0025]} rotation={[0, 0, Math.PI / 2 + f.mouth * 0.06]} scale={[1, 1, 0.6]} />
        <mesh geometry={capsule(0.0042, 0.022)} material={lip} position={[0, -0.0048 - open * 0.006, -0.003]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.62]} />
        <mesh geometry={box(0.03, 0.0012, 0.004, 0.0005)} material={phys("mouthLine", { color: "#3a1c18", roughness: 0.9 })} position={[0, -0.0014 - open * 0.003, 0.0]} />
      </group>
      {/* hair */}
      {showHair ? <mesh geometry={sphere(0.122, 48, 24, Math.PI * 2, Math.PI * 0.56)} material={hair} position={[0, 0.014, -0.008]} rotation={[-0.44, 0, 0]} scale={[0.9, 1.04, 0.98]} castShadow /> : null}
      {showHair && c.hairStyle === "long" ? (
        <>
          <mesh geometry={shell(H + 0.85, Math.PI * 2 - 1.7, 0.2, 1.95)} material={phys(`hairL${c.hair}`, { color: c.hair, roughness: 0.62, sheen: 0.7, sheenColor: "#4a3a30", sheenRoughness: 0.45, side: DoubleSide })} position={[0, -0.035, -0.014]} scale={[0.132, 0.25, 0.132]} castShadow />
          {[1, -1].map((k) => <mesh key={k} geometry={capsule(0.022, 0.1)} material={hair} position={[k * 0.098, -0.045, 0.02]} rotation={[0.1, 0, k * 0.08]} scale={[0.7, 1, 0.9]} castShadow />)}
        </>
      ) : null}
      {beard ? (
        <>
          <mesh geometry={beardGeo(c.face)} material={beard} castShadow />
          <mesh geometry={capsule(0.0042, 0.026)} material={beard} position={[0, -0.0585, 0.1085]} rotation={[0.25, 0, Math.PI / 2]} scale={[1, 1, 0.7]} />
        </>
      ) : null}
      {knit ? (
        <group position={[0, 0.018, -0.006]} rotation={[-0.15, 0, 0]}>
          <mesh geometry={shell(0, Math.PI * 2, 0, 1.3)} material={knit} scale={[0.128, 0.138, 0.131]} castShadow />
          <mesh geometry={torus(1, 0.13, 10, 40)} material={knit} position={[0, 0.138 * Math.cos(1.3), 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.128 * Math.sin(1.3), 0.131 * Math.sin(1.3), 0.13]} castShadow />
        </group>
      ) : null}
      {scarf ? <mesh geometry={hijabGeo(c.face)} material={scarf} castShadow /> : null}
      {pose.hold?.kind === "binoculars" && pose.hold.on > 0.6 ? <group position={[0, 0.009, 0.165]}><Binoculars /></group> : null}
      {c.glasses
        ? [1, -1].map((s) => (
            <group key={`gl${s}`}>
              <mesh geometry={torus(0.022, 0.0022, 6, 28)} material={phys("glassFrame", { color: "#3a2a1e", roughness: 0.4 })} position={[s * 0.038, 0.01, 0.112]} scale={[1.15, 0.9, 1]} />
              <mesh geometry={cyl(0.0018, 0.0018, 0.1, 6)} material={phys("glassFrame", { color: "#3a2a1e", roughness: 0.4 })} position={[s * 0.064, 0.012, 0.062]} rotation={[Math.PI / 2, 0, 0]} />
            </group>
          ))
        : null}
      {c.glasses ? <mesh geometry={cyl(0.0018, 0.0018, 0.026, 6)} material={phys("glassFrame", { color: "#3a2a1e", roughness: 0.4 })} position={[0, 0.016, 0.114]} rotation={[0, 0, Math.PI / 2]} /> : null}
      {(showHair && !knit ? clumps : []).map((k, i) => (
        <mesh key={i} geometry={sphere(0.036, 18, 12)} material={hair} position={k.p} quaternion={k.q} scale={k.s} castShadow />
      ))}
    </group>
  );
};

export const Character: React.FC<{ pose: Pose; spec: CharSpec; t: number; visible?: boolean; phoneScreen?: Material }> = ({ pose, spec: c, t, visible = true, phoneScreen }) => {
  const b = pose.breath * Math.sin((t / (pose.breath > 1.5 ? 1.4 : 3.6)) * Math.PI * 2);
  const skin = skinMat(c.skin);
  const cl = clothes(c);
  return (
    <group position={[pose.x, pose.y, pose.z]} rotation={[0, pose.yaw, 0]} scale={c.scale} visible={visible}>
      <group position={[0, 0.96 + pose.hipY, 0]} rotation={new Euler(pose.hips[0], pose.hips[1], -pose.hips[2], "YXZ")}>
        <mesh geometry={lathe("pelvis", PELVIS, 40)} material={cl.legs} scale={[1, 1, 0.68]} castShadow receiveShadow />
        <group position={[0, 0.1, 0]} rotation={new Euler(pose.spine[0], pose.spine[1], -pose.spine[2], "YXZ")}>
          <group position={[0, 0.2, 0]} rotation={new Euler(pose.chest[0] + 0.014 * b, pose.chest[1], -pose.chest[2], "YXZ")} scale={[1 + 0.007 * b, 1, 1 + 0.014 * b]}>
            <mesh geometry={lathe("torso", TORSO, 48)} material={cl.top} scale={[1, 1, 0.63]} castShadow receiveShadow />
            {c.top === "hoodie" ? (
              <>
                <mesh geometry={torus(0.085, 0.038, 12, 36, Math.PI * 1.55)} material={cl.top} position={[0, 0.262, -0.02]} rotation={[Math.PI / 2, 0, Math.PI * 0.225 + Math.PI]} scale={[1.08, 1, 1.15]} castShadow />
                <mesh geometry={sphere(0.115, 28, 18)} material={cl.top} position={[0, 0.17, -0.11]} scale={[0.95, 0.68, 0.32]} castShadow />
                <mesh geometry={box(0.24, 0.13, 0.024, 0.01)} material={cl.pocket} position={[0, -0.21, 0.116]} rotation={[-0.04, 0, 0]} castShadow />
                <mesh geometry={box(0.36, 0.045, 0.22, 0.02)} material={cl.top} position={[0, -0.335, 0]} scale={[1.05, 1, 0.98]} />
                {[1, -1].map((s) => (
                  <group key={s} position={[s * 0.034, 0.215, 0.118]} rotation={[0.12, 0, s * 0.06]}>
                    <mesh geometry={cyl(0.0045, 0.0045, 0.14, 8)} material={cl.trim} position={[0, -0.07, 0]} castShadow />
                    <mesh geometry={cyl(0.0058, 0.0058, 0.02, 8)} material={phys("aglet", { color: "#b9b2a6", metalness: 0.7, roughness: 0.3 })} position={[0, -0.145, 0]} />
                  </group>
                ))}
              </>
            ) : c.top === "jacket" ? (
              <>
                <mesh geometry={lathe("torso", TORSO, 48)} material={cl.top} scale={[1.035, 1.01, 0.67]} castShadow receiveShadow />
                <mesh geometry={torus(0.078, 0.022, 10, 36)} material={cl.top} position={[0, 0.272, 0.0]} rotation={[Math.PI / 2 - 0.25, 0, 0]} scale={[1.05, 0.9, 1.6]} castShadow />
                <mesh geometry={box(0.012, 0.5, 0.012, 0.004)} material={cl.trim} position={[0, -0.06, 0.142]} rotation={[-0.05, 0, 0]} />
                {[1, -1].map((k) => <mesh key={k} geometry={box(0.09, 0.07, 0.02, 0.008)} material={cl.top} position={[k * 0.1, -0.2, 0.13]} rotation={[-0.06, k * 0.25, 0]} castShadow />)}
                <mesh geometry={box(0.37, 0.04, 0.23, 0.02)} material={cl.trim} position={[0, -0.34, 0]} />
              </>
            ) : (
              <mesh geometry={torus(0.072, 0.012, 8, 30)} material={cl.trim} position={[0, 0.266, 0.006]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.82, 1]} />
            )}
            {c.hijab ? (
              <mesh geometry={lathe("hijabDrape", [[0.0, 0.36], [0.07, 0.355], [0.085, 0.3], [0.15, 0.22], [0.215, 0.15], [0.225, 0.11], [0.0, 0.11]], 40)} material={phys(`hijab${c.hijab}`, { color: c.hijab, roughness: 0.85, sheen: 0.5, sheenColor: "#ffffff", sheenRoughness: 0.6, side: DoubleSide })} scale={[1, 1, 0.72]} castShadow />
            ) : null}
            <group position={[0, 0.27, -0.01]} rotation={new Euler(pose.neck[0], pose.neck[1], -pose.neck[2], "YXZ")}>
              <mesh geometry={cyl(0.052, 0.058, 0.12, 24)} material={skin} position={[0, 0.03, 0]} castShadow />
              <group position={[0, 0.09, 0.01]} rotation={new Euler(pose.head[0], pose.head[1], -pose.head[2], "YXZ")}>
                <Head pose={pose} c={c} />
              </group>
            </group>
            <ArmSide s={1} a={pose.armL} hand={pose.handL} c={c} t={t} tremble={pose.tremble} phone={pose.phone === 2 && phoneScreen ? phoneScreen : undefined} hold={pose.hold?.side === 1 ? pose.hold : null} />
            <ArmSide s={-1} a={pose.armR} hand={pose.handR} c={c} t={t + 3.1} tremble={pose.tremble} phone={pose.phone === 1 && phoneScreen ? phoneScreen : undefined} hold={pose.hold?.side === -1 ? pose.hold : null} />
          </group>
        </group>
        <LegSide s={1} l={pose.legL} c={c} />
        <LegSide s={-1} l={pose.legR} c={c} />
      </group>
    </group>
  );
};

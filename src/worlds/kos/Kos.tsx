// Kos world, picture side: the EP01 boarding-house set driven by the story's set state, plus the moonlit
// atmosphere (shafts through the small window and the bedroom window, dust).

import React from "react";
import { Dust, Shaft } from "../../cine/FX.tsx";
import type { Cam } from "../../cine/types.ts";
import type { SetState, V3 } from "../types.ts";
import { Kos, type KosState } from "./set/Kos.tsx";
import { Exterior } from "./set/Exterior.tsx";
import { MOON } from "./looks.ts";
import { ROOM, ROOM_WIN, SMALL_WIN, WALL } from "./layout.ts";

const into: V3 = [-MOON[0], -MOON[1], -MOON[2]];
const SMALL_CORNERS: V3[] = [[SMALL_WIN.x - 0.1, SMALL_WIN.y0, SMALL_WIN.z0], [SMALL_WIN.x - 0.1, SMALL_WIN.y0, SMALL_WIN.z1], [SMALL_WIN.x - 0.1, SMALL_WIN.y1, SMALL_WIN.z1], [SMALL_WIN.x - 0.1, SMALL_WIN.y1, SMALL_WIN.z0]];
const RX = ROOM.x0 - WALL / 2;
const ROOM_CORNERS: V3[] = [[RX, ROOM_WIN.y0, ROOM_WIN.z0], [RX, ROOM_WIN.y0, ROOM_WIN.z1], [RX, ROOM_WIN.y1, ROOM_WIN.z1], [RX, ROOM_WIN.y1, ROOM_WIN.z0]];

export const KosSet: React.FC<{ place: string; time: string; s: SetState; t: number; cam: Cam }> = ({ place, time, s, t }) => {
  const day = time === "day";
  const vent = s.vent ?? 0;
  const k: KosState = {
    roomDoor: (s.door ?? 0) * 1.55, key: 0, lever: 0,
    vent: 0.004 * Math.sin(t * 3.1) + vent * 0.22 * Math.max(0, Math.sin(t * 9.4)) ** 6,
    tubes: s.tubes ?? 0, led: Math.floor(t) % 2 === 0 ? 1 : 0.2, colon: Math.floor(t * 2) % 2 === 0,
    fan: t * Math.PI * 2 * 3.3 * (s.fan ?? 1), coat: 0.012 * Math.sin(t * 0.9), coatOn: (s.coat ?? 1) > 0.5,
    room: true, hall: true, roof: true, gudang: s.gudang ?? 0, pile: (s.pile ?? 0) > 0.5, day,
  };
  const hall = place === "hall";
  return (
    <group>
      <Kos s={k} />
      <Exterior visible={place === "yard" || day} lamp={day ? 0 : 1} day={day} roof />
      <Shaft corners={SMALL_CORNERS} dir={into} len={2.6} spread={0.3} color="#9fb8ff" i={hall && !day && (s.tubes ?? 0) < 0.5 ? 0.05 : 0} />
      <Shaft corners={ROOM_CORNERS} dir={into} len={2.8} spread={0.2} color={day ? "#fff2d8" : "#9fb8ff"} i={place === "room" ? 0.07 : 0} />
      <Dust min={[-0.78, 0.15, -15.0]} max={[0.78, 2.7, -11.5]} n={260} t={t} i={hall ? 0.32 : 0} size={0.01} />
      <Dust min={[-4.2, 0.2, -6.6]} max={[-2.0, 2.6, -4.4]} n={160} t={t} i={place === "room" ? 0.28 : 0} size={0.009} seed={9} />
    </group>
  );
};

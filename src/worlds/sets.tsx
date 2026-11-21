// World registry (picture side): the Set component of every world.
import type React from "react";
import type { Cam } from "../cine/Post.tsx";
import type { SetState } from "./types.ts";
import { CoastSet } from "./coast/Coast.tsx";
import { KosSet } from "./kos/Kos.tsx";

export type SetProps = { place: string; time: string; s: SetState; t: number; cam: Cam };
export const SETS: Record<string, React.FC<SetProps>> = { coast: CoastSet, kos: KosSet };

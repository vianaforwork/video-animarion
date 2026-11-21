// World registry (data side). Add a world: its data.ts here and its Set component in sets.tsx.
import type { WorldData } from "./types.ts";
import { COAST } from "./coast/data.ts";
import { KOS } from "./kos/data.ts";

export const WORLDS: Record<string, WorldData> = { coast: COAST, kos: KOS };

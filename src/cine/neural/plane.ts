import { PlaneGeometry } from "three";
import { cached } from "../../kits/worldforge/geo.ts";

export const planeG = (w: number, h: number) => cached(`pl${w},${h}`, () => new PlaneGeometry(w, h));

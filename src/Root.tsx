import React from "react";
import { Composition } from "remotion";
import { PRESETS } from "./cine/Stage.tsx";
import { CAST_SHEET_FRAMES, CastSheet } from "./lookdev/CastSheet.tsx";
import { WorldLook } from "./lookdev/WorldLook.tsx";
import { OBJECT_SHEET_FRAMES, ObjectSheet } from "./lookdev/ObjectSheet.tsx";
import { COAST_VIEWS, KOS_VIEWS } from "./lookdev/views.ts";
import { Film } from "./film/Film.tsx";
import { compile } from "./director/compile.ts";
import { STORIES } from "./stories/registry.ts";

const { final } = PRESETS.landscape;

// Every story in src/stories/data (written by scripts/make.mjs) becomes <id>-preview and <id>-final:
// portrait (default) 540×960 @ 30 / 1080×1920 @ 60, landscape 960×540 @ 30 / 1920×1080 @ 60.
// Lookdev: cast-sheet, world-<id>, object-sheet (landscape).
// a story that does not compile (being edited, a typo) is left out instead of breaking every other story's render
const durationOf = (s: (typeof STORIES)[number]) => { try { return compile(s).duration; } catch (e) { console.warn(`story "${s.id}" skipped: ${(e as Error).message.split("\n")[0]}`); return null; } };

export const RemotionRoot: React.FC = () => (
  <>
    {STORIES.map((s) => {
      const d = durationOf(s);
      if (d === null) return null;
      const { draft, final } = PRESETS[s.format === "landscape" ? "landscape" : "portrait"];
      return (
        <React.Fragment key={s.id}>
          <Composition id={`${s.id}-preview`} component={Film} defaultProps={{ story: s, audio: s.audio }} durationInFrames={Math.round(d * draft.fps)} fps={draft.fps} width={draft.width} height={draft.height} />
          <Composition id={`${s.id}-final`} component={Film} defaultProps={{ story: s, audio: s.audio }} durationInFrames={Math.round(d * final.fps)} fps={final.fps} width={final.width} height={final.height} />
        </React.Fragment>
      );
    })}
    <Composition id="object-sheet" component={ObjectSheet} durationInFrames={OBJECT_SHEET_FRAMES} fps={1} width={final.width / 2} height={final.height / 2} />
    <Composition id="cast-sheet" component={CastSheet} durationInFrames={CAST_SHEET_FRAMES} fps={1} width={final.width / 2} height={final.height / 2} />
    <Composition id="world-coast" component={WorldLook} defaultProps={{ world: "coast", views: COAST_VIEWS }} durationInFrames={COAST_VIEWS.length} fps={1} width={final.width / 2} height={final.height / 2} />
    <Composition id="world-kos" component={WorldLook} defaultProps={{ world: "kos", views: KOS_VIEWS }} durationInFrames={KOS_VIEWS.length} fps={1} width={final.width / 2} height={final.height / 2} />
  </>
);

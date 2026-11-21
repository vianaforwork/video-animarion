// CINÉSTORY stage: waits for the bundled font, mounts a Remotion-synchronised ThreeCanvas (PCF shadows,
// dpr 1, MSAA in the post chain) and lays the 2D overlay on top — designed at 1080 × 1920 for portrait
// (the default) or 1920 × 1080 for landscape, scaled to the render size. Everything inside must be a pure
// function of the frame.

import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { QaProbe, qaNoOverlay } from "../core/qa/scene-qa.tsx";
import { PCFShadowMap } from "three";
import { fontReady } from "../core/type/fonts.ts";

/** overlay design space per orientation */
export const designOf = (width: number, height: number) => (height > width ? { W: 1080, H: 1920 } : { W: 1920, H: 1080 });

/** Draft (fast look checks) and final (delivery) presets per format. */
export const PRESETS = {
  portrait: { draft: { width: 540, height: 960, fps: 30 }, final: { width: 1080, height: 1920, fps: 60 } },
  landscape: { draft: { width: 960, height: 540, fps: 30 }, final: { width: 1920, height: 1080, fps: 60 } },
} as const;

export const Stage: React.FC<{ children: React.ReactNode; overlay?: () => React.ReactNode }> = ({ children, overlay }) => {
  const { width, height } = useVideoConfig();
  const { W, H } = designOf(width, height);
  const [handle] = useState(() => delayRender("font"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    fontReady().then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {ready ? (
        <>
          <ThreeCanvas
            width={width}
            height={height}
            shadows={{ type: PCFShadowMap }}
            dpr={1}
            gl={{ antialias: false, preserveDrawingBuffer: true, powerPreference: "high-performance" }}
            camera={{ fov: 30, near: 0.05, far: 400, position: [0, 1.6, 4] }}
          >
            {children}
            <QaProbe />
          </ThreeCanvas>
          {overlay && !qaNoOverlay() ? (
            <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `scale(${width / W})`, transformOrigin: "0 0" }}>
              {overlay()}
            </div>
          ) : null}
        </>
      ) : null}
    </AbsoluteFill>
  );
};

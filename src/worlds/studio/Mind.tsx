// The "mind" studio: neural backdrop, drifting motes and the glass brain with its pulsing network.
import React from "react";
import { BrainShell, brainNet, Motes, Network, NeuralBackdrop, type Net } from "../../cine/neural/Brain.tsx";
import { MIND_O } from "./data.ts";

export const MindStudio: React.FC<{ t: number }> = ({ t }) => {
  const net = brainNet().userData.net as Net;
  return (
    <group position={MIND_O}>
      <NeuralBackdrop top="#0f3b66" bottom="#06162b" glow="#3aa6e8" r={60} />
      <Motes t={t} R={5} opacity={0.8} />
      <group rotation={[0, t * 0.12, 0]}>
        <BrainShell t={t} opacity={1} orange={0.85} />
        <Network net={net} t={t} opacity={1} pulse={1} orangeShare={0.25} />
      </group>
    </group>
  );
};

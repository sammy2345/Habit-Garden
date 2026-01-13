import { motion } from "framer-motion";
import type { JSX } from "react";

const STAGE_IMAGES: Record<number, string> = {
  0: "/plants/01.png",
  1: "/plants/02.png",
  2: "/plants/03.png",
  3: "/plants/04.png",
  4: "/plants/05.png",
  5: "/plants/06.png",
};

type PlantVisualProps = {
  stage: number;
  size?: number;
};

function clampStage(stage: number): number {
  if (!Number.isFinite(stage)) return 0;
  if (stage < 0) return 0;
  if (stage > 5) return 5;
  return stage;
}

export function PlantVisual({ stage, size = 180 }: PlantVisualProps): JSX.Element {
  const safeStage = clampStage(stage);
  const src = STAGE_IMAGES[safeStage] ?? STAGE_IMAGES[5];

  return (
    <motion.div
      key={safeStage} // re-animate on stage change
      className="inline-block rounded-full"
      initial={{ boxShadow: "0 0 0 rgba(34,197,94,0)", scale: 0.9, opacity: 0 }}
      animate={{ boxShadow: "0 0 40px rgba(34,197,94,0.45)", scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <img
        src={src}
        alt={`Plant stage ${safeStage}`}
        width={size}
        height={size}
        className="block select-none rounded-full"
        draggable={false}
      />
    </motion.div>
  );
}

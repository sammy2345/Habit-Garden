import { motion } from "framer-motion";
import type { JSX } from "react/jsx-dev-runtime";

const stage0 = "../assets/plants/sprout_stage_0.png",
  stage1 = "../public/plants/01.png",
  stage2 = "../public/plants/02.png",
  stage3 = "../public/plants/03.png",
  stage4 = "../public/plants/04.png",
  stage5 = "../public/plants/05.png";
const STAGE_IMAGES: Record<number, string> = {
  0: stage0,
  1: stage1,
  2: stage2,
  3: stage3,
  4: stage4,
  5: stage5,
};

type PlantVisualProps = {
  stage: number;
  size?: number;
};

export function PlantVisual({
  stage,
  size = 180,
}: PlantVisualProps): JSX.Element {
  const src = STAGE_IMAGES[stage] ?? STAGE_IMAGES[5];

  return (
    <motion.img
      key={`glow-${stage}`} // important: re-animate on stage change
      src={src}
      alt={`Plant stage ${stage}`}
      width={size}
      height={size}
      initial={{ boxShadow: "0 0 0 rgba(34,197,94,0)" }}
      animate={{ boxShadow: "0 0 40px rgba(34,197,94,0.6)" }}
      transition={{ duration: 0.4 }}
      className="rounded-full"
      draggable={false}
    />
  );
}

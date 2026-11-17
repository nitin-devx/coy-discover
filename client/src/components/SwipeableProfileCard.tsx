import { motion, useMotionValue, useTransform } from "motion/react";
import ProfileCard from "./ProfileCard";
import type { Profile, SwipeAction } from "../types";

type Props = {
  profile: Profile;
  disabled: boolean;
  onSwipe: (action: SwipeAction) => void;
};

export default function SwipeableProfileCard({
  profile,
  disabled,
  onSwipe,
}: Props) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-180, 0, 180], [-10, 0, 10]);
  const likeOpacity = useTransform(x, [30, 110], [0, 1]);
  const passOpacity = useTransform(x, [-110, -30], [1, 0]);

  return (
    <motion.div
      drag={disabled ? false : "x"}
      dragSnapToOrigin
      dragMomentum={false}
      style={{ x, rotate, touchAction: "pan-y" }}
      onDragEnd={(_event, info) => {
        if (disabled) return;

        if (info.offset.x >= 100) {
          onSwipe("like");
        } else if (info.offset.x <= -100) {
          onSwipe("pass");
        }
      }}
      className="relative"
    >
      <motion.div
        aria-hidden="true"
        style={{ opacity: likeOpacity }}
        className="pointer-events-none absolute top-6 left-6 z-10 -rotate-12 rounded-lg border-4 border-green-600 bg-white/90 px-4 py-2 text-2xl font-black text-green-700"
      >
        LIKE
      </motion.div>

      <motion.div
        aria-hidden="true"
        style={{ opacity: passOpacity }}
        className="pointer-events-none absolute top-6 right-6 z-10 rotate-12 rounded-lg border-4 border-rose-600 bg-white/90 px-4 py-2 text-2xl font-black text-rose-700"
      >
        PASS
      </motion.div>

      <div onPointerDown={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest("button")
        ) {
          event.stopPropagation();
        }
      }}>
        <ProfileCard
          profile={profile}
          disabled={disabled}
          onSwipe={onSwipe}
        />
      </div>
    </motion.div>
  );
}
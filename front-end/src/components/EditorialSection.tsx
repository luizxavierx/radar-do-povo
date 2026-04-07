import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

import { buildRevealVariants, editorialViewport, type RevealStrategy } from "@/lib/motion";
import { cn } from "@/lib/utils";

type EditorialSectionProps = HTMLMotionProps<"section"> & {
  tone?: "default" | "muted" | "strong";
  delay?: number;
  reveal?: RevealStrategy;
};

const toneClasses: Record<NonNullable<EditorialSectionProps["tone"]>, string> = {
  default: "editorial-panel",
  muted: "editorial-panel-soft",
  strong: "editorial-panel-strong",
};

const EditorialSection = ({
  children,
  className,
  tone = "default",
  delay = 0,
  reveal = "in-view",
  ...props
}: EditorialSectionProps) => {
  const reduceMotion = useReducedMotion();
  const revealLifecycle =
    reveal === "mount"
      ? { initial: "hidden" as const, animate: "visible" as const }
      : {
          initial: "hidden" as const,
          whileInView: "visible" as const,
          viewport: editorialViewport,
        };

  return (
    <motion.section
      {...revealLifecycle}
      variants={buildRevealVariants(Boolean(reduceMotion), { delay })}
      className={cn(toneClasses[tone], className)}
      {...props}
    >
      {children}
    </motion.section>
  );
};

export default EditorialSection;

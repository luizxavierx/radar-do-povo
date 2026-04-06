import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";

import { buildRevealVariants, editorialViewport } from "@/lib/motion";
import { cn } from "@/lib/utils";

type EditorialSectionProps = HTMLMotionProps<"section"> & {
  tone?: "default" | "muted" | "strong";
  delay?: number;
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
  ...props
}: EditorialSectionProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={editorialViewport}
      variants={buildRevealVariants(Boolean(reduceMotion), { delay })}
      className={cn(toneClasses[tone], className)}
      {...props}
    >
      {children}
    </motion.section>
  );
};

export default EditorialSection;

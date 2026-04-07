import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { buildRevealVariants, editorialViewport, type RevealStrategy } from "@/lib/motion";
import { cn } from "@/lib/utils";

type EditorialPageHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  icon?: LucideIcon;
  aside?: ReactNode;
  meta?: ReactNode;
  className?: string;
  align?: "start" | "end";
  reveal?: RevealStrategy;
};

const EditorialPageHeader = ({
  eyebrow,
  title,
  description,
  icon: Icon,
  aside,
  meta,
  className,
  align = "end",
  reveal = "in-view",
}: EditorialPageHeaderProps) => {
  const reduceMotion = useReducedMotion();
  const revealLifecycle =
    reveal === "mount"
      ? { initial: false as const, animate: "visible" as const }
      : {
          initial: false as const,
          whileInView: "visible" as const,
          viewport: editorialViewport,
        };

  return (
    <motion.section
      {...revealLifecycle}
      variants={buildRevealVariants(Boolean(reduceMotion))}
      className={cn("editorial-hero", className)}
    >
      <div
        className={cn(
          "relative z-10 flex flex-col gap-6 xl:flex-row xl:justify-between",
          align === "start" ? "xl:items-start" : "xl:items-end"
        )}
      >
        <div className="max-w-3xl">
          <div className="editorial-eyebrow">
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {eyebrow}
          </div>
          <h1 className="editorial-title mt-4">{title}</h1>
          <p className="editorial-description mt-3 max-w-2xl">{description}</p>
          {meta ? <div className="mt-5 flex flex-wrap gap-2.5">{meta}</div> : null}
        </div>
        {aside ? <div className="xl:w-[420px] xl:shrink-0">{aside}</div> : null}
      </div>
    </motion.section>
  );
};

export default EditorialPageHeader;

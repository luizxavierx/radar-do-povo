import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { buildRevealVariants, editorialViewport } from "@/lib/motion";
import { cn } from "@/lib/utils";

type EditorialPageHeaderProps = {
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  icon?: LucideIcon;
  aside?: ReactNode;
  meta?: ReactNode;
  className?: string;
};

const EditorialPageHeader = ({
  eyebrow,
  title,
  description,
  icon: Icon,
  aside,
  meta,
  className,
}: EditorialPageHeaderProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={editorialViewport}
      variants={buildRevealVariants(Boolean(reduceMotion))}
      className={cn("editorial-hero", className)}
    >
      <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
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

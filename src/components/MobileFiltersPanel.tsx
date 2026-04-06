import { useState, type ReactNode } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { editorialEase } from "@/lib/motion";
import { cn } from "@/lib/utils";

type MobileFiltersPanelProps = {
  title: string;
  helper: string;
  summary: ReactNode;
  countLabel?: string;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
};

const MobileFiltersPanel = ({
  title,
  helper,
  summary,
  countLabel,
  children,
  className,
  defaultOpen = false,
}: MobileFiltersPanelProps) => {
  const [open, setOpen] = useState(defaultOpen);
  const reduceMotion = useReducedMotion();

  return (
    <div className={className}>
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center gap-3 rounded-[1.25rem] border border-border/75 bg-white/90 px-4 py-3 text-left shadow-[0_14px_28px_-28px_rgba(15,23,42,0.32)] transition-colors hover:border-primary/18 hover:bg-primary/[0.03]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] bg-primary/10 text-primary">
            <SlidersHorizontal className="h-4 w-4" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-[11px] leading-5 text-muted-foreground">{helper}</p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[11px] font-semibold text-foreground">{summary}</p>
            {countLabel ? (
              <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                {countLabel}
              </p>
            ) : null}
          </div>

          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open ? "rotate-180" : ""
            )}
          />
        </button>

        <AnimatePresence initial={false}>
          {open ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0.01 }
                  : {
                      duration: 0.22,
                      ease: editorialEase,
                    }
              }
              className="overflow-hidden"
            >
              <div className="pt-3">{children}</div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="hidden md:block">{children}</div>
    </div>
  );
};

export default MobileFiltersPanel;

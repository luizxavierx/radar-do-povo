import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface MobileFiltersPanelProps {
  title: string;
  subtitle: string;
  summary?: string;
  activeCount?: number;
  children: ReactNode;
  className?: string;
}

const MobileFiltersPanel = ({
  title,
  subtitle,
  summary,
  activeCount = 0,
  children,
  className,
}: MobileFiltersPanelProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn(className)}>
      <div className="lg:hidden">
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger className="surface-muted flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/35">
            <div className="flex min-w-0 items-center gap-3">
              <span className="rounded-xl bg-primary/10 p-2 text-primary">
                <SlidersHorizontal className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-[11px] text-muted-foreground">{subtitle}</p>
                {summary ? (
                  <p className="mt-1 line-clamp-1 text-[11px] font-medium text-foreground/80">{summary}</p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-border bg-white text-foreground">
                {activeCount} ativos
              </Badge>
              <ChevronDown
                className={cn("h-4 w-4 text-muted-foreground transition-transform", open ? "rotate-180" : "")}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">{children}</CollapsibleContent>
        </Collapsible>
      </div>

      <div className="hidden lg:block">{children}</div>
    </div>
  );
};

export default MobileFiltersPanel;

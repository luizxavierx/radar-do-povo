import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string;
  variant?: "green" | "yellow" | "blue";
  description?: string;
  helper?: string;
  icon?: LucideIcon;
}

const variantStyles = {
  green: {
    shell: "border-emerald-300/28",
    gradient: "from-emerald-400/12 via-cyan-300/4 to-transparent",
    icon: "border-emerald-200/70 bg-emerald-50 text-emerald-700",
  },
  yellow: {
    shell: "border-amber-300/34",
    gradient: "from-amber-300/18 via-orange-300/5 to-transparent",
    icon: "border-amber-200/70 bg-amber-50 text-amber-700",
  },
  blue: {
    shell: "border-sky-300/30",
    gradient: "from-sky-400/14 via-cyan-300/5 to-transparent",
    icon: "border-sky-200/70 bg-sky-50 text-sky-700",
  },
};

const StatsCard = ({
  label,
  value,
  variant = "green",
  description,
  helper,
  icon: Icon,
}: StatsCardProps) => (
  <div
    className={`relative overflow-hidden rounded-[1.7rem] border bg-card/96 p-5 shadow-card transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-elevated sm:p-6 ${variantStyles[variant].shell}`}
  >
    <div className={`absolute inset-x-0 top-0 h-20 bg-gradient-to-br ${variantStyles[variant].gradient}`} />
    <div className="relative">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <span className={`rounded-[1rem] border p-2 ${variantStyles[variant].icon}`}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-5 text-2xl font-bold font-display tracking-tight text-foreground">{value}</p>
      {helper ? <p className="mt-2 text-[11px] font-medium text-foreground/80">{helper}</p> : null}
      {description ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p> : null}
    </div>
  </div>
);

export default StatsCard;

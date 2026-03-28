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
    shell: "border-emerald-400/30",
    gradient: "from-emerald-400/20 via-cyan-300/10 to-transparent",
  },
  yellow: {
    shell: "border-amber-400/30",
    gradient: "from-amber-300/25 via-orange-300/8 to-transparent",
  },
  blue: {
    shell: "border-blue-400/30",
    gradient: "from-blue-400/20 via-sky-300/10 to-transparent",
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
    className={`relative overflow-hidden rounded-[28px] border bg-card p-5 shadow-card transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-elevated sm:p-6 ${variantStyles[variant].shell}`}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${variantStyles[variant].gradient} opacity-80`} />
    <div className="relative">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <span className="rounded-2xl bg-white/80 p-2 shadow-sm">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-4 text-2xl font-bold font-display tracking-tight text-foreground">{value}</p>
      {helper ? <p className="mt-2 text-[11px] font-medium text-foreground/80">{helper}</p> : null}
      {description ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{description}</p> : null}
    </div>
  </div>
);

export default StatsCard;

import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: string;
  variant?: "green" | "yellow" | "blue";
  description?: string;
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
  icon: Icon,
}: StatsCardProps) => (
  <div
    className={`relative overflow-hidden rounded-2xl border bg-card p-5 shadow-card transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-elevated ${variantStyles[variant].shell}`}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${variantStyles[variant].gradient} opacity-80`} />
    <div className="relative">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </p>
        {Icon ? (
          <span className="rounded-lg bg-white/70 p-1.5">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 text-2xl font-bold font-display text-foreground">{value}</p>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
    </div>
  </div>
);

export default StatsCard;

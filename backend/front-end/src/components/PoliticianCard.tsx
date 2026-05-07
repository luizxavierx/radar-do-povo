import { Trophy, Medal, Award, Hash } from "lucide-react";
import type { Politician } from "@/data/politicians";

const RankBadge = ({ rank }: { rank: number }) => {
  if (rank === 1)
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-warm flex items-center justify-center shadow-card">
        <Trophy className="h-5 w-5 text-secondary-foreground" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        <Medal className="h-5 w-5 text-muted-foreground" />
      </div>
    );
  if (rank === 3)
    return (
      <div className="w-10 h-10 rounded-full bg-secondary/40 flex items-center justify-center">
        <Award className="h-5 w-5 text-secondary-foreground" />
      </div>
    );
  return (
    <div className="w-10 h-10 rounded-full bg-muted/60 flex items-center justify-center">
      <span className="text-sm font-bold font-display text-muted-foreground">{rank}º</span>
    </div>
  );
};

const partyColor = (party: string) => {
  const colors: Record<string, string> = {
    MDB: "bg-accent/15 text-accent",
    PL: "bg-accent/15 text-accent",
    PSB: "bg-secondary/20 text-secondary-foreground",
    PP: "bg-primary/15 text-primary",
    PSD: "bg-accent/15 text-accent",
    UNIÃO: "bg-accent/15 text-accent",
    PT: "bg-destructive/15 text-destructive",
  };
  return colors[party] || "bg-muted text-muted-foreground";
};

interface PoliticianCardProps {
  politician: Politician;
}

const PoliticianCard = ({ politician }: PoliticianCardProps) => (
  <div className="flex items-center gap-3 sm:gap-4 p-4 bg-card rounded-xl shadow-card hover:shadow-elevated transition-all duration-200 border border-border/50 group cursor-pointer hover:-translate-y-0.5">
    <RankBadge rank={politician.rank} />

    <img
      src={politician.photo}
      alt={politician.name}
      className="w-11 h-11 rounded-full object-cover border-2 border-border flex-shrink-0 group-hover:border-primary/40 transition-colors"
      loading="lazy"
    />

    <div className="flex-1 min-w-0">
      <h3 className="text-sm font-semibold font-display truncate group-hover:text-primary transition-colors">
        {politician.name}
      </h3>
      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${partyColor(politician.party)}`}>
          {politician.party}
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
          {politician.state}
        </span>
        <span className="text-[11px] text-muted-foreground hidden sm:inline">
          • {politician.amendments} emendas
        </span>
      </div>
    </div>

    <div className="text-right flex-shrink-0">
      <p className="text-sm font-bold text-primary font-display">
        {politician.totalValue}
      </p>
      <p className="text-[10px] text-muted-foreground sm:hidden">
        {politician.amendments} emendas
      </p>
    </div>
  </div>
);

export default PoliticianCard;

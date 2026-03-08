import { useState } from "react";
import { Users, Landmark, FileText, BarChart3 } from "lucide-react";

const tabs = [
  { id: "pix-dep", label: "Pix Deputados", icon: Users },
  { id: "pix-sen", label: "Pix Senadores", icon: Landmark },
  { id: "desp-dep", label: "Despesas Dep.", icon: FileText },
  { id: "desp-sen", label: "Despesas Sen.", icon: BarChart3 },
];

interface DataTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const DataTabs = ({ activeTab, onTabChange }: DataTabsProps) => (
  <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
          activeTab === tab.id
            ? "bg-gradient-hero text-primary-foreground shadow-card"
            : "bg-card text-muted-foreground hover:bg-muted border border-border/50"
        }`}
      >
        <tab.icon className="h-3.5 w-3.5" />
        {tab.label}
      </button>
    ))}
  </div>
);

export default DataTabs;

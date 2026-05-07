import { FileText, Zap, FolderOpen, Clock } from "lucide-react";

const InfoPanel = () => (
  <div className="space-y-4">
    {/* Entenda os Dados */}
    <div className="bg-card rounded-xl p-5 shadow-card border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="h-5 w-5 text-primary" />
        <h3 className="font-display font-bold text-sm">Entenda os Dados</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Informações sobre os diferentes tipos de dados exibidos
      </p>

      <div className="space-y-3">
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold">Cota Parlamentar</span>
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-0.5 ml-5">
            <li>• Sistema de reembolso de despesas parlamentares</li>
            <li>• Dados com 1 mês de defasagem</li>
            <li>• Fonte: API da Câmara dos Deputados</li>
          </ul>
        </div>

        <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-bold">Emendas Pix</span>
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-0.5 ml-5">
            <li>• Transferências diretas para municípios</li>
            <li>• Sem necessidade de convênio ou licitação</li>
            <li>• Fonte: Portal da Transparência</li>
          </ul>
        </div>

        <div className="rounded-lg border border-secondary/30 bg-secondary/10 p-3">
          <div className="flex items-center gap-2 mb-1">
            <FolderOpen className="h-3.5 w-3.5 text-secondary-foreground" />
            <span className="text-xs font-bold">Projetos Definidos</span>
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-0.5 ml-5">
            <li>• Valores maiores para projetos específicos</li>
            <li>• Vinculadas a funções orçamentárias</li>
            <li>• Fonte: Portal da Transparência</li>
          </ul>
        </div>
      </div>

      <div className="flex items-center gap-1.5 mt-4 text-[11px] text-muted-foreground">
        <Clock className="h-3 w-3" />
        Última atualização: 08/03/2026 às 18:15
      </div>
    </div>

    {/* Estatísticas Rápidas */}
    <div className="bg-card rounded-xl p-5 shadow-card border border-border/50">
      <h3 className="font-display font-bold text-sm mb-3">Estatísticas Rápidas</h3>
      <div className="space-y-2.5">
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Deputados monitorados</span>
          <span className="text-sm font-bold font-display">30+</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Senadores monitorados</span>
          <span className="text-sm font-bold font-display">30+</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Ano de referência</span>
          <span className="text-sm font-bold font-display text-primary">2025</span>
        </div>
      </div>
    </div>
  </div>
);

export default InfoPanel;

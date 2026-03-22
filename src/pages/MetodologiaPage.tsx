import InstitutionalPageShell from "@/components/InstitutionalPageShell";

const sections = [
  {
    title: "Origem dos dados",
    paragraphs: [
      "Os dados exibidos no Radar do Povo partem de bases publicas e documentos disponibilizados por orgaos oficiais.",
      "Cada tela organiza esses dados em recortes analiticos voltados para leitura mais clara de gastos, autoria, volume e concentracao.",
    ],
  },
  {
    title: "Tratamento e agregacao",
    paragraphs: [
      "Os totais e rankings podem resultar de filtros por periodo, orgao, autor, viajante ou outras chaves presentes na base.",
      "Sempre que possivel, o painel preserva o detalhe rastreavel por registro para permitir verificacao do numero agregado.",
    ],
    bullets: [
      "Totais dependem do recorte ativo.",
      "Listas e rankings podem usar paginacao e ordenacao especifica.",
      "A leitura recomendada e comparar indicador, contexto e detalhe ao mesmo tempo.",
    ],
  },
  {
    title: "Atualizacao e cache",
    paragraphs: [
      "Para manter desempenho e estabilidade, partes do painel usam cache temporario de consulta.",
      "Mesmo com cache, os resultados seguem vinculados ao estado mais recente disponivel na base oficial no momento da atualizacao do sistema.",
    ],
  },
];

const MetodologiaPage = () => (
  <InstitutionalPageShell
    eyebrow="Metodologia"
    title="Como os dados sao organizados"
    intro="Explicacao resumida sobre origem, agregacao e leitura dos indicadores exibidos na plataforma."
    sections={sections}
  />
);

export default MetodologiaPage;

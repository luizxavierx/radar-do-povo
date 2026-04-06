import InstitutionalPageShell from "@/components/InstitutionalPageShell";

const sections = [
  {
    title: "Origem dos dados",
    paragraphs: [
      "Os dados exibidos no Radar do Povo partem de bases publicas, APIs oficiais e documentos disponibilizados por orgaos institucionais.",
      "Cada tela reorganiza esse material em recortes analiticos voltados para leitura mais clara de gastos, autoria, volume, concentracao e historico.",
    ],
  },
  {
    title: "Recortes, filtros e agregacao",
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
    title: "Atualizacao, cache e consistencia",
    paragraphs: [
      "Para manter desempenho e estabilidade, partes do painel usam cache temporario de consulta e enriquecimento externo.",
      "Mesmo com cache, o compromisso do projeto continua sendo refletir a base oficial mais recente disponivel quando a plataforma atualiza seus recortes.",
    ],
  },
  {
    title: "Leitura recomendada",
    paragraphs: [
      "A interpretacao mais segura combina indicador agregado, detalhe do registro e fonte institucional correspondente.",
      "Quando houver divergencia entre visao resumida e documento original, a referencia final deve ser a base publica de origem.",
    ],
  },
];

const MetodologiaPage = () => (
  <InstitutionalPageShell
    eyebrow="Metodologia"
    title="Como os dados sao organizados"
    intro="Explicacao resumida sobre origem, agregacao e leitura dos indicadores exibidos na plataforma."
    sections={sections}
    seoTitle="Metodologia | Radar do Povo"
    seoDescription="Entenda como o Radar do Povo organiza dados publicos, aplica filtros, agrega indicadores e preserva a rastreabilidade das informacoes."
    seoPath="/metodologia"
  />
);

export default MetodologiaPage;

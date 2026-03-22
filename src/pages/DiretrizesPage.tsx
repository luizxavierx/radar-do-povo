import InstitutionalPageShell from "@/components/InstitutionalPageShell";

const sections = [
  {
    title: "Compromisso editorial",
    paragraphs: [
      "O Radar do Povo busca apresentar informacao publica com clareza, contexto e legibilidade, sem transformar o dado em ruído visual.",
      "A prioridade editorial do projeto e permitir leitura orientada a evidencias e comparacao entre recortes relevantes.",
    ],
  },
  {
    title: "Neutralidade na apresentacao",
    paragraphs: [
      "A plataforma organiza e destaca dados por criterios analiticos de interesse publico, como volume, gasto, concentracao e recorrencia.",
      "Os destaques visuais nao devem ser interpretados como juizo conclusivo sobre legalidade, merito ou irregularidade de um registro.",
    ],
    bullets: [
      "Indicadores servem para leitura e investigacao, nao para sentenca automatica.",
      "Comparacoes devem considerar periodo, universo e metodologia.",
      "Perfis e rankings podem refletir apenas o recorte selecionado.",
    ],
  },
  {
    title: "Correcao e transparencia",
    paragraphs: [
      "Quando houver necessidade de revisao, a plataforma pode ajustar visualizacoes, nomenclaturas, filtros ou textos de apoio.",
      "Sugestoes de melhoria e apontamentos de inconsistencias podem ser enviados pelo canal institucional do projeto.",
    ],
  },
];

const DiretrizesPage = () => (
  <InstitutionalPageShell
    eyebrow="Diretriz editorial"
    title="Diretrizes editoriais do projeto"
    intro="Principios usados para organizar os dados, definir destaques visuais e manter uma leitura publica responsavel."
    sections={sections}
  />
);

export default DiretrizesPage;

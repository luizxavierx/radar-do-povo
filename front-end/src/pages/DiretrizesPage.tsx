import InstitutionalPageShell from "@/components/InstitutionalPageShell";

const sections = [
  {
    title: "Compromisso editorial",
    paragraphs: [
      "O Radar do Povo busca apresentar informacao publica com clareza, contexto e legibilidade, sem transformar o dado em ruido visual.",
      "A prioridade editorial do projeto e permitir leitura orientada por evidencia e comparacao entre recortes realmente relevantes.",
    ],
  },
  {
    title: "Criterios de apresentacao",
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
      "Sugestoes de melhoria, apontamentos de inconsistencias e observacoes editoriais podem ser enviados pelo canal institucional do projeto.",
    ],
  },
  {
    title: "Limites editoriais",
    paragraphs: [
      "O projeto organiza e contextualiza dados; ele nao substitui investigacao documental, contraditorio institucional ou validacao juridica.",
      "Recortes comparativos devem sempre ser lidos junto com periodo, universo analisado e criterios metodologicos da tela.",
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

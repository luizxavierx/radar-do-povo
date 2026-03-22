import InstitutionalPageShell from "@/components/InstitutionalPageShell";

const sections = [
  {
    title: "Finalidade do painel",
    paragraphs: [
      "O Radar do Povo organiza dados publicos para facilitar leitura, comparacao e acompanhamento civico.",
      "O painel foi pensado para uso jornalistico, academico, institucional e para consulta de interesse publico em geral.",
    ],
  },
  {
    title: "Uso permitido",
    paragraphs: [
      "As informacoes exibidas podem ser consultadas, citadas e reutilizadas, desde que o usuario preserve o contexto do recorte e mencione a origem publica dos dados.",
    ],
    bullets: [
      "Recomendamos sempre citar o periodo e os filtros aplicados.",
      "Recortes numericos podem mudar quando as bases oficiais forem atualizadas.",
      "Interpretacoes editoriais devem ser distinguidas do dado bruto.",
    ],
  },
  {
    title: "Limites e responsabilidade",
    paragraphs: [
      "O painel nao substitui a publicacao oficial do orgao de origem nem documentos administrativos formais.",
      "Erros de base, mudancas retroativas e ajustes de classificacao podem afetar resultados publicados anteriormente.",
    ],
  },
];

const TermosPage = () => (
  <InstitutionalPageShell
    eyebrow="Termos"
    title="Termos de uso"
    intro="Regras gerais para consulta, reutilizacao e interpretacao das informacoes organizadas no Radar do Povo."
    sections={sections}
  />
);

export default TermosPage;

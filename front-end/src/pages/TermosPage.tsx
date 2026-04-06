import InstitutionalPageShell from "@/components/InstitutionalPageShell";

const sections = [
  {
    title: "Finalidade do painel",
    paragraphs: [
      "O Radar do Povo organiza dados publicos para facilitar leitura, comparacao e acompanhamento civico.",
      "A plataforma foi desenhada para uso jornalistico, academico, institucional e para consulta de interesse publico em geral.",
    ],
  },
  {
    title: "Uso e citacao",
    paragraphs: [
      "As informacoes exibidas podem ser consultadas, citadas e reutilizadas, desde que o usuario preserve o contexto do recorte e mencione a origem publica das bases utilizadas.",
    ],
    bullets: [
      "Recomendamos sempre citar o periodo e os filtros aplicados.",
      "Recortes numericos podem mudar quando as bases oficiais receberem atualizacoes ou revisoes retroativas.",
      "Leituras editoriais, conclusoes e opinioes devem ser distinguidas do dado bruto.",
    ],
  },
  {
    title: "Limites de uso e responsabilidade",
    paragraphs: [
      "O painel nao substitui a publicacao oficial do orgao de origem, o documento administrativo formal ou a verificacao em fonte primaria.",
      "Erros de base, mudancas retroativas, reclassificacoes e diferencas metodologicas entre fontes podem afetar resultados publicados anteriormente.",
    ],
  },
  {
    title: "Escopo da plataforma",
    paragraphs: [
      "O projeto busca ampliar legibilidade e rastreabilidade, nao emitir juizo automatico sobre legalidade, legitimidade ou irregularidade de um registro.",
      "Toda leitura relevante deve considerar o recorte selecionado, o contexto institucional e a fonte publica correspondente.",
    ],
  },
];

const TermosPage = () => (
  <InstitutionalPageShell
    eyebrow="Termos"
    title="Termos de uso"
    intro="Regras gerais para consulta, reutilizacao e interpretacao das informacoes organizadas no Radar do Povo."
    sections={sections}
    seoTitle="Termos de uso | Radar do Povo"
    seoDescription="Consulte os termos de uso do Radar do Povo para entender o escopo da plataforma, limites de interpretacao e boas praticas de citacao."
    seoPath="/termos"
  />
);

export default TermosPage;

import InstitutionalPageShell from "@/components/InstitutionalPageShell";

const sections = [
  {
    title: "Quando entrar em contato",
    paragraphs: [
      "Use este canal para relatar correcoes, observacoes editoriais, problemas de exibicao, sugestoes de melhoria e contatos profissionais relacionados ao projeto.",
      "Quando houver uma divergencia de leitura, vale informar a pagina, o politico, o recorte de anos e o ponto exato que precisa de revisao.",
    ],
  },
  {
    title: "Como facilitar a analise",
    paragraphs: [
      "Mensagens objetivas com link, filtro aplicado e descricao curta do problema ajudam a equipe a reproduzir o caso mais rapido.",
      "Se houver diferenca entre painel e fonte oficial, envie tambem a referencia publica usada na comparacao.",
    ],
    bullets: [
      "Email institucional: radardopovo@proton.me",
      "Inclua a rota da pagina ou o nome do politico quando houver.",
      "Se possivel, informe o recorte de anos e filtros utilizados.",
    ],
  },
  {
    title: "Escopo do suporte",
    paragraphs: [
      "A equipe do projeto pode revisar apresentacao, metodologia, nomenclaturas, integridade do painel e comportamento das telas.",
      "Questoes sobre autenticidade administrativa do documento original devem ser verificadas junto ao orgao responsavel pela base oficial.",
    ],
  },
];

const ContatoPage = () => (
  <InstitutionalPageShell
    eyebrow="Contato"
    title="Fale com o Radar do Povo"
    intro="Canal dedicado para correcoes, observacoes sobre o painel e comunicacao institucional relacionada ao projeto."
    sections={sections}
    seoTitle="Contato | Radar do Povo"
    seoDescription="Entre em contato com o Radar do Povo para relatar correcoes, sugerir melhorias e tratar comunicacao institucional sobre a plataforma."
    seoPath="/contato"
  />
);

export default ContatoPage;

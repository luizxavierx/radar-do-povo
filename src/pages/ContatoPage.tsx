import InstitutionalPageShell from "@/components/InstitutionalPageShell";

const sections = [
  {
    title: "Canal de contato",
    paragraphs: [
      "O canal institucional do projeto e destinado a correcoes, observacoes editoriais, duvidas sobre recortes e contato profissional.",
      "Mensagens claras com link, periodo e tela relacionada ajudam a acelerar a analise do caso.",
    ],
    bullets: [
      "Email: radardopovo@proton.me",
      "Inclua a rota da pagina ou o nome do politico quando houver.",
      "Se possivel, informe o recorte de anos e filtros utilizados.",
    ],
  },
  {
    title: "Quando entrar em contato",
    paragraphs: [
      "Use esse canal para reportar problemas de exibicao, divergencias de leitura, sugestoes de melhoria e pedidos institucionais relacionados ao projeto.",
      "O contato nao substitui a comunicacao oficial com o orgao de origem do dado.",
    ],
  },
  {
    title: "Escopo do suporte",
    paragraphs: [
      "A equipe do projeto pode revisar apresentacao, metodologia, nomenclaturas e integridade do painel.",
      "Questões sobre autenticidade administrativa do documento original devem ser verificadas junto ao orgao que publicou a base oficial.",
    ],
  },
];

const ContatoPage = () => (
  <InstitutionalPageShell
    eyebrow="Contato"
    title="Contato institucional"
    intro="Canal dedicado para correcoes, observacoes sobre o painel e comunicacao relacionada ao projeto."
    sections={sections}
  />
);

export default ContatoPage;

# Radar do Povo

Plataforma de transparência política focada em leitura clara de dados públicos. O projeto organiza viagens oficiais, emendas parlamentares, rankings comparativos e perfis políticos em uma interface analítica pensada para consulta pública, jornalística e institucional.

Este repositório contém o frontend web publicado em [radardopovo.com](https://radardopovo.com). A aplicação consome um backend Laravel privado via GraphQL e endpoints REST otimizados para leitura.

## Visão geral

O objetivo do Radar do Povo é transformar bases públicas dispersas em uma experiência de consulta mais legível, rápida e contextualizada. Em vez de expor apenas tabelas cruas, a interface combina:

- rankings e recortes comparativos
- exploração de viagens oficiais
- perfis políticos com dossiê consolidado
- navegação por filtros, paginação e indicadores de contexto
- SEO e compartilhamento para indexação e circulação pública

## Principais áreas do produto

- **Home**: panorama institucional, busca rápida e destaques de políticos.
- **Busca**: filtro por nome, partido, UF e cargo atual.
- **Perfil do político**: dossiê consolidado com emendas, viagens, notícias e referências externas.
- **Viagens**: painel analítico com filtros, rankings e detalhamento por viajante, órgão e período.
- **Rankings**: comparativos de emendas por autor, tipo, país e série anual.
- **Páginas institucionais**: metodologia, diretrizes editoriais, termos e contato.

## Stack principal

- React 18
- TypeScript
- Vite
- TanStack Query
- React Router
- Tailwind CSS
- shadcn/ui + Radix UI
- Recharts

## Stack de backend utilizada pelo produto

Embora este repositório publique o frontend, o projeto foi desenhado em cima de um backend Laravel dedicado, consumido internamente pela aplicação.

- Laravel
- PHP 8+
- PostgreSQL
- Redis
- GraphQL
- REST
- Apache como reverse proxy
- Cloudflare na borda

## O que existe no backend

O backend concentra a parte mais sensível da plataforma:

- agregação de dados públicos de viagens oficiais
- agregação e rankings de emendas parlamentares
- dossiê consolidado por político
- enriquecimento com fontes externas como Câmara, Senado, TSE, LexML e Wikipedia
- cache de aplicação e cache HTTP para reduzir latência
- rate limiting por rota
- headers de segurança e proteção de borda

Na prática, a aplicação opera em arquitetura híbrida:

- **GraphQL** para listagens e navegação mais flexível
- **REST** para endpoints pesados e especializados, como rankings, notícias e dossiês

## Skills técnicas demonstradas no backend

Além do frontend, o projeto também demonstra capacidade real de backend e operação:

- **Modelagem de API**: desenho híbrido entre GraphQL e REST para equilibrar flexibilidade e performance.
- **Otimização de consulta**: redução de gargalos, cache de resposta e reaproveitamento de resultados quentes.
- **Banco de dados**: leitura analítica sobre PostgreSQL com foco em paginação, agregação e relatórios.
- **Caching distribuído**: uso de Redis para cache e throttling consistente em produção.
- **Hardening de API pública**: chave compartilhada de borda, rate limit por rota, trust proxies e headers de segurança.
- **Observabilidade**: request id, logging enriquecido e rastreabilidade para investigação de abuso e timeout.
- **Integração com fontes externas**: composição de dados públicos vindos de múltiplos órgãos e bases.
- **Operação em produção**: Apache como proxy reverso, Cloudflare na borda, build estático no frontend e backend isolado internamente.
- **Resiliência**: fallback de cache, proteção contra burst e redução de exposição de erro para o usuário final.

## Arquitetura resumida

O frontend funciona como SPA, mas foi estruturado para reduzir custo de navegação e melhorar indexação:

- roteamento por página com `React Router`
- divisão por rotas com `lazy loading`
- cache e reuso de respostas com `TanStack Query`
- integração híbrida com GraphQL e REST
- fallback resiliente para timeout e indisponibilidade parcial
- metadados dinâmicos por rota para SEO
- sitemaps públicos e `robots.txt` controlado

## Skills demonstradas neste projeto

Este projeto é relevante para portfólio porque mostra, na prática, combinação de produto, engenharia e entrega:

- **Frontend architecture**: organização de SPA grande em páginas, hooks, serviços e componentes reutilizáveis.
- **Data visualization**: uso de gráficos, KPIs, listas e estados vazios para leitura pública de dados complexos.
- **Performance tuning**: cache de consulta, staged loading, reaproveitamento de dados anteriores e redução de timeout visual.
- **SEO técnico**: títulos e descrições por rota, canonical, Open Graph, Twitter Cards, JSON-LD, sitemap index e páginas de perfis.
- **Integração com backend**: consumo de GraphQL e endpoints REST especializados, com tratamento de erro e retry controlado.
- **Backend engineering**: desenho de API, cache Redis, agregações pesadas, segurança por middleware e exposição pública controlada.
- **UX para dados públicos**: interface pensada para filtros, exploração, comparação e compartilhamento.
- **Entrega em produção**: publicação em VPS com Apache reverso, integração com Cloudflare e operação contínua.
- **Hardening de leitura pública**: trabalho conjunto com backend para caching, rate limiting e redução de exposição de erro.

## Destaques de engenharia

- Perfis políticos com URLs canônicas amigáveis.
- Compartilhamento de páginas e perfis em canais sociais.
- Tratamento de timeout sem “grudar erro” na interface quando já existe dado válido.
- SEO por rota com dados estruturados para páginas principais e perfis.
- Sitemaps separados para páginas institucionais e perfis curados.
- Painel de viagens e rankings com carregamento em ondas para reduzir stress no backend.

## Estrutura do repositório

```text
src/
  api/            clientes, queries e types
  components/     layout, UI compartilhada e blocos de tela
  hooks/          cache, paginação e acesso a dados
  lib/            utilitários, formatação e SEO
  pages/          rotas principais da aplicação
  services/       integração HTTP e regras de consulta
public/           arquivos públicos como robots, sitemaps e imagem social
```

## Como rodar localmente

### Requisitos

- Node.js 18+
- npm

### Instalação

```bash
npm install
```

### Ambiente

Use o arquivo `.env.example` como base. Os pontos principais são:

- `RADAR_API_BASE`
- `RADAR_PROXY_TARGET`
- `RADAR_SHARED_API_KEY` apenas para desenvolvimento local com proxy
- `VITE_MEMBER_API_BASE_URL`
- `VITE_MEMBER_PORTAL_BASE_URL`

### Desenvolvimento

```bash
npm run dev
```

### Build

```bash
npm run build
```

## Deploy

O projeto em produção é servido como build estático em VPS, com Apache apontando para `dist/` e fazendo proxy do backend interno:

- `/graphql` -> backend Laravel
- `/api/*` -> backend Laravel
- `/healthz` -> backend Laravel

Os artefatos públicos importantes para indexação ficam em `public/`:

- `robots.txt`
- `sitemap.xml`
- `sitemap-pages.xml`
- `sitemap-politicos.xml`

## Status atual

O frontend está em produção e foi evoluído com foco em:

- legibilidade institucional
- performance percebida
- estabilidade sob timeout
- SEO técnico para indexação e compartilhamento

## Autor / contexto

Projeto desenvolvido e refinado como produto real de transparência política, com foco em experiência de consulta pública e engenharia pragmática orientada a operação.

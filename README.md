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

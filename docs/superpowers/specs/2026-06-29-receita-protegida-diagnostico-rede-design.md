# Receita Protegida na tela de Diagnóstico de Rede — Design

**Data:** 2026-06-29
**Tela:** `src/screens/settings/backoffice/network-diagnostics/`

## Objetivo

Exibir, na aba **Resumo** do Diagnóstico de Rede, a mensalidade recuperada (R$)
dos casos em risco de cancelamento (`churn_risk`) que foram **resolvidos** no
período selecionado. A apresentação tem duas partes:

1. **Card de destaque** no topo da aba Resumo, com o valor total em R$.
2. **Dois gráficos interativos por dia** (lib `react-native-gifted-charts`): um de
   barras (casos por dia) e outro de linha/área (receita protegida por dia, R$),
   cada um com tooltip por toque mostrando os valores do dia.

A métrica vem de campos novos que o backend (webhook n8n `casos-diagnostico-rede`,
action `stats`) já envia e que o app hoje ignora:

- `stats.receita_protegida` — R$ total no período (soma da mensalidade `plano_valor`
  dos casos `churn_risk` resolvidos).
- `by_day[].valor_protegido` — R$ por dia (mesma métrica, bucketizada por
  `created_at` no fuso `America/Sao_Paulo`). Garante `Σ by_day[].valor_protegido
  === stats.receita_protegida`.

## Escopo

Mudança **somente no app mobile** (consumo). Nenhuma alteração no backend/n8n — os
campos já existem na resposta de `stats`. As métricas existentes mantêm seu
significado; o gráfico de casos por dia (`TrendChart`) é reescrito internamente
para usar a lib de chart, mas consome os mesmos dados e categorias de hoje.

## Dependências

- **`react-native-gifted-charts`** (`^1.4.77`) — gráficos de barra/linha em JS sobre
  `react-native-svg` (já instalado, `^15.11.2`). Sem dep nativa nova de peso;
  autolinkado pelo EAS. Escolhido por ter **tooltip/foco por toque** (mostra o valor
  do dia ao tocar) — exatamente o que torna os valores diários legíveis no mobile.
- **`expo-linear-gradient`** — peer da lib (usada nos preenchimentos de área/gradiente
  e exigida em import). Instalar via `npx expo install expo-linear-gradient` (módulo
  Expo SDK 53, sem config plugin / prebuild).
- Descartado **`victory-native@41`**: exige `@shopify/react-native-skia` (dep nativa
  pesada, não instalada) → risco no build EAS.

Instalar com o gerenciador do projeto (pnpm) respeitando o lockfile.

## Camada de dados (`data/`)

### `types.ts`
- `NetworkStats`: adicionar `receita_protegida?: number`.
- `NetworkDayBucket`: adicionar `valor_protegido?: number`.

Campos opcionais — períodos/respostas legados sem eles continuam válidos.

### `format.ts`
- Novo `formatBRL(value?: number): string`:
  - Usa `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`.
  - `undefined`/`NaN` → `R$ 0,00`.
- `EMPTY_BUCKET` passa a incluir `valor_protegido: 0`, para o `zeroFillByDay`
  manter o eixo X contínuo (dias sem casos ficam zerados também no valor).

### `client.ts`
Sem mudança. `fetchNetworkStats` já retorna a resposta tipada como `NetworkStats`;
os campos novos fluem automaticamente assim que entram no tipo.

## UI — Card de destaque (`ui/ProtectedRevenueCard.tsx`, novo)

- Card largo (full-width) renderizado no topo da aba Resumo, **acima** do
  `StatCards`.
- Fundo verde suave (`colors.greenSoft` / borda `colors.successBorder`) para leitura
  de "dinheiro positivo/recuperado".
- Conteúdo:
  - Eyebrow `PROTECTED_TITLE` ("RECEITA PROTEGIDA").
  - Valor grande `formatBRL(stats?.receita_protegida)` em `colors.green`.
  - Subtítulo fixo `PROTECTED_SUBTITLE` ("Mensalidade recuperada de casos em risco
    resolvidos no período.").
- Estado de carregamento (`loadingStats` ou `stats == null`): valor mostra `—`.
- **Sem contagem de casos** no subtítulo: o `stats` não traz a interseção
  `churn_risk && resolvido` (só o valor em R$). Não fabricar contagem a partir de
  `churn_risk`/`resolvidos` (são conjuntos diferentes).
- **Sem ícone novo** — um escudo SVG fica como melhoria futura opcional; o destaque
  vem do fundo tintado e do tamanho do valor.

Props: `{ stats: NetworkStats | null; loading: boolean }` (espelha `StatCards`).

## UI — Gráfico de casos por dia (`ui/TrendChart.tsx`, reescrever)

Substituir as barras feitas à mão por um **`BarChart` empilhado** do
`react-native-gifted-charts`, preservando dados e semântica atuais.

- Fonte: `zeroFillByDay(from, to, stats?.by_day)` (eixo X contínuo, mesmo com dias
  zerados).
- **Barras empilhadas por dia** com as 3 categorias atuais (cores do tema):
  offline (`colors.red`), instáveis (`colors.amber`), conexões observadas
  (`colors.green`). Mapear cada bucket para `stackData` do gifted-charts.
- **Interação**: tocar uma barra/dia abre um tooltip com o detalhamento do dia —
  data (`DD/MM`), total e a quebra por categoria. Usar o callback de toque por barra
  da lib + estado local de "dia selecionado" + `renderTooltip`/componente próprio
  estilizado com o tema.
- **Eixo X em mobile**: com janelas longas (ex.: 30 dias) os rótulos lotam; mostrar
  rótulo a cada N dias (ou rotacionar) e confiar no tooltip para o valor exato.
  Largura fixada ao container; sem scroll horizontal por padrão.
- Legenda mantém os 3 itens existentes (Offline / Instáveis / Conexões observadas).
- Título/subtítulo: reutilizar `TREND_TITLE` / `TREND_SUBTITLE`.

## UI — Gráfico de receita protegida por dia (`ui/RevenueChart.tsx`, novo)

Gráfico separado, **abaixo** do de casos, dedicado ao R$/dia.

- **`LineChart` (com área)** do gifted-charts plotando `valor_protegido` por dia a
  partir do mesmo `zeroFillByDay`. Cor verde (`colors.green`) — consistente com o
  card de destaque (receita = verde); como é um gráfico isolado, não há conflito com
  as barras verdes do outro gráfico.
- **Escala própria** em R$ (eixo Y independente do gráfico de casos — unidades
  diferentes). Quando todos os `valor_protegido` forem 0, renderizar estado vazio
  curto (linha rasa/baseline) sem quebrar.
- **Interação**: `pointerConfig` do gifted-charts (toque/arraste) com
  `pointerLabelComponent` mostrando `DD/MM` + `formatBRL(valor_protegido)` do dia.
- Eixo Y rotulado em R$ (formato curto, ex.: `R$ 70`); rótulos do eixo X afinados
  como no gráfico de casos.
- Título: `REVENUE_TREND_TITLE`; subtítulo: `REVENUE_TREND_SUBTITLE`.
- Props: `{ stats: NetworkStats | null; from: string; to: string }` (espelha
  `TrendChart`).

> Sem token de cor novo: o verde do tema (`colors.green`) cobre a receita; as cores
> das barras já existem. A separação em dois gráficos elimina o problema de
> dual-axis/colisão de cor da versão anterior do design.

## i18n (`i18n/pt.json`, `i18n/pt_BR.json`, `i18n/en.json`)

Novas chaves dentro de `NETWORK_DIAGNOSTICS`:

| Chave | pt / pt_BR | en |
|-------|------------|----|
| `PROTECTED_TITLE` | `RECEITA PROTEGIDA` | `PROTECTED REVENUE` |
| `PROTECTED_SUBTITLE` | `Mensalidade recuperada de casos em risco resolvidos no período.` | `Monthly revenue recovered from resolved at-risk cases in the period.` |
| `REVENUE_TREND_TITLE` | `Receita protegida por dia` | `Protected revenue per day` |
| `REVENUE_TREND_SUBTITLE` | `Toque em um dia para ver o valor.` | `Tap a day to see the amount.` |
| `TREND_TAP_HINT` | `Toque em um dia para ver os detalhes.` | `Tap a day to see details.` |

## Tela (`NetworkDiagnosticsScreen.tsx`)

No branch da aba `resumo` (hoje renderiza `<StatCards>` + `<TrendChart>`):

1. Inserir `<ProtectedRevenueCard stats={state.stats} loading={state.loadingStats} />`
   **antes** do `<StatCards>`.
2. Após `<TrendChart>` (casos por dia), renderizar
   `<RevenueChart stats={state.stats} from={state.from} to={state.to} />`.

## Testes (`data/specs/format.spec.ts`)

- `formatBRL`:
  - valor com centavos → string BRL pt-BR.
  - `0` → `R$ 0,00`.
  - `undefined` → `R$ 0,00`.
  - arredondamento a 2 casas.
- `zeroFillByDay`:
  - buckets existentes preservam `valor_protegido`.
  - lacunas são preenchidas com `valor_protegido: 0`.

Specs existentes não mudam (alterações aditivas).

## Arquivos

- `package.json` / lockfile — `react-native-gifted-charts` + `expo-linear-gradient`.
- `data/types.ts` — 2 campos.
- `data/format.ts` — `formatBRL` + `EMPTY_BUCKET.valor_protegido`.
- `data/specs/format.spec.ts` — testes.
- `ui/ProtectedRevenueCard.tsx` — **novo** (card de destaque).
- `ui/RevenueChart.tsx` — **novo** (linha/área de receita por dia).
- `ui/TrendChart.tsx` — reescrito com `BarChart` + tooltip.
- `NetworkDiagnosticsScreen.tsx` — render do card e do segundo gráfico na aba Resumo.
- `i18n/pt.json`, `i18n/pt_BR.json`, `i18n/en.json` — chaves novas.

## Decisões registradas

- **Lib de chart (`react-native-gifted-charts`)** em vez de SVG manual: o objetivo é
  ler o valor de cada dia no mobile; o tooltip por toque resolve isso melhor que
  rótulos espremidos. JS sobre `react-native-svg`, sem dep nativa nova de peso.
- **Dois gráficos separados** (casos × receita) em vez de um combinado com
  dual-axis: mais claro no mobile, cada gráfico com uma unidade só, sem colisão de
  escala nem de cor.
- **Subtítulo do card sem contagem**: o backend não envia a contagem de churn
  resolvidos, apenas o valor em R$. Texto-ajuda fixo em vez de número fabricado.
- **Receita em verde** (card e linha) consistente; como o gráfico de receita é
  isolado, não conflita com as barras verdes (Conexões observadas) do outro gráfico.

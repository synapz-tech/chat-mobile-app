# Receita Protegida na tela de Diagnóstico de Rede — Design

**Data:** 2026-06-29
**Tela:** `src/screens/settings/backoffice/network-diagnostics/`

## Objetivo

Exibir, na aba **Resumo** do Diagnóstico de Rede, a mensalidade recuperada (R$)
dos casos em risco de cancelamento (`churn_risk`) que foram **resolvidos** no
período selecionado. A apresentação tem duas partes:

1. **Card de destaque** no topo da aba Resumo, com o valor total em R$.
2. **Linha de tendência por dia** sobreposta ao gráfico de barras existente.

A métrica vem de campos novos que o backend (webhook n8n `casos-diagnostico-rede`,
action `stats`) já envia e que o app hoje ignora:

- `stats.receita_protegida` — R$ total no período (soma da mensalidade `plano_valor`
  dos casos `churn_risk` resolvidos).
- `by_day[].valor_protegido` — R$ por dia (mesma métrica, bucketizada por
  `created_at` no fuso `America/Sao_Paulo`). Garante `Σ by_day[].valor_protegido
  === stats.receita_protegida`.

## Escopo

Mudança **somente no app mobile** (consumo). Nenhuma alteração no backend/n8n — os
campos já existem na resposta de `stats`. A mudança é aditiva: nenhuma métrica ou
componente existente muda de comportamento.

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

## UI — Linha no gráfico (`ui/TrendChart.tsx`, estender)

- Sobrepor uma linha de `valor_protegido` por dia às barras empilhadas existentes,
  usando `react-native-svg` (`Polyline` + `Circle` nos pontos). A lib já é
  dependência (`^15.11.2`).
- **Escala própria**: a linha é normalizada pelo maior `valor_protegido` da janela
  — unidade distinta das barras (R$ vs. contagem de casos). A linha comunica a
  *forma/tendência* da receita protegida ao longo dos dias, **não** é comparável em
  altura às barras. Quando `maxValor === 0`, não desenhar linha.
- **Largura em pixels**: o container das barras hoje usa layout flex (colunas
  `flex: 1` com `gap: 8`, sem x/width conhecidos). Capturar a largura via `onLayout`
  e plotar cada ponto **centralizado sobre a coluna da barra** do dia:
  `colWidth = (width - gap * (n - 1)) / n`, `x_i = i * (colWidth + gap) + colWidth / 2`,
  `y = height - (v / maxValor) * height`. Para `n === 1`, centrar o único ponto
  (`x = width / 2`).
- **Cor dedicada**: o verde já é "Conexões observadas"; introduzir 1 token em
  `theme.ts` (ex.: `protectedLine`, esmeralda `#059669`) para a linha + marcadores,
  evitando confusão com as barras verdes.
- Adicionar item de legenda `LEGEND_PROTEGIDO` ("Receita protegida") ao lado dos já
  existentes (Offline / Instáveis / Conexões observadas), com a cor da linha.

## i18n (`i18n/pt.json`, `i18n/pt_BR.json`, `i18n/en.json`)

Novas chaves dentro de `NETWORK_DIAGNOSTICS`:

| Chave | pt / pt_BR | en |
|-------|------------|----|
| `PROTECTED_TITLE` | `RECEITA PROTEGIDA` | `PROTECTED REVENUE` |
| `PROTECTED_SUBTITLE` | `Mensalidade recuperada de casos em risco resolvidos no período.` | `Monthly revenue recovered from resolved at-risk cases in the period.` |
| `LEGEND_PROTEGIDO` | `Receita protegida` | `Protected revenue` |

## Tela (`NetworkDiagnosticsScreen.tsx`)

No branch da aba `resumo` (hoje renderiza `<StatCards>` + `<TrendChart>`), inserir
`<ProtectedRevenueCard stats={state.stats} loading={state.loadingStats} />` **antes**
do `<StatCards>`.

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

- `data/types.ts` — 2 campos.
- `data/format.ts` — `formatBRL` + `EMPTY_BUCKET.valor_protegido`.
- `data/specs/format.spec.ts` — testes.
- `ui/ProtectedRevenueCard.tsx` — **novo**.
- `ui/TrendChart.tsx` — linha + legenda.
- `ui/theme.ts` — 1 token de cor (`protectedLine`).
- `NetworkDiagnosticsScreen.tsx` — render do card na aba Resumo.
- `i18n/pt.json`, `i18n/pt_BR.json`, `i18n/en.json` — 3 chaves cada.

## Decisões registradas

- **Subtítulo sem contagem**: o backend não envia a contagem de churn resolvidos,
  apenas o valor em R$. Texto-ajuda fixo em vez de número fabricado.
- **Linha em cor própria (esmeralda)**: evita confusão com as barras verdes
  (Conexões observadas), mantendo o card de destaque em verde.
- **Escala independente para a linha**: R$ e contagem de casos são unidades
  diferentes; a linha mostra tendência, não magnitude comparável às barras.

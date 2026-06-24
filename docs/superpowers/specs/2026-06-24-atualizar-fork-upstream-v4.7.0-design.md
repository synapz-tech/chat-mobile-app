# Design: Atualizar fork Synapz para upstream Chatwoot v4.7.0

**Data:** 2026-06-24
**Branch:** `feat/firebase-integration-and-config`
**Autor:** Synapz / Claude Code

## Objetivo

Atualizar o fork `synapz-tech/chat-mobile-app` com a última versão lançada do
upstream `chatwoot/chatwoot-mobile-app` (**v4.7.0**), preservando todas as
customizações do Synapz.

## Contexto / Diagnóstico

| Item | Situação |
|------|----------|
| Fork (origin) | `synapz-tech/chat-mobile-app`, versão **4.1.2** |
| Upstream | `chatwoot/chatwoot-mobile-app` — release alvo: **v4.7.0** |
| Ponto de divergência (merge-base) | `c3dbe51` ("Audio recorder error handling #956") |
| Commits do upstream à frente | **42** (inclui MFA, fix OGG/iOS, traduções, picker novo) |
| Commits de customização Synapz | **18** |
| Arquivos alterados por ambos (zona de conflito) | **13** |

### Customizações do Synapz a preservar
- **Branding** em `app.config.ts`: nome "Synapz Chat", bundle `com.synapz.chat`,
  ícones, splash, notification image, plugins firebase, SDK versions, iOS static frameworks.
- **Firebase analytics + remote-config** (upstream já tem firebase `app` + `messaging`).
- **Feature de version check** (`VersionBlockModal`, `useVersionCheck`,
  `versionCheckService`) — 100% aditiva, upstream não tem.
- **Traduções pt_BR** + strings de permissão iOS em português.
- **URL Chatwoot custom** em `settingsSelectors.ts`.

### Achados técnicos relevantes
- **Áudio convergiu**: o Synapz voltou para `react-native-audio-recorder-player`,
  a mesma lib do upstream. Os arquivos `audioConverter.android.ts` / `.ios.ts`
  existem em ambos os lados — a mudança não commitada no `AudioRecorder.tsx`
  (import por plataforma) está alinhada com a estrutura do upstream.
- **Version-check é aditivo** — sem conflito, só precisa sobreviver ao merge.

## Decisões tomadas

1. **Estratégia:** `git merge v4.7.0` na branch atual (`feat/firebase-integration-and-config`).
   Resolve conflitos uma vez, preserva todo o histórico, gera merge commit.
   Mais seguro que rebase dado os assets binários e os detours de lib.
2. **Escopo:** Execução completa — resolver todos os conflitos e deixar compilando
   na branch atual; usuário revisa no final.
3. **Document picker:** Adotar `@react-native-documents/picker` (upstream).
   Adaptar `CommandOptionsMenu.tsx` para a nova API; remover
   `react-native-document-picker`.
4. **Versão:** Alinhar com o upstream → **4.7.0** (mantendo nome "Synapz Chat").

## Plano de execução

### Fase 0 — Rede de segurança e limpeza do working tree
- Criar branch de backup `backup/pre-v4.7.0-merge` no HEAD atual.
- Commitar as 2 mudanças pendentes (precisam fazer parte do histórico antes do merge):
  - `app.config.ts` (strings de permissão iOS em PT)
  - `AudioRecorder.tsx` (converter por plataforma, já alinhado ao upstream)

### Fase 1 — Merge
- `git merge v4.7.0`.

### Fase 2 — Resolução de conflitos (política por arquivo)

| Arquivo | Regra |
|---|---|
| `app.config.ts` | Synapz vence no branding; adota ajustes novos do upstream que não colidam |
| `package.json` / `pnpm-lock.yaml` | União de deps (upstream v4.7.0 + firebase analytics/remote-config); picker → `@react-native-documents/picker`; lock regenerado via `pnpm install` |
| `AudioRecorder.tsx`, `AudioBubble.tsx` | Upstream vence na lógica (fix OGG/iOS, MFA), preservando split por plataforma |
| `CommandOptionsMenu.tsx` | Adaptar para `@react-native-documents/picker` |
| `i18n/en.json`, `i18n/index.js` | União: traduções upstream + chaves Synapz (version-check) + registro de `pt_BR` |
| `LoginScreen.tsx`, `SettingsScreen.tsx`, `navigation/index.tsx` | Upstream na lógica nova; re-aplicar customizações Synapz (version-check, visual) |
| `settingsSelectors.ts` | Preservar URL Chatwoot custom do Synapz |
| `components-next/index.ts` | União (export VersionBlockModal + novos do upstream) |
| version-check/*, firebase analytics | Mantidos como estão (aditivos) |

### Fase 3 — Pós-merge
- `pnpm install` para regenerar lockfile e baixar deps do v4.7.0.
- Bump de versão `4.1.2` → `4.7.0` em `app.config.ts` e `package.json`.
- Validar feature nova de MFA e integração firebase.

### Fase 4 — Verificação
- Typecheck (`pnpm tsc` / equivalente) + lint do projeto.
- Checklist de não-regressão das customizações Synapz:
  - [ ] Branding (nome, bundle, ícones, splash, notificação)
  - [ ] Version-check funcional
  - [ ] pt_BR registrado e carregando
  - [ ] Firebase analytics + remote-config presentes
  - [ ] URL Chatwoot custom intacta
  - [ ] Strings de permissão iOS em PT

## Critérios de sucesso
- Branch atual contém os 42 commits do upstream v4.7.0 + customizações Synapz intactas.
- Projeto compila (typecheck) e passa no lint.
- Nenhuma customização do Synapz perdida (checklist acima).
- Versão = 4.7.0.

## Riscos
- **Document picker:** migrar para a API nova pode reintroduzir o problema que
  motivou a reversão original. Mitigação: validar fluxo de anexos.
- **MFA (upstream novo):** pode interagir com o fluxo de login customizado do Synapz.
- **pnpm-lock:** regenerar pode trazer atualizações transitivas; revisar diff do lock.

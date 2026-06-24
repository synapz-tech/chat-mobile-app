# Atualização do fork Synapz para upstream Chatwoot v4.7.0 — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trazer os 42 commits do upstream `chatwoot/chatwoot-mobile-app` (release v4.7.0) para a branch `feat/firebase-integration-and-config` via merge, preservando todas as customizações do Synapz, deixando o projeto com typecheck e lint passando.

**Architecture:** Merge único da tag `v4.7.0` sobre a branch atual. Resolução de conflitos guiada por política arquivo-por-arquivo (branding/version-check/i18n do Synapz preservados; lógica nova do upstream — MFA, fix OGG/iOS, picker novo — adotada). Pós-merge: regenerar lockfile com pnpm, alinhar versão para 4.7.0, verificar.

**Tech Stack:** React Native + Expo, TypeScript (strict), pnpm, ESLint, Jest, Firebase (app/messaging/analytics/remote-config).

## Global Constraints

- Package manager: **pnpm** (lockfile `pnpm-lock.yaml`). Não usar npm/yarn para instalar.
- Branch de trabalho: **`feat/firebase-integration-and-config`**. Não criar branch nova para o resultado.
- Nome do app permanece **"Synapz Chat"**; bundle iOS/Android permanece **`com.synapz.chat`**.
- Versão final do app = **`4.7.0`** (em `app.config.ts` e `package.json`).
- Document picker final = **`@react-native-documents/picker`** (do upstream). Remover `react-native-document-picker`.
- Firebase: manter `app` + `messaging` (upstream) **e** `analytics` + `remote-config` (Synapz).
- Customizações que NÃO podem se perder: branding, feature version-check, traduções pt_BR, strings de permissão iOS em PT, URL Chatwoot custom em `settingsSelectors.ts`.
- Typecheck: `npx tsc --noEmit`. Lint: `pnpm lint`. Testes: `pnpm test`.
- Tag/branch de comparação do upstream: **`v4.7.0`** (já buscada via remote `upstream-https`).

---

### Task 0: Rede de segurança e commit das mudanças pendentes

**Files:**
- Modify (commit): `app.config.ts` (strings de permissão iOS em PT — já no working tree)
- Modify (commit): `src/screens/chat-screen/components/audio-recorder/AudioRecorder.tsx` (import do converter por plataforma — já no working tree)

**Interfaces:**
- Produces: working tree limpo + branch `backup/pre-v4.7.0-merge` apontando para o estado pré-merge.

- [ ] **Step 1: Confirmar branch e estado**

Run:
```bash
git rev-parse --abbrev-ref HEAD && git status --short
```
Expected: branch `feat/firebase-integration-and-config`; exatamente 2 arquivos modificados (`app.config.ts`, `AudioRecorder.tsx`).

- [ ] **Step 2: Criar branch de backup**

Run:
```bash
git branch backup/pre-v4.7.0-merge
git branch --list 'backup/*'
```
Expected: `backup/pre-v4.7.0-merge` listado.

- [ ] **Step 3: Commitar a mudança de permissões iOS em PT**

Run:
```bash
git add app.config.ts
git commit -m "feat: Localize iOS permission descriptions to pt-BR"
```
Expected: commit criado, sem o `AudioRecorder.tsx` (que vai em commit separado).

- [ ] **Step 4: Commitar o converter de áudio por plataforma**

Run:
```bash
git add src/screens/chat-screen/components/audio-recorder/AudioRecorder.tsx
git commit -m "refactor: Use platform-specific audio converter (android/ios)"
```
Expected: working tree limpo.

- [ ] **Step 5: Verificar working tree limpo**

Run:
```bash
git status --short
```
Expected: saída vazia.

---

### Task 1: Iniciar o merge e capturar o mapa de conflitos

**Files:**
- N/A (operação git)

**Interfaces:**
- Produces: merge em andamento com conflitos marcados; arquivo `/tmp/merge-conflicts.txt` com a lista de arquivos em conflito.

- [ ] **Step 1: Garantir que a tag v4.7.0 está disponível**

Run:
```bash
git rev-parse v4.7.0^{commit}
```
Expected: um hash de commit (a tag existe localmente). Se falhar: `git fetch upstream-https --tags`.

- [ ] **Step 2: Iniciar o merge sem commitar**

Run:
```bash
git merge --no-commit --no-ff v4.7.0
```
Expected: git para com "Automatic merge failed; fix conflicts and then commit the result." (conflitos esperados).

- [ ] **Step 3: Capturar e revisar a lista de conflitos**

Run:
```bash
git diff --name-only --diff-filter=U | tee /tmp/merge-conflicts.txt
```
Expected: lista contendo (aproximadamente) `app.config.ts`, `package.json`, `pnpm-lock.yaml`, `src/components-next/index.ts`, `src/i18n/en.json`, `src/i18n/index.js`, `src/navigation/index.tsx`, `src/screens/auth/LoginScreen.tsx`, `src/screens/chat-screen/components/audio-recorder/AudioRecorder.tsx`, `src/screens/chat-screen/components/message-components/AudioBubble.tsx`, `src/screens/chat-screen/components/message-components/CommandOptionsMenu.tsx`, `src/screens/settings/SettingsScreen.tsx`, `src/store/settings/settingsSelectors.ts`.

> Nota: a lista exata pode variar levemente. Trate cada arquivo em conflito pela política da Task correspondente. Arquivos não listados aqui que aparecerem em conflito devem seguir a regra geral: **lógica de runtime → upstream; branding/identidade/version-check/pt_BR/URL custom → Synapz**.

---

### Task 2: Resolver `app.config.ts` (branding Synapz + ajustes upstream)

**Files:**
- Modify: `app.config.ts`

**Interfaces:**
- Consumes: estado de conflito da Task 1.
- Produces: `app.config.ts` sem marcadores de conflito, com branding Synapz intacto.

- [ ] **Step 1: Ver o conflito**

Run:
```bash
git diff app.config.ts
```
Inspecionar os blocos `<<<<<<<`/`=======`/`>>>>>>>`.

- [ ] **Step 2: Resolver aplicando a política**

Editar `app.config.ts` mantendo, do lado Synapz (HEAD):
- `name: 'Synapz Chat'`
- `bundleIdentifier: 'com.synapz.chat'` e `package` Android equivalente
- referências de ícones/splash/notification Synapz
- plugins/config de firebase (analytics, remote-config, messaging)
- strings de permissão iOS em PT
- `minSdkVersion: 24`, `compileSdkVersion: 35`, `targetSdkVersion: 34`, iOS static frameworks

E incorporando, do lado upstream (v4.7.0):
- quaisquer novos plugins, chaves de config ou entradas de `infoPlist`/`android` que o upstream adicionou e que **não** sejam branding (ex.: config de MFA, novas permissões funcionais).

Manter `version` como está por enquanto (será setada para `4.7.0` na Task 10).

- [ ] **Step 3: Verificar ausência de marcadores e sanidade**

Run:
```bash
grep -nE '^(<<<<<<<|=======|>>>>>>>)' app.config.ts || echo "SEM MARCADORES"
grep -nE "name:|bundleIdentifier:|com.synapz.chat|Synapz Chat" app.config.ts | head
```
Expected: "SEM MARCADORES"; branding Synapz presente.

- [ ] **Step 4: Stage**

Run:
```bash
git add app.config.ts
```

---

### Task 3: Resolver `package.json` + regenerar `pnpm-lock.yaml`

**Files:**
- Modify: `package.json`
- Regenerate: `pnpm-lock.yaml`

**Interfaces:**
- Consumes: estado de conflito da Task 1.
- Produces: `package.json` com união de dependências e picker do upstream; lockfile coerente.

- [ ] **Step 1: Ver o conflito**

Run:
```bash
git diff package.json
```

- [ ] **Step 2: Resolver `package.json` (união de dependências)**

Editar `package.json` mantendo:
- Todas as deps/versões novas do upstream v4.7.0 (ex.: `react-native-audio-recorder-player@^3.6.11`, `@react-native-documents/picker@^12.0.1`, `@react-native-firebase/app`, `@react-native-firebase/messaging`, libs novas de MFA, etc.).
- As deps exclusivas do Synapz: `@react-native-firebase/analytics`, `@react-native-firebase/remote-config`.

Remover:
- `react-native-document-picker` (substituído por `@react-native-documents/picker`).

Manter `"name": "@synapz/mobile-app"`. Não alterar `version` ainda (Task 10).

- [ ] **Step 3: Verificar ausência de marcadores**

Run:
```bash
grep -nE '^(<<<<<<<|=======|>>>>>>>)' package.json || echo "SEM MARCADORES"
grep -nE 'documents/picker|document-picker|firebase/analytics|firebase/remote-config' package.json
```
Expected: "SEM MARCADORES"; presente `@react-native-documents/picker`, `firebase/analytics`, `firebase/remote-config`; ausente `react-native-document-picker`.

- [ ] **Step 4: Stage do package.json**

Run:
```bash
git add package.json
```

- [ ] **Step 5: Regenerar o lockfile**

Run:
```bash
pnpm install
```
Expected: instalação conclui sem erro de resolução; `pnpm-lock.yaml` atualizado. Se houver erro de peer dependency bloqueante, anotar e resolver ajustando versões no `package.json` conforme a mensagem.

- [ ] **Step 6: Stage do lockfile resolvido**

Run:
```bash
git add pnpm-lock.yaml
grep -nE '^(<<<<<<<|=======|>>>>>>>)' pnpm-lock.yaml || echo "LOCKFILE LIMPO"
```
Expected: "LOCKFILE LIMPO".

---

### Task 4: Resolver arquivos de áudio (`AudioRecorder.tsx`, `AudioBubble.tsx`)

**Files:**
- Modify: `src/screens/chat-screen/components/audio-recorder/AudioRecorder.tsx`
- Modify: `src/screens/chat-screen/components/message-components/AudioBubble.tsx`

**Interfaces:**
- Consumes: estado de conflito da Task 1.
- Produces: arquivos de áudio com lógica do upstream (fix OGG/iOS) + import do converter por plataforma (`@/utils/audioConverter.android` / `.ios`).

- [ ] **Step 1: Ver os conflitos**

Run:
```bash
git diff src/screens/chat-screen/components/audio-recorder/AudioRecorder.tsx \
        src/screens/chat-screen/components/message-components/AudioBubble.tsx
```

- [ ] **Step 2: Resolver pela política (lógica upstream + import por plataforma)**

Para ambos os arquivos:
- Adotar a **lógica do upstream** (ambos já usam `react-native-audio-recorder-player`; o upstream traz fix de race condition de OGG e ajustes de MFA).
- Garantir que `AudioRecorder.tsx` **importa o converter por plataforma**:
  ```ts
  import { convertAacToWav as convertAacToWavAndroid } from '@/utils/audioConverter.android';
  import { convertAacToWav as convertAacToWavIos } from '@/utils/audioConverter.ios';
  ```
  e seleciona via `Platform.OS === 'ios'` no ponto de conversão (comportamento já commitado na Task 0).
- Se o upstream importar de `@/utils/audioConverter` (sem sufixo), substituir pelos imports por plataforma acima.

- [ ] **Step 3: Verificar marcadores e imports**

Run:
```bash
grep -nE '^(<<<<<<<|=======|>>>>>>>)' \
  src/screens/chat-screen/components/audio-recorder/AudioRecorder.tsx \
  src/screens/chat-screen/components/message-components/AudioBubble.tsx || echo "SEM MARCADORES"
grep -nE 'audioConverter\.(android|ios)' src/screens/chat-screen/components/audio-recorder/AudioRecorder.tsx
```
Expected: "SEM MARCADORES"; imports `.android` e `.ios` presentes.

- [ ] **Step 4: Stage**

Run:
```bash
git add src/screens/chat-screen/components/audio-recorder/AudioRecorder.tsx \
        src/screens/chat-screen/components/message-components/AudioBubble.tsx
```

---

### Task 5: Resolver `CommandOptionsMenu.tsx` (migrar para `@react-native-documents/picker`)

**Files:**
- Modify: `src/screens/chat-screen/components/message-components/CommandOptionsMenu.tsx`

**Interfaces:**
- Consumes: estado de conflito da Task 1; API de `@react-native-documents/picker`.
- Produces: `CommandOptionsMenu.tsx` usando exclusivamente `@react-native-documents/picker`.

- [ ] **Step 1: Ver o conflito e a versão do upstream como referência**

Run:
```bash
git diff src/screens/chat-screen/components/message-components/CommandOptionsMenu.tsx
git show v4.7.0:src/screens/chat-screen/components/message-components/CommandOptionsMenu.tsx | sed -n '1,40p'
```

- [ ] **Step 2: Resolver adotando a versão/imports do upstream**

Adotar o lado do upstream para o picker. A referência do upstream importa assim:
```ts
import {
  pick,
  types as documentPickerTypes,
  errorCodes as documentPickerErrorCodes,
  isErrorWithCode,
  type DocumentPickerResponse,
} from '@react-native-documents/picker';
```
Substituir qualquer uso remanescente de `react-native-document-picker` (ex.: `DocumentPicker.pick`, `DocumentPicker.types`, `isCancel`) pela API nova (`pick(...)`, `documentPickerTypes`, `documentPickerErrorCodes`/`isErrorWithCode`). Preservar qualquer lógica de UI específica do Synapz que não seja relacionada ao picker, se houver no lado HEAD.

- [ ] **Step 3: Verificar marcadores e ausência da lib antiga**

Run:
```bash
grep -nE '^(<<<<<<<|=======|>>>>>>>)' src/screens/chat-screen/components/message-components/CommandOptionsMenu.tsx || echo "SEM MARCADORES"
grep -n 'react-native-document-picker' src/screens/chat-screen/components/message-components/CommandOptionsMenu.tsx && echo "AINDA TEM LIB ANTIGA — corrigir" || echo "LIB ANTIGA REMOVIDA"
```
Expected: "SEM MARCADORES"; "LIB ANTIGA REMOVIDA".

- [ ] **Step 4: Stage**

Run:
```bash
git add src/screens/chat-screen/components/message-components/CommandOptionsMenu.tsx
```

---

### Task 6: Resolver i18n (`en.json`, `index.js`) e garantir `pt_BR`

**Files:**
- Modify: `src/i18n/en.json`
- Modify: `src/i18n/index.js`

**Interfaces:**
- Consumes: estado de conflito da Task 1.
- Produces: `en.json` com união de chaves (upstream + version-check do Synapz); `index.js` registrando `pt_BR`.

- [ ] **Step 1: Ver os conflitos**

Run:
```bash
git diff src/i18n/en.json src/i18n/index.js
```

- [ ] **Step 2: Resolver `en.json` por união**

Manter **todas** as chaves novas do upstream (MFA, traduções novas) **e** as chaves adicionadas pelo Synapz (relacionadas a version-check — ex.: `VERSION_BLOCK`/similares presentes no lado HEAD). JSON válido, sem duplicar chaves.

- [ ] **Step 3: Resolver `index.js` mantendo registro de `pt_BR`**

Garantir que o `pt_BR` continue importado e registrado no objeto de locales, junto com os locales novos que o upstream adicionou (ex.: `zh_CN`, `zh_TW`).

- [ ] **Step 4: Verificar marcadores e JSON válido**

Run:
```bash
grep -nE '^(<<<<<<<|=======|>>>>>>>)' src/i18n/en.json src/i18n/index.js || echo "SEM MARCADORES"
node -e "JSON.parse(require('fs').readFileSync('src/i18n/en.json','utf8')); console.log('en.json VALIDO')"
grep -n 'pt_BR' src/i18n/index.js
```
Expected: "SEM MARCADORES"; "en.json VALIDO"; `pt_BR` presente em `index.js`.

- [ ] **Step 5: Stage**

Run:
```bash
git add src/i18n/en.json src/i18n/index.js
```

---

### Task 7: Resolver telas e navegação (`LoginScreen.tsx`, `SettingsScreen.tsx`, `navigation/index.tsx`)

**Files:**
- Modify: `src/screens/auth/LoginScreen.tsx`
- Modify: `src/screens/settings/SettingsScreen.tsx`
- Modify: `src/navigation/index.tsx`

**Interfaces:**
- Consumes: estado de conflito da Task 1; componente `VersionBlockModal` e hook `useVersionCheck` (aditivos, já no HEAD).
- Produces: telas com a lógica nova do upstream (incl. MFA no fluxo de login) + customizações Synapz (version-check, ajustes visuais) preservadas.

- [ ] **Step 1: Ver os conflitos**

Run:
```bash
git diff src/screens/auth/LoginScreen.tsx src/screens/settings/SettingsScreen.tsx src/navigation/index.tsx
```

- [ ] **Step 2: Resolver `LoginScreen.tsx`**

Adotar o fluxo de login novo do upstream (KeyboardAwareScrollView, MFA). Re-aplicar customizações visuais do Synapz que aparecerem no lado HEAD (ex.: logo, textos). Onde upstream e Synapz tocaram a mesma região visual, preferir a estrutura do upstream e reinserir o ajuste visual Synapz por cima.

- [ ] **Step 3: Resolver `SettingsScreen.tsx`**

Adotar a lógica nova do upstream e preservar a integração de version-check do Synapz (ex.: render de `VersionBlockModal` / uso de `useVersionCheck`) e a reorganização de imports do Synapz, se presentes no HEAD.

- [ ] **Step 4: Resolver `navigation/index.tsx`**

Adotar rotas/telas novas do upstream (ex.: telas de MFA, modal presentation no Android) e manter quaisquer entradas de navegação adicionadas pelo Synapz (version-check).

- [ ] **Step 5: Verificar marcadores**

Run:
```bash
grep -nE '^(<<<<<<<|=======|>>>>>>>)' src/screens/auth/LoginScreen.tsx src/screens/settings/SettingsScreen.tsx src/navigation/index.tsx || echo "SEM MARCADORES"
```
Expected: "SEM MARCADORES".

- [ ] **Step 6: Stage**

Run:
```bash
git add src/screens/auth/LoginScreen.tsx src/screens/settings/SettingsScreen.tsx src/navigation/index.tsx
```

---

### Task 8: Resolver `settingsSelectors.ts` e `components-next/index.ts`

**Files:**
- Modify: `src/store/settings/settingsSelectors.ts`
- Modify: `src/components-next/index.ts`

**Interfaces:**
- Consumes: estado de conflito da Task 1.
- Produces: selector com URL Chatwoot custom do Synapz preservada; barrel export incluindo `VersionBlockModal`.

- [ ] **Step 1: Ver os conflitos**

Run:
```bash
git diff src/store/settings/settingsSelectors.ts src/components-next/index.ts
```

- [ ] **Step 2: Resolver `settingsSelectors.ts`**

Preservar a **URL Chatwoot custom do Synapz** no `selectIsChatwootCloud` (lado HEAD) e incorporar qualquer lógica nova de selector do upstream que não conflite com a URL.

- [ ] **Step 3: Resolver `components-next/index.ts`**

União de exports: manter o export do version-check (`VersionBlockModal`/`version-check`) do Synapz **e** os novos exports do upstream.

- [ ] **Step 4: Verificar marcadores**

Run:
```bash
grep -nE '^(<<<<<<<|=======|>>>>>>>)' src/store/settings/settingsSelectors.ts src/components-next/index.ts || echo "SEM MARCADORES"
grep -n 'version-check\|VersionBlockModal' src/components-next/index.ts
```
Expected: "SEM MARCADORES"; export de version-check presente.

- [ ] **Step 5: Stage**

Run:
```bash
git add src/store/settings/settingsSelectors.ts src/components-next/index.ts
```

---

### Task 9: Tratar conflitos residuais e finalizar o merge commit

**Files:**
- N/A (operação git)

**Interfaces:**
- Consumes: resoluções das Tasks 2–8.
- Produces: merge commit criado; nenhum conflito pendente.

- [ ] **Step 1: Verificar se restam conflitos**

Run:
```bash
git diff --name-only --diff-filter=U
```
Expected: saída vazia. Se houver arquivos restantes, resolvê-los pela regra geral (runtime → upstream; identidade/version-check/pt_BR/URL custom → Synapz), depois `git add <arquivo>`.

- [ ] **Step 2: Varredura global por marcadores de conflito**

Run:
```bash
git grep -nE '^(<<<<<<<|=======|>>>>>>>)' -- ':!pnpm-lock.yaml' || echo "NENHUM MARCADOR NO REPO"
```
Expected: "NENHUM MARCADOR NO REPO".

- [ ] **Step 3: Criar o merge commit**

Run:
```bash
git commit -m "merge: Update fork with upstream Chatwoot v4.7.0

Preserva customizações Synapz (branding, version-check, pt_BR, firebase
analytics/remote-config, URL Chatwoot custom) e adota mudanças do upstream
(MFA, fix OGG/iOS, @react-native-documents/picker, traduções)."
```
Expected: merge commit criado.

- [ ] **Step 4: Confirmar histórico**

Run:
```bash
git log --oneline -1 && git log --oneline --merges -1
```
Expected: HEAD é o merge commit; pai inclui v4.7.0.

---

### Task 10: Alinhar versão para 4.7.0

**Files:**
- Modify: `app.config.ts` (campo `version`)
- Modify: `package.json` (campo `version`)

**Interfaces:**
- Consumes: merge concluído (Task 9).
- Produces: versão do app = `4.7.0` em ambos os arquivos.

- [ ] **Step 1: Ver valores atuais**

Run:
```bash
grep -nE "\"version\"" package.json
grep -nE "version:" app.config.ts | head -3
```

- [ ] **Step 2: Atualizar `package.json`**

Setar o campo `"version"` para `"4.7.0"`.

- [ ] **Step 3: Atualizar `app.config.ts`**

Setar `version: '4.7.0'` no objeto de config (sem alterar `name`/`bundleIdentifier`).

- [ ] **Step 4: Verificar**

Run:
```bash
grep -nE "\"version\": \"4.7.0\"" package.json && grep -nE "version: '4.7.0'" app.config.ts
```
Expected: ambos retornam match.

- [ ] **Step 5: Commit**

Run:
```bash
git add app.config.ts package.json
git commit -m "chore: Bump app version to 4.7.0 (align with upstream)"
```

---

### Task 11: Verificação — typecheck, lint e checklist de não-regressão

**Files:**
- N/A (verificação)

**Interfaces:**
- Consumes: todo o trabalho anterior.
- Produces: confirmação de que o projeto compila, lint passa e nenhuma customização Synapz se perdeu.

- [ ] **Step 1: Typecheck**

Run:
```bash
npx tsc --noEmit
```
Expected: sem erros. Se houver erros, corrigir (tipicamente imports do picker novo, tipos de MFA, ou imports do converter de áudio) e re-rodar até limpar. Commitar correções com `fix: Resolve type errors after v4.7.0 merge`.

- [ ] **Step 2: Lint**

Run:
```bash
pnpm lint
```
Expected: sem erros (warnings toleráveis). Corrigir erros e commitar como `chore: Fix lint after v4.7.0 merge` se necessário.

- [ ] **Step 3: Testes (se existirem e rodarem rápido)**

Run:
```bash
pnpm test -- --watchAll=false 2>&1 | tail -30
```
Expected: suíte passa ou mantém o mesmo status pré-merge. Anotar falhas pré-existentes vs. novas.

- [ ] **Step 4: Checklist de não-regressão das customizações Synapz**

Run:
```bash
echo "== Branding ==";        grep -nE "Synapz Chat|com.synapz.chat" app.config.ts | head
echo "== Firebase Synapz =="; grep -nE "firebase/analytics|firebase/remote-config" package.json
echo "== Picker upstream =="; grep -nE "documents/picker" package.json; grep -n "react-native-document-picker" package.json && echo "ERRO: lib antiga ainda presente" || echo "OK lib antiga ausente"
echo "== pt_BR ==";           ls src/i18n/pt_BR.json && grep -n "pt_BR" src/i18n/index.js
echo "== Version-check ==";   ls src/services/versionCheckService.ts src/hooks/useVersionCheck.ts src/components-next/version-check/VersionBlockModal.tsx
echo "== URL custom ==";      git grep -n "synapz" -- src/store/settings/settingsSelectors.ts || echo "(verificar manualmente a URL custom)"
echo "== Versao ==";          grep -E "\"version\"" package.json
```
Expected: todos os itens presentes; lib antiga ausente; versão `4.7.0`.

- [ ] **Step 5: Status final**

Run:
```bash
git status --short && git log --oneline -8
```
Expected: working tree limpo; histórico mostra commits da Task 0, merge commit, bump de versão e eventuais fixes.

---

## Self-Review (preenchido pelo autor do plano)

- **Cobertura do spec:** Fase 0 → Task 0; Fase 1 → Task 1; Fase 2 (política por arquivo) → Tasks 2–9; Fase 3 (install + bump) → Tasks 3/10; Fase 4 (verificação) → Task 11. Todas as customizações do checklist do spec têm verificação na Task 11.
- **Placeholders:** nenhum "TBD/TODO"; cada Task tem comandos e critérios concretos. A imprevisibilidade dos hunks de conflito é tratada via política explícita + comandos de verificação (não é placeholder).
- **Consistência:** comandos de verificação (`grep` de marcadores, `npx tsc --noEmit`, `pnpm lint`) usados de forma uniforme; nomes (`@react-native-documents/picker`, `VersionBlockModal`, `pt_BR`, `4.7.0`) consistentes com os Global Constraints.

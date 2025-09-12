# Configuração do Firebase Remote Config para Verificação de Versão

## Visão Geral

Este projeto implementa uma funcionalidade de verificação de versão mínima usando Firebase Remote Config. Quando o usuário tenta fazer login, o app verifica se a versão atual atende aos requisitos mínimos definidos no Remote Config.

## Funcionalidades Implementadas

### 1. Serviço de Verificação de Versão (`VersionCheckService`)

- **Localização**: `src/services/versionCheckService.ts`
- **Funcionalidades**:
  - Inicializa o Firebase Remote Config
  - Busca a versão mínima definida no Remote Config
  - Compara a versão atual do app com a versão mínima
  - Exibe alertas quando necessário

### 2. Hook de Verificação (`useVersionCheck`)

- **Localização**: `src/hooks/useVersionCheck.ts`
- **Funcionalidades**:
  - React Hook para gerenciar o estado da verificação de versão
  - Retorna loading, resultado da verificação e possíveis erros
  - Executa automaticamente ao ser montado

### 3. Modal de Bloqueio (`VersionBlockModal`)

- **Localização**: `src/components-next/version-check/VersionBlockModal.tsx`
- **Funcionalidades**:
  - Modal não-dispensável que aparece quando a versão é inadequada
  - Exibe informações sobre versão atual vs versão mínima
  - Impede que o usuário continue usando o app

### 4. Integração na Tela de Login

- **Localização**: `src/screens/auth/LoginScreen.tsx`
- **Modificações**:
  - Utiliza o hook `useVersionCheck`
  - Bloqueia tentativas de login quando versão é inadequada
  - Desabilita o botão de login quando necessário
  - Exibe o modal de bloqueio quando aplicável

## Configuração no Firebase Console

### 1. Acesse o Firebase Console

1. Vá para [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. No menu lateral, clique em "Remote Config"

### 2. Configure o Parâmetro de Versão Mínima

1. Clique em "Criar configuração" (se for a primeira vez) ou "Adicionar parâmetro"
2. **Nome do parâmetro**: `min_app_version`
3. **Valor padrão**: `0.0.0` (ou a versão mínima desejada)
4. **Descrição**: "Versão mínima do aplicativo necessária para fazer login"

### 3. Configurações Avançadas (Opcional)

Você pode criar condições específicas para diferentes plataformas:

#### Para Android:

- **Condição**: `app.id == 'com.synapz.chat' && app.platform == 'android'`
- **Valor**: ex: `4.1.0`

#### Para iOS:

- **Condição**: `app.id == 'com.synpaz.chat' && app.platform == 'ios'`
- **Valor**: ex: `4.1.0`

### 4. Publique as Alterações

1. Clique em "Publicar alterações"
2. Adicione uma descrição das mudanças
3. Confirme a publicação

## Como Funciona

### Fluxo de Verificação:

1. **Inicialização**: Quando o usuário acessa a tela de login, o `useVersionCheck` é executado
2. **Configuração**: O serviço inicializa o Remote Config com valores padrão
3. **Busca**: Busca e ativa as configurações mais recentes do Firebase
4. **Comparação**: Compara a versão atual (via `expo-application`) com a versão mínima
5. **Bloqueio**: Se a versão for inadequada:
   - Exibe o `VersionBlockModal`
   - Desabilita o botão de login
   - Bloqueia tentativas de login no `onSubmit`

### Comparação de Versões:

O serviço utiliza uma função que compara versões no formato semântico:

- `4.1.2` vs `4.1.0` → ✅ Permitido
- `4.0.9` vs `4.1.0` → ❌ Bloqueado
- `3.9.9` vs `4.1.0` → ❌ Bloqueado

## Traduções

As seguintes chaves de tradução foram adicionadas:

### English (`src/i18n/en.json`):

```json
"VERSION_CHECK": {
  "TITLE": "Update Required",
  "MESSAGE": "Please update to version {{version}} or higher to continue using the app.",
  "OK": "OK"
}
```

### Portuguese (`src/i18n/pt_BR.json`):

```json
"VERSION_CHECK": {
  "TITLE": "Atualização Necessária",
  "MESSAGE": "Por favor, atualize para a versão {{version}} ou superior para continuar usando o aplicativo.",
  "OK": "OK"
}
```

## Dependências Adicionadas

### Firebase Remote Config:

```json
"@react-native-firebase/remote-config": "^21.7.1"
```

### Plugin no app.config.ts:

```typescript
'@react-native-firebase/remote-config';
```

## Exemplo de Uso

### Para Bloquear Versões Antigas:

1. Acesse o Firebase Console
2. Defina `min_app_version` como `4.2.0`
3. Publique as alterações
4. Usuários com versões 4.1.x ou menores serão bloqueados

### Para Permitir Todas as Versões:

1. Defina `min_app_version` como `0.0.0`
2. Todos os usuários poderão fazer login

## Monitoramento

- Erros de inicialização são logados no console
- Em caso de falha na verificação, o app permite o login por segurança
- O Remote Config tem cache de 5 minutos para evitar requests excessivos

## Considerações de Segurança

- O bloqueio ocorre apenas no frontend - considere validação adicional no backend
- Em caso de erro na configuração do Firebase, o app permite login por padrão
- As configurações são cacheadas localmente e atualizadas conforme disponibilidade da rede

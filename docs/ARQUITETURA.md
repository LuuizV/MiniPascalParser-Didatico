# Arquitetura

[← Página principal](../README.md)

## Componentes

| Arquivo | Responsabilidade |
|---|---|
| `src/core.cjs` | Lexer, FIRST/FOLLOW, LR(0), tabela SLR(1), Parser e erros. |
| `src/grammar.json` | Produções numeradas da gramática Mini_Pascal. |
| `src/main.cjs` | Janela Electron, IPC e acesso controlado a arquivos locais. |
| `src/preload.cjs` | Interface mínima entre renderer e processo principal. |
| `src/renderer.js` | Editor, simulação, pilha, árvores e navegação. |
| `src/index.html`, `src/style.css` | Interface responsiva. |
| `src/update-manager.cjs` | Máquina de estados de verificação, download e instalação. |
| `tests/` | Programas, regressão léxica/sintática e testes do updater. |

## Análise

Código → Lexer → tokens → Parser SLR(1) → histórico de ações → simulador, árvore e diagnósticos.

A gramática implementada possui **71 produções** e **130 estados LR(0)**. Os seis arquivos-base preservam **611 passos SLR(1)** comparados com a versão Java, conforme a suíte de testes.

## Segurança

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` e `webSecurity: true`.
- A interface usa arquivos locais com política CSP; operações nativas são expostas por IPC limitado.
- O updater conhece apenas a Release oficial `LuuizV/MiniPascalParser-Didatico`, sem tokens pessoais no executável.
- Não há instalação silenciosa: o usuário decide o download e o reinício.
- Os hashes e metadados ajudam a verificar integridade, mas **não substituem assinatura digital**.

## Manutenção

Toda mudança no núcleo deve passar por `npm run check` e `npm test`. Alterações da gramática exigem registrar divergências da especificação Sigma, atualizar o histórico e revisar os testes.

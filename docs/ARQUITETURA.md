# Arquitetura do MiniPascal

A interface é um cliente Electron isolado da lógica de análise. A comunicação segue o modelo IPC controlado do Electron.

## Componentes

| Componente | Responsabilidade |
| --- | --- |
| `java/src/minipascal/Parser.java` | Executa SHIFT/REDUCE/ACCEPT, recuperação de erros e histórico da análise. |
| `java/src/minipascal/Grammar.java` | Produções da gramática Mini_Pascal. |
| `java/src/minipascal/Lexer.java` | Tokenização e diagnósticos léxicos. |
| `java/src/minipascal/SLRTable.java` | Construção LR(0), FIRST/FOLLOW e tabelas SLR(1). |
| `java/src/minipascal/Bridge.java` | Protocolo JSON entre Java e Electron. |
| `src/java-runner.cjs` | Gerencia o processo Java com timeout e limite de saída. |
| `src/main.cjs` | Janela, arquivos, preferências, confirmação de fechamento, IPC e comunicação com processo Java. |
| `src/preload.cjs` | Expõe uma API mínima ao renderer isolado. |
| `src/ui-utils.js` | Offsets CRLF/LF/CR, explicações de ações, escape de HTML. |
| `src/tree-graph.js` | Constrói árvore de derivação a partir do histórico real e calcula layout SVG. |
| `src/renderer.js` | Orquestra editor, navegação, simulação, visualizações e atualizações. |
| `src/index.html`, `src/style.css` | Semântica visual e layout responsivo com tipografia de tamanho consistente. |
| `src/update-manager.cjs` | Controle das verificações, download e instalação autorizada. |
| `tests/` | Exemplos, regressões do Lexer/SLR(1), testes do updater, helpers e processo Java. |

## Fluxo de dados

```text
Código-fonte
  └─ IPC analyze → processo Java
                   └─ Lexer → Tokens → Parser SLR(1)
                                     └─ Histórico estruturado por etapa
                                        ├─ Linha do tempo + linha atual
                                        ├─ Cartão de operação
                                        ├─ Pilha do Simulador integrado
                                        └─ Árvore SVG em tela independente

Resultados completos (estáticos para a execução)
  ├─ Tokens
  ├─ Produções da Gramática (demais tabelas só no núcleo)
  └─ Erros
```

Os registros da pilha armazenam o estado anterior à ação; a árvore reconstrói as ações aplicadas até a etapa. A visualização não altera os algoritmos de reconhecimento.

## Segurança e confiabilidade

- `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, `webSecurity: true` e política CSP sem conexões externas no renderer.
- IPC nativo com validação de argumento; caminho de arquivo só é reutilizado após abertura ou escolha em diálogo nativo.
- Fechamento com alterações não salvas exige escolher **Salvar**, **Não salvar** ou **Cancelar**.
- Análise em processo Java, com timeout e substituição de análise antiga em caso de nova solicitação.
- Preferências em arquivo local do diretório `userData` (somente velocidade de reprodução). Escala e fonte antigas são ignoradas, evitando desconfiguração do layout.
- A atualização automática usa somente as Releases oficiais e depende de confirmação; Portable é manual.
- Árvore SVG renderizada no aplicativo com rótulos escapados, sem exportação de imagem.

## Compatibilidade e regressão

Enquanto a gramática não mudar, preservar **71 produções, 130 estados LR(0), 611 passos SLR(1)** no conjunto de referência. O projeto inclui testes automatizados com `npm test` e verificação sintática com `npm run check`. Essas verificações não substituem um teste real de instalação/atualização Windows.

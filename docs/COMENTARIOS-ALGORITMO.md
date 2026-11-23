# Guia técnico dos comentários do núcleo MiniPascal

Este documento complementa os comentários presentes diretamente em `src/core.cjs`, `src/tree-graph.js` e `src/main.cjs`. É material de estudo do código e não substitui o artigo acadêmico pedido pelo professor.

## 1. Análise léxica (`lex`)

A entrada é uma sequência de caracteres. O Lexer percorre a fonte com índice `i`, linha e coluna. Para cada lexema reconhecido, produz um registro com `lexema`, `tipo`, `descricao`, `linha`, `coluna` e `terminal`. As quebras CRLF, LF e CR são tratadas como uma única quebra lógica. Comentários `/* ... */` são ignorados; comentários não fechados geram diagnóstico. Números usam estados INT/FRAC/EXP/SIGN/DIGITS para separar casos válidos de expoentes incompletos. O token EOF marca o final do fluxo mesmo quando há erros léxicos.

A função `terminal` adapta classificações de tokens ao alfabeto terminal SLR(1): identificadores viram `ID`, números viram `NUM`, strings viram `STR`, caracteres `CHAR_CONST`, e o fim da entrada vira `$`.

## 2. Construção da gramática (`buildGrammar`)

A lista de produções vem de `grammar.json`, com lados direitos vazios para ε. Primeiro identificam-se símbolos terminais e não terminais. Calcula-se FIRST por ponto fixo, rastreando também quais não terminais podem derivar ε. FOLLOW propaga símbolos após cada não terminal, incluindo `$` no símbolo inicial aumentado.

Depois se constrói a coleção de estados LR(0). A operação `closure()` adiciona as produções de cada não terminal imediatamente após o ponto de um item. Para cada símbolo gramatical, a transição GOTO move o ponto e calcula um novo fechamento. Estados equivalentes são deduplicados por uma chave determinística.

A tabela ACTION contém SHIFT para transições em terminais, REDUCE quando um item está completo (apenas nos terminais de FOLLOW da produção) e ACCEPT para a produção aumentada no fim da entrada. A tabela GOTO contém transições por não terminais. Colisões incompatíveis são erros de construção, não são resolvidas silenciosamente.

## 3. Simulação SLR(1) (`analisar`)

A pilha de estados começa em `[0]`; a pilha de símbolos começa vazia. A cada consulta ACTION[estado,terminal]:

- **SHIFT:** registra a decisão, empilha o terminal e o estado de destino e só então consome o token.
- **REDUCE:** registra a decisão sem consumir o token, remove `|β|` símbolos/estados, consulta `GOTO(q,A)`, empilha o não terminal `A` e o estado de destino.
- **ACCEPT:** reconhece a entrada conforme a gramática implementada. Não executa nem valida semanticamente o programa.
- **ERROR:** registra a posição e os terminais esperados; tenta recuperar procurando `;`, `end`, `else`, `.` ou `$`, removendo estados da pilha quando necessário. A árvore pode ser parcial após recuperação.

Cada registro contém o estado e as pilhas **anteriores** à operação. O histórico permite inspecionar etapas passadas sem reprocessar a entrada.

## 4. Árvore e interface

O módulo `tree-graph.js` reproduz o histórico: SHIFT gera folha e REDUCE agrupa filhos. Primeiro mede o espaço requerido por cada subárvore; depois posiciona nós e arestas. A nova interface mantém as coordenadas do grafo independentes de pan/zoom, para que o usuário possa mover a tela sem alterar os resultados do Parser. A representação não é um grafo de estados LR(0).

## 5. Responsividade e segurança

O processo principal do Electron aceita o código-fonte por IPC controlado e executa o Parser em Worker Thread, com timeout e substituição de tarefas obsoletas. A interface recebe apenas dados e nunca acessa diretamente o sistema de arquivos. Alterações não salvas exigem confirmação antes de fechar ou instalar atualizações.

## 6. Limitação importante frente ao enunciado

**Mini_Pascal não é Sigma.** A linguagem desta versão ainda não segue integralmente as produções de Sigma especificadas no trabalho. Esta diferença é intencionalmente documentada e deve ser corrigida em outra atualização, com autorização e nova bateria de testes. Não afirmar que o software já implementa a linguagem Sigma completa.

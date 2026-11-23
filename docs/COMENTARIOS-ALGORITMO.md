# Núcleo Java — descrição técnica

Este guia complementa os comentários do código-fonte. O programa combina Lexer e Parser SLR(1) em Java, com interface Electron.

## Análise léxica

`Lexer.proximoToken()` reconhece o próximo token e atualiza linha e coluna. Caracteres não significativos e comentários `/* ... */` são ignorados. Entradas inválidas produzem diagnósticos. `ParserTokenMapper.terminal()` converte categorias léxicas em terminais da gramática.

## Gramática e tabelas

`Grammar.miniPascal()` define as produções numeradas. `SLRTable` calcula FIRST/FOLLOW, o fechamento de itens LR(0), os estados e as transições. A tabela ACTION guarda deslocamentos, reduções nos terminais de FOLLOW e aceitação; GOTO relaciona estados e não terminais.

## Parsing e recuperação

`Parser.analisar()` inicia a pilha de estados em 0 e consulta ACTION para cada token. SHIFT consome entrada; REDUCE retira os símbolos da produção e aplica GOTO; ACCEPT encerra o reconhecimento. Se não houver ação válida, registra o erro e tenta retomar em `;`, `end`, `else`, `.` ou EOF.

Cada `ParseStep` contém uma fotografia das pilhas antes da operação, permitindo inspeção posterior sem reexecutar a análise.

## Comunicação e interface

`Bridge` recebe uma mensagem JSON pelo stdin e envia uma resposta JSON pelo stdout. `java-runner.cjs` inicia o processo Java, limita o tempo e interrompe uma análise anterior quando necessário. O Electron exibe tokens, histórico, mensagens e a árvore construída a partir das ações registradas.

A árvore é desenhada em SVG apenas na interface; não há exportação SVG. A exportação TXT fornece tokens em pares e um relatório detalhado da análise.

## Limites

O resultado de ACCEPT confirma a sintaxe de acordo com a gramática implementada; não comprova correção semântica ou execução do programa.

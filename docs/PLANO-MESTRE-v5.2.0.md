# Plano de entrega — v5.2.0 (IHC, confiabilidade e observação SLR)

**Base auditada:** `main` em `0b71a42f251baa1de699aeb0bccd105d9741f6a7` (v5.1.2).  
**Condição:** implementação autorizada para consolidar as sugestões acumuladas.  
**Método:** corrigir perdas de dados e instabilidades antes de mudanças visuais.

## Objetivos e prioridades

| Prioridade | Escopo | Entrega |
| --- | --- | --- |
| P0 | Código não salvo | Confirmação de saída com salvar, descartar ou cancelar; atualização não instala sem confirmação. |
| P0 | Responsividade | Execução da análise em Worker Thread, com limite de tempo e substituição de execução anterior. |
| P0 | Posição dos erros e tokens | Conversão correta de linha e coluna para arquivos CRLF, CR e LF. |
| P1 | IHC e navegação | Editor maior, escala da interface e fonte configuráveis, botões dentro do contexto certo e sem duplicidade. |
| P1 | Explicações | Cartão de SHIFT, REDUCE, ACCEPT e ERRO em linguagem compreensível, com detalhe técnico secundário. |
| P1 | Linha do tempo | Apenas a linha do código relacionada ao token atual, junto da ação e controles da simulação. |
| P1 | Árvore | Árvore concreta em SVG com nós e conexões, zoom e ramos recolhíveis. Exportação SVG. |
| P1 | Dados estáticos | Tokens, gramática e erros em painel dedicado, sem mistura com ferramentas dinâmicas. |
| P1 | Navegação de erros | Selecione token/erro para ir ao editor; botões anterior/próximo. |
| P2 | Manutenção | Helpers isolados, árvore separada do renderer e responsabilidades do processo principal limitadas. |
| P2 | Testes | Testes CRLF/árvore/Worker e inspeção de interface em navegador. |

## Restrições obrigatórias

- Não alterar a gramática Mini_Pascal, o algoritmo SLR(1), a recuperação ou os 611 passos de referência.
- Não exigir Python nem Java como dependência do executável Electron.
- Manter `contextIsolation`, sandbox, IPC controlado e CSP.
- Não publicar Release se os testes, o build Windows ou os artefatos de atualização falharem.
- Manter publicações em rascunho até `latest.yml`, NSIS, Portable, blockmap e hashes estarem presentes.
- Preservar os nomes e créditos acadêmicos existentes.

## Testes realizados antes da publicação

- `npm run check` — sintaxe dos módulos JavaScript novos e existentes.
- `npm test` — testes de regressão SLR(1), Lexer, updater, helpers do editor, árvore e Worker.
- Smoke test de navegação em Chromium com ambiente Electron simulado: editor, seletor, linha do tempo, zoom, árvore, tokens, gramática e escala.

## O que permanece pendente

- Validação da atualização instalada de uma versão anterior para a v5.2.0 em computador Windows real.
- Testes completos de acessibilidade com leitor de tela e pessoas externas ao grupo.
- Refatoração adicional de `renderer.js`, que continua como controlador da interface, embora helpers e visualização da árvore tenham sido extraídos.
- Avaliação de desempenho e limites de memória com programas muito maiores que os exemplos acadêmicos.

## Processo permanente entre versões

Toda solicitação futura entra na lista acumulada do próximo Plano Mestre. Não executar, fazer commit nem publicar antes da autorização explícita para a atualização consolidada. Revisar `HEAD`, issues, últimas Releases, testes e riscos antes de iniciar cada ciclo.

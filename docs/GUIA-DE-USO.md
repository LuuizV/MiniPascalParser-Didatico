# Guia de uso — MiniPascal Studio

[← Início](../README.md) · [Instalação](INSTALACAO.md)

## Fluxo recomendado em sala de aula

1. **Código:** abra o seletor para escolher um exemplo ou use **Importar TXT** / `Ctrl + O` para abrir um arquivo `.pas` ou `.txt`.
2. **Editor:** observe palavras reservadas, numeração de linhas, cursor e ajuste da fonte.
3. **Analisar:** pressione **Analisar código** ou `Ctrl + Enter`. A interface abrirá **Análise dinâmica**.
4. **Análise dinâmica:** percorra a linha do tempo (manualmente ou em reprodução automática) e observe o **Simulador** e a **Árvore** na mesma área.
5. **Dados estáticos:** consulte **Tokens**, **Gramática** (produções, FIRST/FOLLOW, ACTION/GOTO, LR(0)) e **Erros**.
6. **Ajuda da linguagem:** na aba Código, este botão abre diretamente a consulta de gramática.
7. **Modo apresentação:** está disponível na linha do tempo para ampliar a área útil.

## Operações do SLR(1)

| Operação | Significado |
|---|---|
| **SHIFT** | O terminal é consumido e um novo estado entra na pilha. |
| **REDUCE** | Símbolos reconhecidos são substituídos pelo não terminal de uma produção; em seguida é consultada a tabela GOTO. |
| **ACCEPT** | A entrada é aceita pela gramática. |
| **ERROR** | ACTION não contém uma operação válida para o estado/terminal; o Parser registra o erro e pode tentar recuperação. |

As ações visualizadas são extraídas da execução real do núcleo SLR(1), não de uma animação fictícia.

## Atalhos

| Atalho | Ação |
|---|---|
| `Ctrl + Enter` | Analisar o código. |
| `Ctrl + O` | Abrir arquivo. |
| `Ctrl + S` | Salvar arquivo. |
| `Ctrl + Shift + S` | Salvar como. |
| `Ctrl + 1` | Código. |
| `Ctrl + 2` | Análise dinâmica. |
| `Ctrl + 3` | Dados estáticos. |
| `Ctrl + 4` | Gramática (dados estáticos). |

## Limites didáticos

A saída **Aceito** confirma a conformidade **sintática com a gramática implementada**, não a correção semântica nem a execução do programa. Em caso de recuperação de erros, a árvore pode ser apresentada como parcial. A linguagem suportada não equivale integralmente à Sigma do enunciado original.

# Guia de uso

[← Página principal](../README.md)

## Uma demonstração completa

1. Abra um exemplo na barra lateral ou carregue um arquivo com **Ctrl+O**.
2. Clique em **Analisar código** ou use **Ctrl+Enter**.
3. Abra **Análise léxica** e examine lexema, categoria e posição de cada token.
4. Em **Simulador SLR**, avance e retroceda pelos passos. Observe estado, pilha, entrada, ACTION/GOTO e produção envolvida.
5. Consulte **Gramática** para explorar FIRST/FOLLOW, produções e estados LR(0).
6. Abra **Árvore sintática** para verificar as reduções representadas em nós.
7. Em **Diagnósticos**, clique em um erro para localizar a região do código.
8. Use **Apresentação** para uma demonstração em projetor.

## O que significam as ações?

| Ação | Explicação |
|---|---|
| **SHIFT** | Consome o terminal e empilha um novo estado. |
| **REDUCE** | Substitui símbolos pelo não terminal de uma produção e consulta GOTO. |
| **ACCEPT** | A entrada foi reconhecida pela gramática implementada. |
| **ERROR** | ACTION não possui uma operação válida; pode ocorrer recuperação sintática. |

## Atalhos

`Ctrl+Enter`: analisar. `Ctrl+O`: abrir. `Ctrl+S`: salvar. `Ctrl+Shift+S`: salvar como. `Ctrl+1/2/3/4`: alternar áreas da bancada.

**Nota:** aceitação sintática não implica validade semântica, e a análise não executa o programa.

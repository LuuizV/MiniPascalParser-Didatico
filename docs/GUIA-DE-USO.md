# Guia de utilização — MiniPascal

[Início](../README.md) · [Arquitetura](ARQUITETURA.md) · [Plano Mestre](PLANO-MESTRE.md)

## 1. Código

O editor abre com um programa de exemplo. Utilize **Selecionar código** para ver os exemplos existentes. O seletor abre apenas quando solicitado e não ocupa permanentemente a lateral.

Os comandos **Novo texto**, **Importar arquivo** e **Salvar** pertencem à aba Código. `Importar arquivo` aceita `.pas`, `.p` e `.txt`, substituindo a antiga duplicidade entre *Abrir arquivo* e *Importar TXT*. Alterações não salvas são sinalizadas e uma confirmação aparece antes de descartá-las ou fechar o aplicativo. Aumente ou diminua a fonte do código com **A−** e **A+** no rodapé do editor. Os controles de escala **A− / A+** no cabeçalho afetam a interface inteira e são preservados no computador.

## 2. Análise dinâmica

Clique em **Analisar código** ou `Ctrl + Enter`. A área dinâmica mantém a linha do tempo, o trecho de código atual e um cartão com o significado da operação.

- **SHIFT / Consumiu:** reconhece o terminal e avança para outro estado.
- **REDUCE / Reduziu:** agrupa símbolos segundo uma produção. Não consome o próximo token nesta etapa.
- **ACCEPT / Aceitou:** a entrada corresponde à gramática implementada. Isso **não** significa validação semântica nem execução do programa.
- **ERROR / Erro:** explica que a consulta ACTION não possui operação válida e, quando possível, o Parser tenta continuar.

Use os controles para ir ao primeiro/anterior/próximo/último passo, reproduzir/pausar, mudar velocidade ou selecionar uma etapa no controle deslizante. `Alt + ←/→` também navega entre etapas enquanto a aba dinâmica está aberta.

Em **Simulador**, a pilha apresentada corresponde ao estado **antes** da operação. Em **Árvore de derivação**, o gráfico contém os nós construídos pelas operações SHIFT e REDUCE **até** a etapa escolhida. Use **+ / −** para zoom, clique em um nó para recolher/expandir seus filhos e use **Exportar SVG** para salvar uma imagem vetorial.

## 3. Dados estáticos

- **Tokens:** categoria, lexema, terminal, linha e coluna. Clique para localizar o token no editor.
- **Gramática:** produções, FIRST/FOLLOW, estados LR(0) e ACTION/GOTO. Clique em **Acompanhar estado atual** para sincronizar com a etapa selecionada ou escolha outro estado manualmente.
- **Erros:** lista dos problemas encontrados, com navegação entre diagnósticos e abertura do ponto correspondente no editor.

**Exportar análise** fica nesta área e produz um arquivo `.txt` contendo resultado, tokens, erros e histórico completo de operações.

## Atalhos

| Atalho | Ação |
| --- | --- |
| `Ctrl + Enter` | Analisar o código |
| `Ctrl + N` | Novo texto |
| `Ctrl + O` | Importar arquivo |
| `Ctrl + S` | Salvar código |
| `Ctrl + Shift + S` | Salvar como |
| `Ctrl + 1 / 2 / 3` | Código / Análise dinâmica / Dados estáticos |
| `Alt + ← / →` | Etapa anterior / próxima (análise dinâmica) |

## Limitações

A gramática Mini_Pascal preservada nesta entrega não equivale integralmente à Sigma apresentada no enunciado. A ferramenta não executa programas e não realiza verificação semântica. Após recuperação de erro, a árvore é rotulada como parcial. A visualização limita a quantidade de nós simultâneos para evitar lentidão; os dados originais da análise são preservados.

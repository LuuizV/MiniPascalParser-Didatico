# Guia de utilização — MiniPascal

[Início](../README.md) · [Arquitetura](ARQUITETURA.md)

## 1. Código

O editor abre com um programa de exemplo. Utilize **Selecionar código** para ver os exemplos existentes. O seletor abre apenas quando solicitado e não ocupa permanentemente a lateral.

Os comandos **Novo texto**, **Importar arquivo** e **Salvar** pertencem à aba Código. `Importar arquivo` aceita `.pas`, `.p` e `.txt`, substituindo a antiga duplicidade entre *Abrir arquivo* e *Importar TXT*. Alterações não salvas são sinalizadas e uma confirmação aparece antes de descartá-las ou fechar o aplicativo. A fonte e os controles usam tamanhos fixos e confortáveis. A versão atual removeu os botões A−/A+ que distorciam a interface em algumas resoluções.

## 2. Análise dinâmica

Clique em **Analisar código** ou `Ctrl + Enter`. A área dinâmica mantém a linha do tempo, o trecho de código atual e um cartão com o significado da operação.

- **SHIFT / Consumiu:** reconhece o terminal e avança para outro estado.
- **REDUCE / Reduziu:** agrupa símbolos segundo uma produção. Não consome o próximo token nesta etapa.
- **ACCEPT / Aceitou:** a entrada corresponde à gramática implementada. Isso **não** significa validação semântica nem execução do programa.
- **ERROR / Erro:** explica que a consulta ACTION não possui operação válida e, quando possível, o Parser tenta continuar.

Use os controles para ir ao primeiro/anterior/próximo/último passo, reproduzir/pausar, mudar velocidade ou selecionar uma etapa no controle deslizante. `Alt + ←/→` também navega entre etapas enquanto a aba dinâmica está aberta.

O **Simulador** está integrado à Análise dinâmica, sem subaba. A pilha apresentada corresponde ao estado **antes** da operação. A **Árvore de derivação** é uma aba independente: o gráfico contém os nós construídos por SHIFT e REDUCE **até** a etapa escolhida. Quando o aluno ainda não percorreu o histórico, a primeira abertura apresenta a derivação final resumida, com ramos expansíveis. Arraste o fundo para mover, use a roda do mouse para zoom, **Centralizar** para enquadrar ou clique nos nós para recolher/expandir. **Exportar tokens TXT** salva a visualização atual.

## 3. Dados estáticos

- **Tokens:** categoria, lexema, terminal, linha e coluna. Clique para localizar o token no editor.
- **Gramática:** mostra somente as produções. FIRST/FOLLOW, estados LR(0) e ACTION/GOTO continuam calculados internamente, embora não sejam exibidos.
- **Erros:** lista dos problemas encontrados, com navegação entre diagnósticos e abertura do ponto correspondente no editor.

**Exportar tokens TXT** e **Exportar análise TXT** ficam nesta área e produz um arquivo `.txt` contendo resultado, tokens, erros e histórico completo de operações.

## Atalhos

| Atalho | Ação |
| --- | --- |
| `Ctrl + Enter` | Analisar o código |
| `Ctrl + N` | Novo texto |
| `Ctrl + O` | Importar arquivo |
| `Ctrl + S` | Salvar código |
| `Ctrl + Shift + S` | Salvar como |
| `Ctrl + 1 / 2 / 3 / 4` | Código / Análise dinâmica / Árvore / Dados estáticos |
| `Alt + ← / →` | Etapa anterior / próxima (análise dinâmica) |

## Limitações

A gramática Mini_Pascal preservada nesta entrega não equivale integralmente à Sigma apresentada no enunciado. A ferramenta não executa programas e não realiza verificação semântica. Após recuperação de erro, a árvore é rotulada como parcial. A visualização limita a quantidade de nós simultâneos para evitar lentidão; os dados originais da análise são preservados.

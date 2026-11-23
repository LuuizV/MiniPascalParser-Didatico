# Plano Mestre de entrega — MiniPascal v5.4.0

**Base verificada:** v5.3.0 (`2febad9478f791bb727de4c34471ceba451dfe24`). **Autorização:** implementação consolidada solicitada em 23/11/2026.

## Escopo autorizado

1. **P0 – Interface:** remover escala de interface e ajuste de fonte A−/A+, restaurar tipografia estável e corrigir layout em janelas de 850×640, 1366×768, 1492×944 e 1920×1080.
2. **P1 – Gramática:** expor apenas produções na interface, sem remover as tabelas SLR(1) internas.
3. **P1 – Análise dinâmica:** integrar o simulador à própria área, sem subaba ou controles duplicados.
4. **P1 – Árvore:** criar a quarta aba principal, com arraste por mouse, zoom pela roda com ancoragem no cursor, centralização, ramos recolhíveis e visão geral na primeira abertura.
5. **P1 – Código:** acrescentar comentários ricos e verdadeiros para Lexer, FIRST/FOLLOW, LR(0), ACTION/GOTO, SHIFT/REDUCE/ACCEPT, recuperação, Worker Thread e árvore.
6. **Entrega:** testes, changelog, documentação e publicação por GitHub Release Windows com Setup, Portable, manifesto e hashes.

## Explicitamente fora desta versão

A adequação integral da gramática **Sigma** do enunciado, os novos testes exigidos de Sigma e o artigo acadêmico final **não** foram autorizados neste ciclo. A base Mini_Pascal (71 produções, 130 estados LR(0), 611 passos de referência) deve permanecer inalterada.

## Aceite técnico

- [ ] `npm run check` e `npm test` sem regressão.
- [ ] Todas as quatro abas acessíveis e sem botões cortados nos tamanhos de janela testados.
- [ ] Gramática mostra somente produções; Simulador fixo na Análise dinâmica.
- [ ] Arraste, roda, expansão e centralização respondem à interação do usuário.
- [ ] Preferências antigas de escala/fonte não distorcem o novo layout.
- [ ] Código principal e algoritmo documentados em comentários no próprio fonte.
- [ ] Release v5.4.0 só se torna pública depois do upload de `latest.yml`, instaladores, blockmap e SHA256.
- [ ] Limitação: teste de atualização real em Windows deve ser documentado quando não disponível.

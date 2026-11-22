# AGENTS — Regras permanentes do MiniPascal Studio

## Governança obrigatória

1. **Acumular todas as solicitações entre releases.** Não modificar o código ou publicar assim que um novo pedido chegar. Atualizar o Plano Mestre e esperar autorização explícita para o pacote consolidado.
2. Antes de implementar, conferir HEAD do GitHub, o Plano Mestre, README, CHANGELOG, Releases e os testes da versão atual.
3. Corrigir segurança, falhas de atualização, travamentos e perda de código antes de refinamentos estéticos.
4. Publicar novas versões com número semântico, testes, changelog e Release atômica. Não reescrever versões antigas.
5. Não afirmar que um instalador ou atualização Windows foi testado manualmente quando apenas os testes automatizados passaram.

## Núcleo e interface

6. Preservar a gramática Mini_Pascal até autorização específica. Regressão de referência: 71 produções, 130 estados LR(0), 611 passos SLR(1); resultados e recuperação existentes.
7. Não utilizar Python nem Java como dependências de execução; Electron + JavaScript.
8. A visualização deve mostrar apenas resultados **reais** do Parser. Pilha anterior à operação; árvore após a operação; identificar limites e erro de recuperação.
9. Manter tokens, gramática e erros como dados estáticos; simulador, árvore, linha do código e linha do tempo juntos na análise dinâmica.
10. IHC: priorizar legibilidade, atalhos, escala persistente, sem comandos duplicados ou informação promocional inútil.
11. Manter `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, CSP e IPC restrito. Escapar textos externos antes de inserir HTML/SVG.
12. Não usar instalador silencioso, URLs arbitrárias, tokens pessoais em bundles ou janela de Release pública sem manifesto `latest.yml` completo.
13. Rodar `npm run check` e `npm test` após alterações e, para mudanças na UI, executar também smoke test visual.

## Créditos

Participantes: **Luiz Vicente Gomes Jirardi**, **Raimundo José Santiago Netto**, **Jader Levi Nascimento Abreu Azevedo**. Professor: **José Carlos Martins Oliveira**. Universidade Estadual do Sudoeste da Bahia — Compiladores.

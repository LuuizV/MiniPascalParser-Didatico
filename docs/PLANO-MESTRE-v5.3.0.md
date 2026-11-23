# Plano Mestre de entrega — MiniPascal v5.3.0

**Base:** v5.2.0. **Autorização:** atualização consolidada solicitada pelo usuário.

## Escopo entregue
1. Renomear aplicativo para MiniPascal, mantendo `appId` para continuidade do updater.
2. Integrar o ícone PNG aprovado e gerar o ICO multirresolução durante o build do Windows.
3. Remover Modo Apresentação, controles, eventos e CSS.
4. Limpar ações redundantes, evitando retirar informações didáticas essenciais.
5. Preservar a gramática Mini_Pascal, 71 produções, 130 estados LR(0), 611 passos SLR(1), recuperação de erros e fluxo de atualização segura.
6. Tornar permanente a exigência de publicar **Release** ao final de cada atualização autorizada.

## Critérios de aceite
- [x] Sem Modo Apresentação no código da interface.
- [x] Novo nome e versão alinhados na interface e no empacotamento.
- [x] Assets de ícone incluídos e roteiro de geração ICO no Windows.
- [ ] CI Node.js aprovada no GitHub.
- [ ] Build Windows e Release oficial publicados com todos os artefatos.
- [ ] Teste real de atualização em Windows (quando houver ambiente de teste).

## Pendências futuras, não implementadas
- Redesenhar o fluxo dos botões anterior/próximo erro, preservando controles visíveis.
- Exportar árvores completas além do limite visual de nós.
- Criar ajuda contextual da linguagem, além de consultar a gramática.

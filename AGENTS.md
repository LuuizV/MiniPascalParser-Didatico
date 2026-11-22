# Regras de desenvolvimento — MiniPascal Studio

1. Antes de alterações, leia [README](README.md), [Arquitetura](docs/ARQUITETURA.md) e [Atualizações](docs/ATUALIZACOES.md).
2. Não exigir Python ou Java para executar a versão Electron.
3. Preservar a gramática Mini_Pascal até que uma mudança formal seja autorizada e testada. Não afirmar suporte à especificação Sigma integral.
4. Manter regressão de **71 produções, 130 estados LR(0), 611 passos SLR(1)** enquanto a gramática permanecer a mesma.
5. Executar `npm run check` e `npm test` após mudanças de núcleo ou interface.
6. Preservar `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, CSP e IPC limitado.
7. Não permitir URLs arbitrárias no atualizador nem incluir tokens de acesso em builds.
8. Não atualizar silenciosamente: obter confirmação, preservar código não salvo e indicar que Portable exige atualização manual.
9. Incrementar `package.json` antes de publicar nova Release. Não substituir versões antigas.
10. Documentar correções e limitações no [CHANGELOG](CHANGELOG.md); não afirmar testes Windows concluídos sem executá-los.
11. Preservar créditos: Luiz Vicente Gomes Jirardi, Raimundo José Santiago Netto, Jader Levi Nascimento Abreu Azevedo. Professor: José Carlos Martins Oliveira.

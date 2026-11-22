# Regras permanentes de desenvolvimento — MiniPascal Studio

**Obrigatório antes de qualquer atualização:** ler [Plano Mestre](docs/PLANO-MESTRE.md), verificar o HEAD do repositório, as Releases, os bloqueadores e o resultado da última suíte de testes. Novos pedidos devem ser incorporados ao plano antes de implementação de mudanças amplas.

1. Corrigir falhas graves, regressões e problemas de atualização **antes** de mudanças visuais ou recursos adicionais.
2. Preservar a gramática Mini_Pascal; não afirmar compatibilidade integral com a Sigma do PDF sem implementar e testar.
3. Preservar as referências: **71 produções, 130 estados LR(0), 611 ações SLR(1)**.
4. Não exigir Java nem Python para executar o Electron.
5. Rodar `npm run check` e `npm test` e complementar com testes específicos do problema.
6. Manter `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true`, CSP e IPC limitado.
7. Não permitir URLs arbitrárias no updater nem embutir tokens de autenticação.
8. Não instalar sem confirmação; preservar edições não salvas. A versão Portable permanece manual.
9. Manter cada Release em rascunho até instalar, manifesto e hashes serem verificados; não substituir arquivos de tags antigas.
10. Incrementar a versão e atualizar o CHANGELOG; distinguir build automático de teste de instalação Windows real.
11. Documentar decisões, limitações e pendências no Plano Mestre.
12. Preservar créditos: Luiz Vicente Gomes Jirardi, Raimundo José Santiago Netto, Jader Levi Nascimento Abreu Azevedo; professor José Carlos Martins Oliveira.

# Regras de desenvolvimento — MiniPascal Studio

- Não adicionar Python ou Java como dependência de execução.
- Preservar fielmente gramática, lexer, SLR(1), recuperação e ordem das ações da versão Java base.
- `src/grammar.json` possui 71 produções; a numeração afeta o teste de mesa.
- `src/core.cjs` tem de produzir 130 estados e exatamente os 611 passos de referência nos testes atuais.
- Rodar `npm run check && npm test` antes de cada alteração que afete Lexer, Parser ou interface.
- Jamais usar HTML sem escapar textos provenientes do código do usuário.
- Manter `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` e IPC com argumentos validados.
- Não abrir navegação remota na janela da aplicação.
- Não adicionar frameworks e dependências visuais sem necessidade.
- Documentar cada nova funcionalidade em português; preservar modo apresentação e atalhos.
- Não afirmar que existe instalador executável sem gerá-lo e testá-lo.

# Histórico de versões

## v5.1.0 — Atualização pelas Releases e documentação acadêmica

- Integração com `electron-updater` para o instalador Windows NSIS.
- Consulta à Release oficial na inicialização e por ação do usuário.
- Download com progresso e instalação após confirmação e salvamento de alterações.
- Acesso à Release oficial no modo Portable.
- Pipeline Windows com `latest.yml`, instalador, portátil e hashes SHA256.
- Documentação técnica e acadêmica com identificação dos três estudantes e do professor.
- Testes unitários do gerenciador de atualização.

**Pendências:** a v5.0.0 precisa de instalação manual para receber o recurso; instalar/atualizar em Windows real precisa ser testado. Executáveis sem assinatura digital.

## v5.0.0 — Migração para Electron

- Reimplementação do Lexer e Parser em JavaScript, mantendo a gramática atual.
- Editor, simulador SLR(1), árvore de derivação, estados e diagnósticos.
- Regressão dos 130 estados e 611 ações sintáticas da versão Java.

## v4.0.0 — Versão Java (legado)

- Continuidade entre o Lexer e o Parser, documentação dos métodos e visualização didática em Swing.

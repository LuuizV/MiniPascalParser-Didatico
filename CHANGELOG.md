# CHANGELOG

## v5.0.0 — Electron

- Migração completa da interface Java Swing para Electron com identidade visual moderna.
- Tradução do Lexer, geração SLR(1) e Parser para JavaScript puro, sem exigir Java ou Python na execução.
- Preservação da gramática, dos 130 estados LR(0) e dos 611 passos de regressão.
- Editor com sintaxe, numeração de linhas, salvamento e navegação para tokens/erros.
- Abas para Lexer, simulador SLR, gramática, árvore concreta e diagnósticos.
- Execução automática, pausa, retrocesso, velocidade, timeline e modo apresentação.
- Ações nativas protegidas por preload isolado e IPC restrito.
- Automação de testes Node e workflow para gerar instalador/portable no Windows.

- Pipeline de build Windows x64: verificações, testes, `.exe` NSIS e portátil, checksums e publicação automática da Release `v5.0.0` no GitHub.

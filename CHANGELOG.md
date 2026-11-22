# Histórico de versões

Este documento registra as mudanças funcionais e técnicas do MiniPascal Studio.

## [5.1.2] — Correção de atualização e Plano Mestre

- Workflow cria a Release como rascunho e só publica depois de validar instalador, Portable, `latest.yml`, blockmap e SHA256 no GitHub.
- Atualizador reconhece o erro `latest.yml` 404 como possível publicação incompleta; faz duas novas consultas automáticas, sem baixar nem instalar silenciosamente.
- Mensagens de atualização simplificadas e novos testes de falha transitória e recuperação.
- Adicionado [Plano Mestre](docs/PLANO-MESTRE.md) como regra permanente entre atualizações.
- **Limitação:** atualização real no Windows deve ser validada após o build.

## [5.1.1] — Interface simplificada e separação didática

- Removidos o banner de apresentação, o cartão decorativo do método SLR(1), o breadcrumb e o rodapé redundante.
- Navegação reorganizada em **Código**, **Análise dinâmica** e **Dados estáticos**.
- Seletor de programas de exemplo recolhível, sem lista lateral permanente; ações Importar TXT e Ajuda no editor.
- Simulador, árvore e linha do tempo reunidos no mesmo container; tokens, gramática e erros no container estático.
- Resumo de análise compacto e exibido apenas após uma execução; preservados os controles, atalhos, exportação e atualização.
- Código do analisador e algoritmo SLR(1) inalterados. Testes de regressão preservados.

## [5.1.0] — Atualizações e documentação acadêmica

### Adicionado
- Gerenciador de atualizações por **GitHub Releases**, usando `electron-updater` no instalador Windows NSIS.
- Verificação ao iniciar, estado de versão disponível, download sob demanda, progresso e confirmação de instalação.
- Tratamento especial do executável **Portable**, com link seguro para a Release oficial.
- Proteção de alterações não salvas antes de instalar e reiniciar.
- Quatro testes automatizados para os estados do gerenciador de atualização.
- Documentação: instalação, guia de uso, arquitetura, atualizações e contexto acadêmico.
- Créditos dos três estudantes participantes e do professor.

### Alterado
- Pipeline Windows: Release por versão, **`latest.yml`**, instalador, portátil e `SHA256SUMS.txt`.
- README reformulado para apresentação profissional do projeto.

### Limitações
- A versão 5.0.0 não se atualiza sozinha; instalar a 5.1.0 manualmente para habilitar o novo mecanismo.
- Instalação real do NSIS e atualização de uma Release para outra ainda requerem teste prático Windows.
- Os executáveis ainda não são assinados digitalmente.

## [5.0.0] — Migração para Electron

- Reescrita do núcleo e interface com Electron, HTML, CSS e JavaScript.
- Editor com realce sintático, simulador SLR(1), árvore de derivação, pilha, FIRST/FOLLOW e ACTION/GOTO.
- Preservação dos 130 estados e das 611 ações SLR(1) verificadas nos arquivos-base.
- Compilação Windows via GitHub Actions.

## [4.0.0] — Versão Java didática (legado)

- Continuidade entre o Lexer e o Parser originais, comentários documentados e simulação Java Swing.
- A implementação Java permanece disponível como referência de regressão na entrega anterior.

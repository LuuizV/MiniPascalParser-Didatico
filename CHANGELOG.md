# Registro de versões — MiniPascal Studio

## v5.2.0 — Refino de IHC e confiabilidade

- Editor ampliado: Novo texto, Importar arquivo e Salvar dentro da aba Código; seleção recolhível de exemplos e remoção dos ícones redundantes do topo.
- Análise dinâmica com linha do tempo, apenas a linha de código relevante e explicações em cartões de SHIFT/REDUCE/ACCEPT/ERRO.
- Nova árvore SVG real construída das ações registradas, com conexões, zoom, recolhimento e exportação vetorial.
- Tokens, Gramática e Erros agrupados na consulta de dados estáticos; exportação de análise em área própria.
- Melhoria de leitura: fontes maiores, zoom global persistente, contraste, controles ampliados e modo apresentação.
- Navegação entre erros/tokens e editor, correção de offsets de CRLF/CR/LF.
- Proteção do trabalho não salvo ao fechar; fluxo de salvar/descartar/cancelar.
- Execução do Parser em Worker Thread, sem bloquear o loop de janelas; validação de arquivos e preferências.
- Novos testes para árvore, helpers, explicações e Worker Thread. Suite de referência do SLR(1) preservada.
- Regras de acumular solicitações entre versões e Plano Mestre v5.2.0 documentados.

**Limitações conhecidas:** Instalação real/atualização no Windows ainda deve ser validada em computador Windows; árvore visual limitada em nós simultâneos; teste formal de acessibilidade ainda pendente.

---

Este documento registra as mudanças funcionais e técnicas do MiniPascal Studio.

## [5.1.2] — Publicação segura e resiliência do atualizador (2026-11-22)

- Correção do processo de publicação: release em rascunho até verificar `.exe`, `latest.yml`, `.blockmap` e SHA256.
- Atualizador passa a tratar erro `latest.yml` 404 com até duas novas tentativas e mensagem amigável; nunca instala sem confirmação.
- Novos testes de ausência temporária do manifesto e recuperação após publicação.
- Instituído o [Plano Mestre](docs/PLANO-MESTRE.md), obrigatório antes de novas atualizações.
- **Pendente de validação manual:** upgrade real entre dois instaladores no Windows.

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

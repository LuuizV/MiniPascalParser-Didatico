## v5.5.0 — Núcleo Java e interface

- Parser SLR(1) e Lexer executados em processo Java com integração JSON ao Electron.
- Runtime Java empacotado para execução sem Java instalado.
- Editor com linhas sincronizadas e marcação vermelha de erros léxicos e sintáticos.
- Barra de ações do Código reorganizada e novo ícone nas cores do aplicativo.
- Exportações TXT de tokens e análise; removida a exportação SVG.
- Removidos o antigo Parser JavaScript, Worker e arquivos não utilizados.

# Registro de versões — MiniPascal

## v5.4.0 — Leitura, árvore independente, produções e código documentado

- Removidos todos os ajustes A−/A+ de escala e fonte; eliminado o uso de preferências antigas que deformavam a interface. Tipografia padrão e navegação responsiva.
- Árvore de derivação promovida a quarta área principal, com arraste, zoom no cursor, centralização, ramos recolhíveis e visão inicial compacta.
- Simulador reunido diretamente à Análise dinâmica, com pilha e operações sem subabas.
- Gramática simplificada para exibir somente suas produções; estrutura LR(0), FIRST/FOLLOW, ACTION/GOTO preservada no núcleo.
- Comentários detalhados no Lexer, no Parser SLR(1), na recuperação de erros, na geração de tabelas, na Worker Thread e na construção da árvore.
- 71 produções, 130 estados e 611 passos de regressão preservados. **A linguagem Sigma continua pendente** e não faz parte desta atualização.
- Testes de interface visual com navegador simulado em quatro resoluções; testes de integração contínua e build Windows exigidos antes da Release.



## v5.3.0 — Identidade MiniPascal e limpeza de interface

- Alterado o nome exibido do aplicativo de MiniPascal Studio para **MiniPascal** em janela, interface, executáveis, instalador e documentação.
- Ícone PNG aprovado integrado ao aplicativo; ícone ICO multirresolução usado no Windows.
- Removido o Modo Apresentação, seus controles, eventos e CSS específicos.
- Ações contextuais são mostradas apenas quando úteis: expandir nós recolhidos e retornar ao estado atual.
- "Ajuda da linguagem" renomeada para "Ver gramática"; controles redundantes nos diagnósticos retirados.
- Limpeza dos estilos não utilizados sem alterar Lexer, Parser, árvores ou atualizador.
- Mantida a identidade técnica do aplicativo (`appId`) para reduzir risco nas atualizações.

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

**Limitações conhecidas:** Instalação real/atualização no Windows ainda deve ser validada em computador Windows; árvore visual limitada em nós simultâneos; teste formal de acessibilidade ainda pendente.

---

Este documento registra as mudanças funcionais e técnicas do MiniPascal.

## [5.1.2] — Publicação segura e resiliência do atualizador (2026-11-22)

- Correção do processo de publicação: release em rascunho até verificar `.exe`, `latest.yml`, `.blockmap` e SHA256.
- Atualizador passa a tratar erro `latest.yml` 404 com até duas novas tentativas e mensagem amigável; nunca instala sem confirmação.
- Novos testes de ausência temporária do manifesto e recuperação após publicação.
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

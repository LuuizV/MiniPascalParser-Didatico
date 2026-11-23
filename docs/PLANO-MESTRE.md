# Plano Mestre — Governança de Atualizações do MiniPascal

> **Documento de referência obrigatório entre versões.** O próximo ciclo de desenvolvimento só começa depois de revisar este plano, o estado da branch principal, as Releases e os testes.

**Projeto:** MiniPascal · **Repositório:** `LuuizV/MiniPascalParser-Didatico`  
**Base:** Electron + JavaScript, Lexer, Parser SLR(1) · **Primeira aplicação:** v5.1.2

## 1. Princípios imutáveis

1. **Corrigir antes de expandir.** Falhas de execução, atualização, instalação, regressão e perda de dados têm precedência sobre melhorias visuais e novas funções.
2. **Plano antes do código.** Para cada versão, registrar objetivos, escopo, alterações planejadas, dependências, riscos, testes e critérios de aceite. No chat, reunir as propostas acumuladas e apresentar o plano para revisão antes da implementação de uma mudança ampla.
3. **Repositório como fonte da verdade.** Ler HEAD, `AGENTS.md`, README, CHANGELOG e os relatórios mais recentes, em vez de reutilizar fontes antigas.
4. **Funcionalidades preservadas.** Não alterar sem autorização a gramática (71 produções), os estados LR(0) (130), os 611 passos da suíte, os resultados de erro e a recuperação.
5. **Segurança.** Sem Python ou Java no runtime; sem tokens embutidos; Electron com isolamento, sandbox e IPC restrito; sem instalação silenciosa.
6. **Histórico verificável.** Cada versão recebe número próprio, changelog, testes, commit e Release. Não sobrescrever executáveis já publicados.
7. **Relato fiel.** Distinguir testes unitários, compilação Windows e teste real de instalação/atualização em computador Windows.

## 2. Fluxo obrigatório entre atualizações

| Etapa | Resultado exigido |
| --- | --- |
| **A. Levantamento** | Consultar repositório, issues, últimas Releases, logs de erros e contexto dos pedidos. |
| **B. Diagnóstico** | Classificar falhas críticas, regressões, UX, funcionalidades e documentação. |
| **C. Plano da versão** | Escopo, riscos, arquivos previstos, prioridade e critérios de aceite claros. |
| **D. Implementação** | Mudanças pequenas, rastreáveis, preservando a versão anterior. |
| **E. Verificação** | `npm run check`, `npm test`, inspeção de UX e testes específicos da mudança. |
| **F. Publicação** | Tag semântica, `.exe` Setup e Portable, `latest.yml`, `.blockmap`, hashes. |
| **G. Pós-publicação** | Verificar GitHub Actions, Release pública completa e teste de atualização da versão anterior. |
| **H. Registro** | Atualizar README/CHANGELOG e registrar falhas ou limitações ainda abertas. |

**Bloqueadores:** regressão do compilador; falha de atualização; instalador ausente; Release publicada sem `latest.yml`; arquivos sem validação; código não salvo sujeito a perda; erros de segurança. Se existir bloqueador, não publicar uma versão que o ignore.

## 3. Contrato da publicação atômica

- Executar compilação e testes antes de disponibilizar uma Release aos usuários.
- **Criar ou reutilizar somente uma Release em rascunho sem artefatos** para o número da versão.
- Publicar o Setup NSIS, Portable, `.blockmap` e `latest.yml` no rascunho.
- Confirmar que o manifesto contém **a mesma versão e o nome exato do instalador**, com SHA-512.
- Confirmar que os artefatos esperados chegaram ao GitHub e publicar também `SHA256SUMS.txt`.
- **Somente após essas verificações**, tornar a Release pública e marcá-la como a mais recente.
- Se qualquer etapa falhar, deixar o rascunho inacessível ao atualizador. Não remendar uma Release pública antiga substituindo binários silenciosamente.

### Erro `Cannot find latest.yml` (404)

**Diagnóstico da v5.1.1:** o arquivo `latest.yml` estava presente na Release quando consultado; o workflow, porém, podia tornar a Release pública antes de subir todos os arquivos. Uma consulta durante essa janela é uma causa **plausível**, não provada sem o log do instante da falha.

**Correção v5.1.2:** a publicação passa a ser validada antes de sair de rascunho; a aplicação reconhece o erro transitório, aguarda e tenta até duas vezes novamente, sem executar downloads/instalações não autorizados. Ao esgotar as tentativas, oferece mensagem simples e a Release oficial. A versão Portable mantém atualização manual.

**Teste de aceitação futuro no Windows:** instalar uma versão anterior pelo Setup, disponibilizar uma nova Release, verificar detecção, download, integridade, confirmação, reinício, preservação do editor e versão final instalada.

## 4. Critérios mínimos para encerrar uma versão

- [ ] Mudanças previstas no plano, com escopo explícito.
- [ ] Sem regressão: 71 produções, 130 estados LR(0), 611 passos e os casos de erro.
- [ ] Testes automatizados aprovados; verificações de interface proporcionais ao escopo.
- [ ] Documentação e créditos acadêmicos atualizados.
- [ ] Versão em `package.json` compatível com a tag `vX.Y.Z`.
- [ ] Instalação NSIS, Portable, `latest.yml`, `.blockmap` e SHA256 presentes.
- [ ] Release não publicada antes da validação e workflow concluído.
- [ ] Limitações de testes em Windows informadas ao usuário.

## 5. Responsabilidades e créditos

**Participantes:** Luiz Vicente Gomes Jirardi, Raimundo José Santiago Netto e Jader Levi Nascimento Abreu Azevedo.  
**Professor:** José Carlos Martins Oliveira.  
**Disciplina:** Compiladores — Universidade Estadual do Sudoeste da Bahia (UESB).

Este plano poderá ser revisado por novas decisões do grupo. Mudanças de gramática, métodos de análise ou requisitos de entrega acadêmica exigem revisão explícita de escopo e de testes.

## Regra obrigatória de entrega

Depois de uma autorização para implementar a atualização acumulada, a entrega deve incluir **Release pública no GitHub com Setup, Portable, latest.yml, blockmap e SHA256**. Não finalizar somente com pacote ZIP ou commit. Aguardar aprovação dos testes e build antes de publicar a Release.

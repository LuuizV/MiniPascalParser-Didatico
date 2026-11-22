# Plano Mestre — Processo de Atualizações

**Projeto:** MiniPascal Studio · **Repositório:** [LuuizV/MiniPascalParser-Didatico](https://github.com/LuuizV/MiniPascalParser-Didatico)  
**Vigência:** a partir da v5.1.2 · **Stack:** Electron + JavaScript + SLR(1)

Este documento estabelece uma revisão obrigatória **entre todas as versões**, para evitar regressões e organizar melhorias sem perder funcionalidades.

## 1. Princípios obrigatórios

1. **Resolver falhas antes de criar recursos.** Erros de atualização, instalação, segurança, perda de arquivos e regressões bloqueiam novas funcionalidades.
2. **Plano antes de implementar.** Registrar em cada ciclo objetivos, escopo, prioridades, arquivos afetados, riscos e testes. Pedidos futuros entram no próximo plano até serem autorizados.
3. **Consultar HEAD e as Releases.** Nunca alterar uma cópia desatualizada; ler `AGENTS.md`, README, CHANGELOG, código e workflows.
4. **Preservar o compilador.** Manter 71 produções, 130 estados LR(0), 611 passos SLR(1), tratamento de erros, salvo modificação de gramática explicitamente aprovada.
5. **Segurança.** Sem dependência de Java/Python na execução; manter `contextIsolation`, sandbox, IPC restrito e nenhuma credencial no aplicativo.
6. **Versões auditáveis.** Cada alteração exige incremento de versão, changelog, testes, commit e Release própria. Não substituir binários de versões antigas.
7. **Evidência real.** Distinguir teste unitário, build no GitHub Actions e teste de atualização em Windows real; declarar limitações.

## 2. Etapas de cada atualização

| Fase | Ação e condição de avanço |
| --- | --- |
| **1. Diagnóstico** | Revisar bugs, falhas críticas, HEAD, últimas Releases e relatórios existentes. |
| **2. Plano da versão** | Consolidar pedidos e definir prioridades, escopo, risco e critérios de aceite. |
| **3. Implementação** | Corrigir os bloqueadores primeiro; preservar o código funcional. |
| **4. Testes** | Executar `npm run check`, `npm test` e verificações específicas da mudança. |
| **5. Build** | Compilar Windows x64 e validar Setup, Portable, `latest.yml`, `.blockmap` e hashes. |
| **6. Release** | Publicar apenas versão completa, com tag e changelog. |
| **7. Pós-publicação** | Verificar CI, artefatos públicos, download e transição entre versões instaladas. |
| **8. Encerramento** | Documentar resultados, limitações e itens pendentes do próximo ciclo. |

**Bloqueadores:** quebra no Lexer/Parser, incompatibilidade de atualização, manifesto ausente, instalador não executável, perda de código não salvo ou falha grave de segurança.

## 3. Política da Release atômica

A nova versão deverá permanecer como **rascunho** enquanto os arquivos são compilados, enviados e verificados. Conferir a versão e o instalador citados pelo `latest.yml`, a presença do SHA-512, o Setup NSIS, o Portable, o blockmap e o SHA256. Só após esses testes tornar a Release pública e marcá-la como latest.

Se o workflow falhar, manter o rascunho e investigar. Não publicar arquivo incompleto nem sobrescrever artefatos públicos antigos.

### Incidente inicial: `latest.yml` 404 na v5.1.1

O manifesto foi encontrado posteriormente nos artefatos da v5.1.1; o 404 pode ter ocorrido na janela em que a Release já estava pública, mas seu upload não havia terminado. **Essa é uma hipótese fundamentada no workflow, não uma prova do instante exato.**

**Correção planejada para a v5.1.2:** Release somente após validação; até duas novas consultas espaçadas quando o manifesto estiver temporariamente inacessível; mensagens claras e nenhuma instalação sem confirmação. O Portable permanece manual.

## 4. Aceitação obrigatória

- [ ] Objetivos da versão e riscos registrados.
- [ ] Testes do compilador e cenários de erro aprovados.
- [ ] Segurança do Electron preservada; nenhuma credencial exposta.
- [ ] Testes novos incluídos para cada bug corrigido.
- [ ] `package.json`, CHANGELOG e documentação alinhados.
- [ ] Setup, Portable, manifesto, blockmap e hashes publicados completos.
- [ ] Actions aprovados; Release não visível antes da validação.
- [ ] Teste Windows real executado ou limitação declarada.
- [ ] Próximas pendências registradas.

## 5. Créditos acadêmicos

**Alunos:** Luiz Vicente Gomes Jirardi; Raimundo José Santiago Netto; Jader Levi Nascimento Abreu Azevedo.  
**Professor:** José Carlos Martins Oliveira.  
**Instituição:** Universidade Estadual do Sudoeste da Bahia (UESB). **Disciplina:** Compiladores.

O plano poderá ser revisto em futuras versões, mediante registro da decisão do grupo.

<div align="center">

# ◈ MiniPascal

### Uma bancada visual para compreender compiladores, token por token.

**Análise léxica · Análise sintática SLR(1) · Simulação interativa**

[![Versão](https://img.shields.io/badge/versão-5.6.0-8b7cf6?style=for-the-badge)](https://github.com/LuuizV/MiniPascalParser-Didatico/releases/latest)
[![Electron](https://img.shields.io/badge/Electron-45-47848F?style=for-the-badge&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![Node.js](https://img.shields.io/badge/JavaScript-Node.js-358A58?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Windows](https://img.shields.io/badge/Windows-x64-1570CC?style=for-the-badge&logo=windows&logoColor=white)](https://github.com/LuuizV/MiniPascalParser-Didatico/releases/latest)

[![Testes automatizados](https://github.com/LuuizV/MiniPascalParser-Didatico/actions/workflows/ci.yml/badge.svg)](https://github.com/LuuizV/MiniPascalParser-Didatico/actions/workflows/ci.yml)
[![Compilação Windows](https://github.com/LuuizV/MiniPascalParser-Didatico/actions/workflows/build-windows.yml/badge.svg)](https://github.com/LuuizV/MiniPascalParser-Didatico/actions/workflows/build-windows.yml)

[**Baixar para Windows**](https://github.com/LuuizV/MiniPascalParser-Didatico/releases/latest) · [**Manual de instalação**](docs/INSTALACAO.md) · [**Guia de uso**](docs/GUIA-DE-USO.md) · [**Arquitetura**](docs/ARQUITETURA.md)

</div>

---

## Novidades da v5.6.0

- **Interface estável e legível:** controles A−/A+ de escala global e fonte removidos; fontes e tamanhos padrão equilibrados, com layout responsivo sem zoom que deforme componentes.
- **Quatro áreas simples:** Código, Análise dinâmica (com simulador integrado), Árvore de derivação e Dados estáticos.
- **Árvore com navegação livre:** arraste com mouse, zoom pela roda no ponto do cursor, enquadramento, ramos recolhíveis ; abre com uma visão geral do resultado quando a linha do tempo ainda não foi explorada.
- **Gramática simplificada:** somente a lista das 71 produções; FIRST/FOLLOW, LR(0), ACTION/GOTO permanecem no núcleo SLR(1), sem interface própria.
- **Código mais bem explicado:** comentários técnicos objetivos no Lexer, geração das tabelas SLR(1), execução do Parser, recuperação de erros, processo Java e construção da árvore.
- **Regressão preservada:** nenhuma alteração na gramática Mini_Pascal ou nas decisões do Parser. **A linguagem usada nesta etapa é Mini_Pascal, conforme o enunciado de 2026.2.**

Consulte o [guia do algoritmo SLR(1)](docs/COMENTARIOS-ALGORITMO.md) e o [Guia de uso](docs/GUIA-DE-USO.md).

## Melhorias da v5.6.0

- Áreas de análise, árvore e resultados sem cabeçalhos repetidos.
- Símbolos não terminais exibidos em português na árvore e na pilha, sem alterar os terminais nem a gramática.
- Pilha agrupada por símbolo e estado, com cores por categoria e realce do topo ou da redução.
- Linha atual em relação ao total de linhas do código e indicador discreto de posição.
- Erros acompanhados da linha completa do código e destaque do trecho relacionado; navegação entre diagnósticos sem sair da lista.

## Sobre o projeto

O **MiniPascal** é uma ferramenta acadêmica para estudar **compiladores** a partir do reconhecimento de programas em uma gramática didática de Mini_Pascal. O código é processado em duas fases integradas: um **Lexer** identifica os tokens; em seguida, o **Parser SLR(1)** consulta tabelas **ACTION/GOTO** para decidir entre *SHIFT*, *REDUCE*, *ACCEPT* e tratamento de erros.

A diferença é que o estudante pode **enxergar o processo acontecendo**: acompanhar a pilha, explorar os estados, consultar as regras e avançar ou retroceder no histórico de análise. O núcleo do compilador é implementado em **Java**, com interface **Electron/JavaScript**, preservando o comportamento verificado da gramática e do analisador fornecidos.

> **Escopo acadêmico:** o analisador reconhece a gramática **Mini_Pascal do trabalho de 2026.2**. A implementação preserva a gramática do Parser existente; alguns recursos citados na especificação lexical não estão presentes no analisador sintático. O projeto não realiza análise semântica completa; consulte as [limitações](#limitações-e-honestidade-técnica).

## Recursos principais

| Área | O que é possível observar |
| --- | --- |
| **Editor de código** | Destaque de sintaxe, numeração de linhas, arquivos `.pas` e atalhos. |
| **Lexer** | Lexema, classificação, terminal correspondente, linha e coluna. |
| **Simulador SLR(1)** | Execução passo a passo, entrada restante, pilha e ações de análise. |
| **Gramática** | Lista das 71 produções da linguagem implementada. |
| **Árvore de derivação** | Aba própria com navegação por arraste, zoom, recolhimento de ramos. |
| **Diagnósticos** | Erros léxicos e sintáticos, posição e navegação até o código. |
| **Atualizações** | Consulta às Releases oficiais; instalador NSIS atualizável com confirmação. |

## Comece por aqui

### Baixar e instalar no Windows

1. Abra **[Releases — MiniPascal](https://github.com/LuuizV/MiniPascalParser-Didatico/releases/latest)**.
2. Baixe **`MiniPascal-Setup-<versão>-x64.exe`** para instalar no computador e receber futuras atualizações pelo aplicativo.
3. Se preferir executar sem instalar, utilize o **`MiniPascal-Portable-<versão>-x64.exe`**, que precisa ser substituído manualmente a cada nova versão.
4. Abra o aplicativo, carregue um exemplo e clique em **Analisar código**.

**O runtime Java acompanha o instalador e o Portable; não é necessário instalar Java, Python ou Node.js.** Os executáveis são gerados para Windows x64 por GitHub Actions. Veja as instruções detalhadas em [Instalação](docs/INSTALACAO.md).

### Executar a partir do código-fonte

Requisitos de desenvolvimento: **Node.js 22+**, npm e **JDK 21**.

```bash
npm install
npm start
```

Para validar o núcleo e os fluxos de atualização:

```bash
npm run check
npm test
```

Para gerar os executáveis no Windows:

```bash
npm run dist:win
```

## Como funciona

```mermaid
flowchart LR
    A["Código Mini_Pascal"] --> B["Lexer"]
    B --> C["Lista de tokens"]
    C --> D["Parser SLR(1)"]
    E["Gramática + FIRST/FOLLOW"] --> F["LR(0) + ACTION/GOTO"]
    F --> D
    D --> G["Histórico de passos"]
    G --> H["Simulador · Pilha · Árvore"]
    D --> I["Resultado e diagnósticos"]
```

A implementação atual possui **71 produções**, **130 estados LR(0)** e mantém, nos seis arquivos de regressão sintática, o mesmo histórico de **611 ações SLR(1)** comparado com a versão Java. Esses valores são referências de testes, não propriedades universais de qualquer gramática.

## Atualizações pelas Releases

A partir da **v5.1.0**, o instalador NSIS pode consultar a **Release estável** publicada neste repositório. O usuário decide quando baixar e quando instalar; o aplicativo não substitui seus arquivos silenciosamente.

- A consulta ocorre ao abrir o aplicativo ou manualmente no painel **Atualizações**.
- Havendo versão mais recente, é exibido um botão para **baixar** e, depois, **instalar e reiniciar**.
- O progresso fica visível. Antes de reiniciar, o editor verifica alterações não salvas.
- A edição **Portable** abre a Release oficial, pois não oferece atualização no local.
- Novas versões usam um número `vX.Y.Z`; a Release só sai de rascunho depois que instalador, portátil, `latest.yml` e hashes forem validados.

**Importante:** quem possui a v5.0.0 precisa instalar a v5.1.0 manualmente uma vez. Para que o auto-update funcione em produção, a Release precisa conter também `latest.yml` e o `.exe` NSIS. Detalhes em [Atualizações e publicação](docs/ATUALIZACOES.md).

## Interface de trabalho

O aplicativo possui quatro áreas principais, sem controles globais de escala que distorçam a interface:

- **Código:** editor com destaque de sintaxe, exemplos, importação e salvamento.
- **Análise dinâmica:** linha do tempo, código atual, explicações e simulador com pilha integrado.
- **Árvore de derivação:** painel independente que permite arrastar o mapa, aproximar, centralizar e recolher ramos.
- **Dados estáticos:** tokens, produções da gramática e diagnósticos.

Os atalhos `Ctrl+1`, `Ctrl+2`, `Ctrl+3` e `Ctrl+4` abrem essas áreas. O botão **Analisar código** executa a análise e abre o acompanhamento dinâmico.

## Trabalho acadêmico

**Universidade Estadual do Sudoeste da Bahia (UESB)**  
Departamento de Ciências Exatas (DCET) · Ciência da Computação · Disciplina: **Compiladores**

**Discentes:**
- **Luiz Vicente Gomes Jirardi**
- **Raimundo José Santiago Netto**
- **Jader Levi Nascimento Abreu Azevedo**

**Professor:** **José Carlos Martins Oliveira**

Este repositório apresenta uma evolução da atividade prática de análise sintática e sua integração ao analisador léxico. O [contexto acadêmico](docs/CONTEXTO-ACADEMICO.md) descreve o problema proposto, as decisões técnicas e as limitações conhecidas.

## Estrutura do repositório

```text
MiniPascalParser-Didatico/
├── src/
│   ├── java-runner.cjs       # Processo Java e protocolo JSON
│   ├── update-manager.cjs    # Estados e operações de atualização
│   ├── main.cjs              # Electron, IPC e arquivos locais
│   ├── preload.cjs           # API limitada exposta à interface
│   ├── index.html            # Interface
│   ├── renderer.js           # Simulação e navegação
│   └── style.css             # Identidade visual
├── java/src/minipascal/       # Lexer, Parser SLR(1) e protocolo JSON
├── tests/                    # Testes e programas da linguagem
├── docs/                     # Documentação técnica e acadêmica
├── .github/workflows/        # Integração contínua e Releases
└── package.json              # Dependências e distribuição
```

## Limitações e honestidade técnica

- O software **reconhece** programas, mas **não os executa** e não gera código de máquina.
- A gramática atual é **Mini_Pascal**, preservada do núcleo anterior, com limitações sintáticas documentadas.
- A árvore de derivação pode ser **parcial** em programas com erros recuperados.
- A interface da Gramática exibe **somente as produções**. Estados LR(0), FIRST/FOLLOW e ACTION/GOTO continuam sendo gerados internamente para o funcionamento do SLR(1).
- Os testes automatizados verificam o núcleo, o histórico de análise e a máquina de estados de atualização. **A instalação real do `.exe` no Windows precisa ser validada após o build da Release.**
- Os instaladores distribuídos não possuem **assinatura de código**; o Windows SmartScreen pode exibir um aviso. Baixe somente pelas Releases oficiais e confira os hashes quando disponíveis.

## Documentação

| Documento | Conteúdo |
| --- | --- |
| [Instalação](docs/INSTALACAO.md) | Windows, portable, desenvolvimento, erros comuns. |
| [Guia de uso](docs/GUIA-DE-USO.md) | Do código à análise passo a passo. |
| [Arquitetura](docs/ARQUITETURA.md) | Lexer/Parser, IPC, estados e segurança. |
| [Algoritmo comentado](docs/COMENTARIOS-ALGORITMO.md) | Explicações das etapas e invariantes do SLR(1). |
| [Atualizações](docs/ATUALIZACOES.md) | Releases, CI, `latest.yml` e atualização NSIS. |
| [Contexto acadêmico](docs/CONTEXTO-ACADEMICO.md) | Proposta, participantes, limitações e avaliação. |
| [Histórico de versões](CHANGELOG.md) | Evolução e mudanças relevantes. |

---

<div align="center">

**MiniPascal** — um projeto acadêmico para tornar o funcionamento dos analisadores léxico e sintático mais visível, verificável e compreensível.

[Repositório](https://github.com/LuuizV/MiniPascalParser-Didatico) · [Releases](https://github.com/LuuizV/MiniPascalParser-Didatico/releases) · [GitHub Actions](https://github.com/LuuizV/MiniPascalParser-Didatico/actions)

</div>

# MiniPascal Studio — Electron (v5.0.0)

Ambiente visual de análise léxica e sintática SLR(1), refeito em **Electron + HTML/CSS + JavaScript puro**. Não usa Swing, Java ou Python para executar. A gramática da versão Java anterior permanece a mesma.

## Instalação no Windows

Requisitos para **desenvolvimento**: Node.js LTS e npm. No terminal da pasta do projeto:

```powershell
npm install
npm start
```

Para criar o executável Windows (sem exigir Node no computador de destino):

```powershell
npm run dist:win
```

Os arquivos serão gerados em `dist/` (portable e/ou instalador). O GitHub Actions também executa os testes, gera o **instalador e a versão portátil Windows x64** e, após uma compilação bem-sucedida, anexa os `.exe` à [Release v5.0.0](https://github.com/LuuizV/MiniPascalParser-Didatico/releases/tag/v5.0.0). Os executáveis ainda não possuem assinatura de código, portanto o Windows pode exibir um aviso do SmartScreen.

## Como usar

1. Escreva um programa MiniPascal no editor, ou escolha um dos seis exemplos na barra lateral.
2. Clique em **Analisar código** (`Ctrl+Enter`).
3. Use **Simulador** para percorrer a pilha, o terminal, a entrada e as operações SHIFT/REDUCE/ACCEPT.
4. Abra **Tokens** para inspecionar os lexemas e suas posições, **Gramática** para navegar por produções, FIRST/FOLLOW, estados LR(0) e ACTION/GOTO, **Árvore** para reconstruir as reduções, ou **Erros** para examinar os diagnósticos.
5. Navegue pela linha do tempo com os controles ou reproduza automaticamente as etapas. Use **Apresentação** para ampliar a bancada.
6. `Ctrl+O` abre arquivo; `Ctrl+S` salva o código; a ação **Exportar análise** salva o relatório textual.

## Arquitetura

```
src/
  core.cjs         Lexer + gerador FIRST/FOLLOW/LR(0)/SLR(1) + Parser (Node)
  grammar.json     71 produções extraídas fielmente da implementação Java
  main.cjs         Janela Electron, diálogos nativos e IPC validado
  preload.cjs      API de contexto isolado
  index.html       Interface da bancada
  style.css        Design responsivo de tema escuro
  renderer.js      Editor, tokens, pilha, árvore e simulação
```

O núcleo usa somente JavaScript com dados locais. A interface carrega apenas arquivos do próprio aplicativo. A opção `nodeIntegration` está desabilitada, `contextIsolation` e `sandbox` estão habilitados; ações nativas passam por IPC restrito. Nenhuma fonte de rede nem CDN é necessária em execução.

## Testes

```powershell
npm run check
npm test
```

O comparador de regressão foi elaborado a partir do teste de mesa **do Parser Java v4.0.0**: 130 estados, 71 produções, 611 passos nos seis arquivos do Parser, com o mesmo histórico de pilha, entrada e ação e os mesmos resultados. A comparação dos textos normaliza caracteres acentuados para `?`, pois o terminal Java usado para gerar o baseline não preservou acentuação; os textos são mantidos corretamente em UTF-8 na versão Electron. Cinco exemplos léxicos também são exercitados. Incluímos um teste específico para fotografias de pilha antes da recuperação de erros.

## Limitações

- A gramática utilizada é a **Mini_Pascal do Parser fornecido**, e **não** a gramática Sigma integral descrita no PDF do trabalho.
- Não interpreta nem executa os programas; realiza análise léxica e sintática.
- A árvore exibida é de **derivação concreta**. Após erro com recuperação, a árvore permanece parcial.
- O diagrama dos estados é local e navegável; não representa os 130 estados simultaneamente.
- Os testes Node.js validam o núcleo e o histórico de análise. O workflow Windows valida a compilação dos executáveis; a execução interativa do aplicativo em um computador Windows ainda requer verificação manual.

Consulte [AGENTS.md](AGENTS.md) para as regras de desenvolvimento. A base Java original e o histórico anterior podem ser recuperados do arquivo `.bundle` fornecido na entrega anterior; esta versão constitui um novo frontend e núcleo JavaScript.

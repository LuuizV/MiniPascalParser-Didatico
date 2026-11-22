# Instalação e execução

[← Página principal](../README.md) · [Guia de uso](GUIA-DE-USO.md)

## Windows x64

1. Visite [Releases](https://github.com/LuuizV/MiniPascalParser-Didatico/releases/latest).
2. Baixe o arquivo **Setup** para instalar no Windows e receber atualizações pelo próprio programa; ou **Portable** para usar sem instalação e atualizar manualmente.
3. Execute o arquivo `.exe`. Na primeira abertura, escolha um programa de exemplo na lateral.
4. Clique em **Analisar código** (`Ctrl+Enter`).

O executável distribuído **não depende de Java, Python ou Node.js**. Os pacotes ainda não são assinados digitalmente; o SmartScreen pode exibir avisos. Verifique a origem e, quando disponível, o hash SHA256 indicado na Release.

### Verificar o SHA256 no PowerShell

```powershell
Get-FileHash .\MiniPascal-Studio-Setup-5.1.0-x64.exe -Algorithm SHA256
```

Compare com a linha correspondente em `SHA256SUMS.txt`, ajustando o nome para o arquivo efetivamente baixado.

## Desenvolvedores

Instale Node.js 22+ e npm. Na raiz do projeto:

```bash
npm install
npm run check
npm test
npm start
```

Para gerar o instalador no Windows: `npm run dist:win`.

## Solução de problemas

- **Nenhum .exe publicado:** consulte a execução [Windows no Actions](https://github.com/LuuizV/MiniPascalParser-Didatico/actions/workflows/build-windows.yml).
- **Atualização indisponível:** confirme conexão, Release publicada e arquivo `latest.yml`.
- **Portable não instala atualização:** é esperado. Baixe um novo portátil na Release.
- **Código não salvo antes de atualizar:** o aplicativo solicita salvamento antes de reiniciar.
- **SmartScreen:** a distribuição não está assinada. Confira procedência e integridade.

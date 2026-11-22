# Atualizações e publicação de Releases

[← Página principal](../README.md)

## Como funciona para o usuário

A partir da **v5.1.0**, o instalador **NSIS** consulta periodicamente? **Não:** a consulta é feita na abertura e sob comando do usuário. Caso exista nova versão estável, o painel oferece **Baixar** e depois **Instalar e reiniciar**. A instalação depende de confirmação e salva alterações pendentes do editor.

A edição **Portable** pode abrir a página oficial de Releases, mas sua atualização é manual. A **v5.0.0** precisa ser substituída manualmente pela **v5.1.0** para habilitar o mecanismo.

## Publicar nova versão

1. Atualize `version` em `package.json` (por exemplo, `5.2.0`) e escreva as mudanças em `CHANGELOG.md`.
2. Execute `npm run check` e `npm test`.
3. Envie o commit para `main`.
4. O workflow Windows testa e compila, gerando o instalador, o portátil e o **`latest.yml`**.
5. A nova Release recebe os executáveis e `SHA256SUMS.txt`. Verifique-os em [Releases](https://github.com/LuuizV/MiniPascalParser-Didatico/releases).
6. Valide a atualização entre versões instaladas em um computador Windows.

O workflow não substitui Releases de versões já publicadas. Para novas alterações, incremente a versão. A publicação utiliza `GITHUB_TOKEN` do Actions e provider GitHub no `electron-builder`.

## Artefatos de atualização

- **Setup .exe (NSIS):** instalador elegível a auto-update.
- **Portable .exe:** atualização manual.
- **latest.yml:** metadados e hashes do feed de atualização.
- **.blockmap:** download diferencial, quando disponível.
- **SHA256SUMS.txt:** integridade dos arquivos para verificação independente.

## Limitações

As Releases precisam ser públicas e não estar em modo draft para serem encontradas pelo updater. Os executáveis não possuem assinatura digital. O fluxo de atualização tem testes unitários simulados; instalação e atualização real no Windows devem ser validadas após a compilação.

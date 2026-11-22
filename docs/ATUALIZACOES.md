# Atualizações automáticas e publicação de Releases

[← Início](../README.md) · [Instalação](INSTALACAO.md)

## Experiência do usuário

A partir da **v5.1.0**, o programa Windows instalado por **NSIS** consulta a Release estável do repositório oficial. Se houver atualização, o usuário pode **baixar**, acompanhar o progresso e clicar em **Instalar e reiniciar**. A instalação só é iniciada após confirmação; alterações não salvas devem ser gravadas antes do encerramento.

**Importante:** quem já executa **v5.0.0** não receberá essa funcionalidade retroativamente. Deve instalar manualmente a **v5.1.0** uma vez. A versão **Portable** continua exigindo download manual da nova Release.

## Publicação segura a partir da v5.2.0

As Releases são preparadas como **rascunho**, não visível ao `electron-updater`, até que compilação, instalador NSIS, Portable, `.blockmap`, manifesto `latest.yml` e SHA256 tenham sido verificados no GitHub. Só então o workflow publica a versão como estável. Isso evita exibir uma Release parcialmente enviada.

Se um aplicativo antigo recebeu `Cannot find latest.yml` e HTTP 404, clique em **Tentar novamente** após a Release terminar de publicar. Na v5.1.2, esse erro dá origem a duas novas tentativas automáticas com intervalo crescente, em vez de expor uma exceção técnica ao usuário. O Portable continua manual.

Antes de iniciar outra versão, leia o [Plano Mestre](PLANO-MESTRE.md), registre os bloqueadores e siga seu checklist de aceite.

## Como publicar a próxima versão

1. Atualize o campo `version` de `package.json` (por exemplo, `5.2.0`) e o [CHANGELOG](../CHANGELOG.md).
2. Valide `npm run check` e `npm test`.
3. Envie as alterações para `main`.
4. O workflow **Windows · instalador, portátil e Release** executa os testes e, se ainda não existir Release para essa versão, compila e publica o instalador, o portátil e **`latest.yml`**.
5. Confira a [Release](https://github.com/LuuizV/MiniPascalParser-Didatico/releases), verifique os `.exe`, `latest.yml` e `SHA256SUMS.txt`.
6. Instale manualmente a versão anterior e teste a detecção, o download e o reinício para a versão nova em uma máquina Windows de testes.

**Política de versão:** as Releases existentes são tratadas como imutáveis. Para publicar novas alterações, incremente `package.json` ao invés de substituir executáveis de uma versão antiga.

## Artefatos esperados

| Arquivo | Função |
|---|---|
| `MiniPascal-Studio-Setup-X.Y.Z-x64.exe` | Instalador NSIS elegível ao auto-update. |
| `MiniPascal-Studio-Portable-X.Y.Z-x64.exe` | Versão sem instalação, atualizada manualmente. |
| `latest.yml` | Feed de versão e hashes reconhecido pelo `electron-updater`. |
| `*.blockmap` | Suporte a download diferencial, quando produzido. |
| `SHA256SUMS.txt` | Hashes públicos para conferência manual dos executáveis. |

O projeto usa `electron-builder` com provider `github`, owner `LuuizV`, repo `MiniPascalParser-Didatico`. O workflow publica via token temporário `GITHUB_TOKEN` do GitHub Actions; **não armazene tokens pessoais no código**.

## Limitações e segurança

- O instalador não é assinado digitalmente. O Windows pode apresentar alerta do SmartScreen. Avaliar assinatura de código antes de distribuição ampliada.
- O updater verifica os metadados e hashes, mas a cadeia de confiança é mais robusta quando há assinatura do aplicativo e dos artefatos.
- As Releases precisam estar publicadas (não em *draft*) e conter manifesto válido para que o provedor de atualização encontre a versão nova.
- O pipeline compila em Windows x64 e publica artefatos; **é necessária uma validação manual de instalação e atualização real no Windows** antes de considerar a funcionalidade verificada em produção.
- Em caso de erro de rede, o usuário recebe uma mensagem e pode tentar novamente, sem bloquear o Lexer ou o Parser.

## Política de mudanças acumuladas

Não publicar commits ou Releases por pedido isolado. Reunir solicitações, revisar o [Plano Mestre](PLANO-MESTRE.md) e autorizar explicitamente a implementação consolidada. A versão v5.2.0 mantém a publicação como rascunho até a validação do `latest.yml`, blockmap e dos executáveis.

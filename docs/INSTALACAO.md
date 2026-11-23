# Instalação e execução

[← Início](../README.md) · [Guia de uso](GUIA-DE-USO.md) · [Atualizações](ATUALIZACOES.md)

## Usuários Windows x64

Acesse **[Releases](https://github.com/LuuizV/MiniPascalParser-Didatico/releases/latest)**. Existem duas distribuições:

| Pacote | Finalidade | Atualizações |
|---|---|---|
| `MiniPascal-Setup-<versão>-x64.exe` | Instalação no usuário do Windows, com atalhos. | Pelo próprio programa, com confirmação. |
| `MiniPascal-Portable-<versão>-x64.exe` | Uso sem instalação permanente. | Substituição manual pela Release mais recente. |

1. Baixe um dos arquivos na Release mais recente.
2. Execute o arquivo `.exe`. No instalador, siga as etapas apresentadas pelo Windows.
3. Na primeira abertura, carregue um exemplo na barra lateral ou crie um programa.
4. Pressione **Ctrl + Enter** para analisar.

> **Segurança:** o executável ainda não é assinado digitalmente. O Windows pode mostrar aviso do SmartScreen. Confira a procedência da Release e, se disponível, compare o SHA256 ao arquivo `SHA256SUMS.txt` publicado junto ao instalador. O aviso não prova que o programa é seguro ou inseguro por si só.

### Validação de integridade

No PowerShell, na pasta do arquivo baixado:

```powershell
Get-FileHash .\MiniPascal-Setup-5.3.0-x64.exe -Algorithm SHA256
```

Compare o resultado com a linha correspondente de `SHA256SUMS.txt`. Ajuste o nome para a versão efetivamente baixada.

## Desenvolvimento (Windows, Linux e macOS)

Requisitos: Node.js 22+ e npm. Execute na pasta do projeto:

```bash
npm install
npm run check
npm test
npm start
```

O modo de desenvolvimento **não instala atualizações**; apresenta apenas um atalho para a página oficial de Releases. Para gerar um pacote Windows em um computador Windows:

```bash
npm run dist:win
```

Para uso final do instalador Windows, Node.js, Python e Java **não são necessários**.

## Solução de problemas

**Apareceu “Não é possível verificar atualizações”?** Confira a conexão de rede, se a Release não é rascunho e se contém `latest.yml`. Consulte [Atualizações](ATUALIZACOES.md).

**Estou usando o portátil e não aparece “Instalar”?** É esperado. O pacote Portable não oferece auto-update no local. Abra a Release mais recente e baixe uma nova cópia.

**Windows avisou sobre aplicativo desconhecido.** A distribuição ainda não está assinada digitalmente; valide a origem e os hashes antes de prosseguir.

**Não existe `.exe` na Release.** Verifique a execução do workflow [Windows](https://github.com/LuuizV/MiniPascalParser-Didatico/actions/workflows/build-windows.yml). A compilação pode não ter terminado ou pode ter falhado.

**O aplicativo fecha durante atualização.** A instalação do NSIS exige encerramento. Salve o arquivo antes de confirmar; o editor solicitará isso quando houver mudanças pendentes.

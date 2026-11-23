# Contexto acadêmico e créditos

[← Início](../README.md)

**Instituição:** Universidade Estadual do Sudoeste da Bahia — Ciência da Computação  
**Disciplina:** Compiladores (2026.2)  
**Professor:** José Carlos Martins Oliveira

**Integrantes:** Luiz Vicente Gomes Jirardi, Raimundo José Santiago Netto e Jader Levi Nascimento Abreu Azevedo.

## Escopo

O trabalho de 2026.2 utiliza a linguagem Mini_Pascal. Na primeira unidade, o analisador léxico deve identificar tokens e gerar um arquivo texto com pares `<cadeia, token>`. A segunda unidade pede análise sintática SLR(1) e análise semântica, com resultado `OK` ou erros indicando a linha.

O MiniPascal inclui Lexer, Parser SLR(1), simulador de pilha, árvore de derivação e diagnósticos de erro. Seu núcleo é executado em Java e a interface usa Electron.

## Verificações

A gramática implementada possui 71 produções e 130 estados LR(0). Seis programas de regressão resultam em 611 operações SLR(1), preservando os resultados do núcleo anterior. Outros testes verificam tokens, erros e a comunicação Java/Electron.

## Limitações

O aplicativo **não executa os programas** e não realiza análise semântica completa. Nem todas as construções mencionadas na visão geral lexical de Mini_Pascal constam da gramática sintática fornecida; a implementação preserva as regras do analisador existente. É necessária validação manual de instalação e atualização em Windows.

Os resultados automatizados demonstram a compatibilidade dos casos testados, não a correção para todas as entradas possíveis. A documentação acadêmica final precisa descrever essas limitações fielmente.

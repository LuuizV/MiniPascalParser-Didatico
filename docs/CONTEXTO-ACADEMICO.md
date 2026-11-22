# Contexto acadêmico

[← Página principal](../README.md)

**Instituição:** Universidade Estadual do Sudoeste da Bahia (UESB)  
**Departamento:** Departamento de Ciências Exatas (DCET)  
**Curso:** Ciência da Computação  
**Disciplina:** Compiladores  
**Professor:** **José Carlos Martins Oliveira**

## Estudantes participantes

- **Luiz Vicente Gomes Jirardi**
- **Raimundo José Santiago Netto**
- **Jader Levi Nascimento Abreu Azevedo**

## Objetivo da atividade

O enunciado da segunda unidade solicita a implementação de um analisador sintático utilizando **SLR(1)**, integrado ao analisador léxico produzido anteriormente, com documentação, testes e mensagens esclarecedoras. O MiniPascal Studio amplia a observação do Lexer e do Parser com simulação interativa, pilha, gramática e estados.

## O que foi implementado

Lexer integrado, Parser SLR(1), tabelas ACTION/GOTO, FIRST/FOLLOW, estados LR(0), diagnóstico de erros, árvore de derivação e interface desktop Electron. A suíte documenta 71 produções, 130 estados e 611 passos de regressão nos seis programas-base.

## O que não foi implementado

Não há interpretação, execução de programas ou geração de código de máquina. A gramática preservada do Parser é **Mini_Pascal** e **não** cobre integralmente a linguagem **Sigma** da especificação do professor. A árvore pode ficar parcial após recuperação de erro; o Windows e o instalador precisam de validação prática.

## Avaliação técnica

A manutenção dos históricos de teste oferece evidência de compatibilidade com a implementação Java para as entradas verificadas. A visualização passo a passo facilita a apresentação e o estudo do algoritmo, mas não substitui a validação para outras entradas ou a revisão da gramática.

As contribuições são creditadas ao grupo, sem atribuição individual de funções não documentadas.

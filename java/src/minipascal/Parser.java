package minipascal;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

public final class Parser {
    private static final int LIMITE_PASSOS = 20000;
    private static final Set<String> SINCRONIZADORES = new HashSet<String>(
            Arrays.asList(";", "end", "else", ".", "$"));

    private final Grammar grammar;
    private final SLRTable tabela;

    public Parser() {
        this.grammar = Grammar.miniPascal();
        this.tabela = new SLRTable(grammar);
    }

    public Grammar getGrammar() {
        return grammar;
    }
    public SLRTable getTabela() {
        return tabela;
    }

    public ParseResult analisar(String fonte) {
        // ETAPA 1 - Léxico: usa diretamente a mesma classe Lexer da primeira
        // unidade. Guardamos EOF internamente porque o SLR precisa do símbolo $.
        Lexer lexer = new Lexer(fonte);
        List<Token> tokens = new ArrayList<Token>();
        Token t;
        do {
            t = lexer.proximoToken();
            tokens.add(t);
        } while (t.getTipo() != TokenType.EOF);

        List<LexicalError> errosLexicos = new ArrayList<LexicalError>(lexer.getErros());
        List<SyntaxError> errosSintaticos = new ArrayList<SyntaxError>();
        List<ParseTrace> passos = new ArrayList<ParseTrace>();

        // Um token desconhecido também constitui erro léxico. Se houver qualquer
        // erro léxico, não é seguro atribuir significado sintático ao fluxo.
        if (!errosLexicos.isEmpty()) {
            return new ParseResult(removerEOF(tokens), errosLexicos,
                    errosSintaticos, passos, false);
        }

        // ETAPA 2 - Sintático: só inicia se todos os tokens forem léxicos válidos.
        // A pilha de estados começa em 0, e a de símbolos começa vazia.
        List<Integer> pilhaEstados = new ArrayList<Integer>();
        List<String> pilhaSimbolos = new ArrayList<String>();
        pilhaEstados.add(Integer.valueOf(0));

        int entrada = 0;
        int passo = 1;
        boolean aceitou = false;

        while (passo <= LIMITE_PASSOS && entrada < tokens.size()) {
            Token lookahead = tokens.get(entrada);
            String terminal = ParserTokenMapper.terminal(lookahead);
            int estado = topo(pilhaEstados);
            ParserAction acao = tabela.getAction(estado, terminal);

            // Erro: ACTION[estado, terminal] não possui transição válida.
            if (acao == null) {
                List<String> esperados = nomesAmigaveis(tabela.esperados(estado));
                String encontrado = lookahead.getTipo() == TokenType.EOF
                        ? "fim do arquivo" : lookahead.getLexema();
                String mensagem = "símbolo inesperado '" + encontrado + "'";
                if (!esperados.isEmpty()) {
                    mensagem += ". Esperado: " + juntar(esperados, ", ");
                }
                errosSintaticos.add(new SyntaxError(
                        lookahead.getLinha(), lookahead.getColuna(), encontrado,
                        esperados, mensagem));

                // Mantém os textos e a foto da pilha ANTES de tentar recuperar.
                String pilhaAntes = formatarPilha(pilhaEstados, pilhaSimbolos);
                String entradaAntes = formatarEntrada(tokens, entrada);
                List<Integer> estadosAntes = new ArrayList<Integer>(pilhaEstados);
                List<String> simbolosAntes = new ArrayList<String>(pilhaSimbolos);
                int novaEntrada = recuperar(tokens, entrada, pilhaEstados, pilhaSimbolos);
                passos.add(new ParseTrace(passo++, pilhaAntes, entradaAntes,
                        "ERRO - " + mensagem,
                        new ParseStep(entrada, lookahead, terminal, estado, ParseStep.Kind.ERROR,
                                -1, -1, -1, -1, estadosAntes, simbolosAntes, novaEntrada,
                                estadosAntes.size() - pilhaEstados.size())));
                if (novaEntrada < 0) break;
                entrada = novaEntrada;
                continue;
            }

            // SHIFT: empilha o terminal lido e o estado de destino.
            if (acao.getKind() == ParserAction.Kind.SHIFT) {
                passos.add(new ParseTrace(passo++, formatarPilha(pilhaEstados, pilhaSimbolos),
                        formatarEntrada(tokens, entrada),
                        "SHIFT para estado " + acao.getValue() + " com '" + nomeAmigavel(terminal) + "'",
                        fotografar(entrada, lookahead, terminal, estado, ParseStep.Kind.SHIFT,
                                acao.getValue(), -1, -1, -1, pilhaEstados, pilhaSimbolos)));
                pilhaSimbolos.add(terminal);
                pilhaEstados.add(Integer.valueOf(acao.getValue()));
                entrada++;
                continue;
            }

            // REDUCE: substitui a parte direita por seu não terminal e aplica GOTO.
            if (acao.getKind() == ParserAction.Kind.REDUCE) {
                Production p = grammar.getProducoes().get(acao.getValue());
                // Consulta de GOTO determinada pela pilha que ficará após retirar beta.
                int n = p.getDireita().size();
                int origem = pilhaEstados.get(pilhaEstados.size() - 1 - n).intValue();
                Integer gotoDestino = tabela.getGoto(origem, p.getEsquerda());
                passos.add(new ParseTrace(passo++, formatarPilha(pilhaEstados, pilhaSimbolos),
                        formatarEntrada(tokens, entrada), "REDUCE por [" + p.getId() + "] " + p,
                        fotografar(entrada, lookahead, terminal, estado, ParseStep.Kind.REDUCE,
                                -1, p.getId(), origem, gotoDestino == null ? -1 : gotoDestino.intValue(),
                                pilhaEstados, pilhaSimbolos)));

                for (int k = 0; k < n; k++) {
                    if (!pilhaSimbolos.isEmpty()) pilhaSimbolos.remove(pilhaSimbolos.size() - 1);
                    if (pilhaEstados.size() > 1) pilhaEstados.remove(pilhaEstados.size() - 1);
                }

                int estadoAnterior = topo(pilhaEstados);
                Integer destino = tabela.getGoto(estadoAnterior, p.getEsquerda());
                if (destino == null) {
                    throw new IllegalStateException("GOTO ausente após redução " + p
                            + " a partir do estado " + estadoAnterior);
                }
                pilhaSimbolos.add(p.getEsquerda());
                pilhaEstados.add(destino);
                continue;
            }

            // ACCEPT: a produção aumentada foi reconhecida até o fim do arquivo.
            passos.add(new ParseTrace(passo++, formatarPilha(pilhaEstados, pilhaSimbolos),
                    formatarEntrada(tokens, entrada), "ACCEPT",
                    fotografar(entrada, lookahead, terminal, estado, ParseStep.Kind.ACCEPT,
                            -1, -1, -1, -1, pilhaEstados, pilhaSimbolos)));
            aceitou = true;
            break;
        }

        if (passo > LIMITE_PASSOS) {
            Token ultimo = tokens.get(Math.min(entrada, tokens.size() - 1));
            errosSintaticos.add(new SyntaxError(ultimo.getLinha(), ultimo.getColuna(),
                    ultimo.getLexema(), Collections.<String>emptyList(),
                    "análise interrompida: limite interno de passos excedido"));
        }

        boolean ok = aceitou && errosSintaticos.isEmpty();
        return new ParseResult(removerEOF(tokens), errosLexicos, errosSintaticos, passos, ok);
    }

    private int recuperar(List<Token> tokens, int entrada,
                          List<Integer> estados, List<String> simbolos) {
        int i = entrada;
        while (i < tokens.size()) {
            String terminal = ParserTokenMapper.terminal(tokens.get(i));
            int estado = topo(estados);

            if (tabela.getAction(estado, terminal) != null) {
                return i;
            }

            if (SINCRONIZADORES.contains(terminal)) {
                while (estados.size() > 1 && tabela.getAction(topo(estados), terminal) == null) {
                    estados.remove(estados.size() - 1);
                    if (!simbolos.isEmpty()) simbolos.remove(simbolos.size() - 1);
                }
                if (tabela.getAction(topo(estados), terminal) != null) {
                    return i;
                }
            }

            // EOF não pode ser descartado.
            if ("$".equals(terminal)) return -1;
            i++;
        }
        return -1;
    }

    private static ParseStep fotografar(int indice, Token token, String terminal, int estado,
            ParseStep.Kind tipo, int shift, int producao, int origemGoto, int destinoGoto,
            List<Integer> estados, List<String> simbolos) {
        return new ParseStep(indice, token, terminal, estado, tipo, shift,
                producao, origemGoto, destinoGoto, estados, simbolos);
    }

    private static int topo(List<Integer> estados) {
        return estados.get(estados.size() - 1).intValue();
    }

    private static List<Token> removerEOF(List<Token> tokens) {
        List<Token> r = new ArrayList<Token>();
        for (Token t : tokens) {
            if (t.getTipo() != TokenType.EOF) r.add(t);
        }
        return r;
    }

    private static String formatarPilha(List<Integer> estados, List<String> simbolos) {
        StringBuilder sb = new StringBuilder();
        sb.append(estados.get(0));
        for (int i = 0; i < simbolos.size(); i++) {
            sb.append(' ').append(simbolos.get(i)).append(' ');
            if (i + 1 < estados.size()) sb.append(estados.get(i + 1));
        }
        return sb.toString();
    }

    private static String formatarEntrada(List<Token> tokens, int inicio) {
        StringBuilder sb = new StringBuilder();
        int max = Math.min(tokens.size(), inicio + 8);
        for (int i = inicio; i < max; i++) {
            if (i > inicio) sb.append(' ');
            String term = ParserTokenMapper.terminal(tokens.get(i));
            if ("ID".equals(term) || "NUM".equals(term) || "STR".equals(term)
                    || "CHAR_CONST".equals(term)) {
                sb.append(tokens.get(i).getLexema());
            } else {
                sb.append(term);
            }
        }
        if (max < tokens.size()) sb.append(" ...");
        return sb.toString();
    }

    private static List<String> nomesAmigaveis(Set<String> terminais) {
        List<String> r = new ArrayList<String>();
        for (String t : terminais) r.add(nomeAmigavel(t));
        Collections.sort(r);
        return r;
    }

    private static String nomeAmigavel(String terminal) {
        if ("ID".equals(terminal)) return "identificador";
        if ("NUM".equals(terminal)) return "número";
        if ("STR".equals(terminal)) return "constante string";
        if ("CHAR_CONST".equals(terminal)) return "constante caractere";
        if ("$".equals(terminal)) return "fim do arquivo";
        return "'" + terminal + "'";
    }

    private static String juntar(List<String> itens, String sep) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < itens.size(); i++) {
            if (i > 0) sb.append(sep);
            sb.append(itens.get(i));
        }
        return sb.toString();
    }
}

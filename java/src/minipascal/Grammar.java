package minipascal;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public final class Grammar {
    private final List<Production> producoes = new ArrayList<Production>();
    private final Set<String> naoTerminais = new LinkedHashSet<String>();
    private final Set<String> terminais = new LinkedHashSet<String>();
    private final String inicialAumentado;

    private Grammar(String inicialAumentado) {
        this.inicialAumentado = inicialAumentado;
    }

    public static Grammar miniPascal() {
        Grammar g = new Grammar("S'");

        // 0 - produção aumentada.
        g.add("S'", "PROG");

        g.add("PROG", "program ID ; BLOCO .");
        g.add("BLOCO", "SECOES_VAR PROCEDIMENTOS begin LISTA_COMANDOS end");

        g.add("SECOES_VAR", "");
        g.add("SECOES_VAR", "var LISTA_DECL SECOES_VAR");

        g.add("LISTA_DECL", "DECL LISTA_DECL_TAIL");
        g.add("LISTA_DECL_TAIL", "");
        g.add("LISTA_DECL_TAIL", "DECL LISTA_DECL_TAIL");
        g.add("DECL", "LISTA_ID : TIPO ;");
        g.add("LISTA_ID", "ID LISTA_ID_TAIL");
        g.add("LISTA_ID_TAIL", "");
        g.add("LISTA_ID_TAIL", ", ID LISTA_ID_TAIL");

        g.add("TIPO", "integer");
        g.add("TIPO", "real");
        g.add("TIPO", "char");
        g.add("TIPO", "string");

        g.add("PROCEDIMENTOS", "");
        g.add("PROCEDIMENTOS", "procedure ID PALIST ; BLOCO ; PROCEDIMENTOS");

        g.add("PALIST", "");
        g.add("PALIST", "( LISTA_PARAM )");
        g.add("LISTA_PARAM", "PARAM LISTA_PARAM_TAIL");
        g.add("LISTA_PARAM_TAIL", "");
        g.add("LISTA_PARAM_TAIL", "; PARAM LISTA_PARAM_TAIL");
        g.add("PARAM", "OPT_VAR LISTA_ID : TIPO");
        g.add("OPT_VAR", "");
        g.add("OPT_VAR", "var");

        g.add("LISTA_COMANDOS", "COMANDO ; LISTA_COMANDOS_TAIL");
        g.add("LISTA_COMANDOS_TAIL", "");
        g.add("LISTA_COMANDOS_TAIL", "COMANDO ; LISTA_COMANDOS_TAIL");

        // Forma não ambígua para IF/ELSE (elimina o dangling else).
        g.add("COMANDO", "MATCHED");
        g.add("COMANDO", "OPEN");

        g.add("MATCHED", "ID COMANDO_ID_TAIL");
        g.add("MATCHED", "if EXPR then MATCHED else MATCHED");
        g.add("MATCHED", "while EXPR do MATCHED");
        g.add("MATCHED", "begin LISTA_COMANDOS end");

        g.add("OPEN", "if EXPR then COMANDO");
        g.add("OPEN", "if EXPR then MATCHED else OPEN");
        g.add("OPEN", "while EXPR do OPEN");

        // Um identificador no início de comando pode ser variável (atribuição)
        // ou nome de procedimento/chamada.
        g.add("COMANDO_ID_TAIL", ":= EXPR");
        g.add("COMANDO_ID_TAIL", "");
        g.add("COMANDO_ID_TAIL", "( LISTA_EXPR )");

        g.add("LISTA_EXPR", "EXPR LISTA_EXPR_TAIL");
        g.add("LISTA_EXPR_TAIL", "");
        g.add("LISTA_EXPR_TAIL", ", EXPR LISTA_EXPR_TAIL");

        g.add("EXPR", "SIEXPR EXPR_TAIL");
        g.add("EXPR_TAIL", "");
        g.add("EXPR_TAIL", "OP_REL SIEXPR");
        g.add("OP_REL", "=");
        g.add("OP_REL", "<");
        g.add("OP_REL", ">");
        g.add("OP_REL", "<>");
        g.add("OP_REL", "<=");
        g.add("OP_REL", ">=");

        // O enunciado apresenta aspas vazias onde semanticamente há '-'.
        g.add("SIEXPR", "OPT_SIGN TERMO SIEXPR_TAIL");
        g.add("OPT_SIGN", "");
        g.add("OPT_SIGN", "+");
        g.add("OPT_SIGN", "-");
        g.add("SIEXPR_TAIL", "");
        g.add("SIEXPR_TAIL", "+ TERMO SIEXPR_TAIL");
        g.add("SIEXPR_TAIL", "- TERMO SIEXPR_TAIL");

        g.add("TERMO", "FATOR TERMO_TAIL");
        g.add("TERMO_TAIL", "");
        g.add("TERMO_TAIL", "* FATOR TERMO_TAIL");
        g.add("TERMO_TAIL", "/ FATOR TERMO_TAIL");
        g.add("TERMO_TAIL", "div FATOR TERMO_TAIL");
        g.add("TERMO_TAIL", "mod FATOR TERMO_TAIL");

        g.add("FATOR", "NUM");
        g.add("FATOR", "ID");
        g.add("FATOR", "( EXPR )");
        g.add("FATOR", "STR");
        g.add("FATOR", "CHAR_CONST");

        g.finalizarSimbolos();
        return g;
    }

    private void add(String esquerda, String direita) {
        naoTerminais.add(esquerda);
        List<String> rhs;
        if (direita == null || direita.trim().isEmpty()) {
            rhs = Collections.emptyList();
        } else {
            rhs = Arrays.asList(direita.trim().split("\\s+"));
        }
        producoes.add(new Production(producoes.size(), esquerda, rhs));
    }

    private void finalizarSimbolos() {
        for (Production p : producoes) {
            for (String s : p.getDireita()) {
                if (!naoTerminais.contains(s)) {
                    terminais.add(s);
                }
            }
        }
        terminais.add("$");
    }

    public List<Production> getProducoes() {
        return Collections.unmodifiableList(producoes);
    }

    public Set<String> getNaoTerminais() {
        return Collections.unmodifiableSet(naoTerminais);
    }

    public Set<String> getTerminais() {
        return Collections.unmodifiableSet(terminais);
    }

    public String getInicialAumentado() {
        return inicialAumentado;
    }
}

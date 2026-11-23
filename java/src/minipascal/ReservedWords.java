package minipascal;

import java.util.Collections;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

public final class ReservedWords {
    private static final Set<String> PALAVRAS;

    static {
        Set<String> p = new HashSet<String>();
        // Extensão de integração: PROCEDURE é necessário para a gramática do Parser.
        String[] itens = {
            "ABSOLUTE", "ARRAY", "BEGIN", "CASE", "CHAR", "CONST", "DIV", "DO",
            "DOWTO", "ELSE", "END", "EXTERNAL", "FILE", "FOR", "FORWARD", "FUNC",
            "FUNCTION", "GOTO", "IF", "IMPLEMENTATION", "INTEGER", "INTERFACE",
            "INTERRUPT", "LABEL", "MAIN", "NIL", "NIT", "OF", "PACKED", "PROC",
            "PROCEDURE", "PROGRAM", "REAL", "RECORD", "REPEAT", "SET", "SHL", "SHR", "STRING",
            "THEN", "TO", "TYPE", "UNIT", "UNTIL", "USES", "VAR", "WHILE", "WITH", "XOR"
        };
        Collections.addAll(p, itens);
        PALAVRAS = Collections.unmodifiableSet(p);
    }

    private ReservedWords() {
    }

    public static boolean contem(String lexema) {
        return PALAVRAS.contains(lexema.toUpperCase(Locale.ROOT));
    }

    public static Set<String> todas() {
        return PALAVRAS;
    }
}

package minipascal;

import java.util.Locale;

public final class ParserTokenMapper {
    private ParserTokenMapper() {
    }

    public static String terminal(Token token) {
        if (token.getTipo() == TokenType.EOF) return "$";

        String lexema = token.getLexema();
        String lower = lexema.toLowerCase(Locale.ROOT);

        switch (token.getTipo()) {
            case IDENTIFICADOR:
                // Correção de integração: a gramática usa literalmente "procedure",
                // embora a lista léxica original não a tenha incluído.
                if ("procedure".equals(lower)) return "procedure";
                return "ID";

            case PALAVRA_RESERVADA:
                return lower;

            case NUMERO_INTEIRO:
            case NUMERO_REAL:
                return "NUM";

            case CONSTANTE_STRING:
                return "STR";

            case CONSTANTE_CARACTERE:
                return "CHAR_CONST";

            case OPERADOR_ARITMETICO:
            case OPERADOR_RELACIONAL:
            case OPERADOR_LOGICO:
            case SIMBOLO_ESPECIAL:
            case ATRIBUICAO:
            case FIM:
                return lower;

            case DESCONHECIDO:
                return "DESCONHECIDO";

            default:
                return lower;
        }
    }
}

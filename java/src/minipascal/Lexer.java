package minipascal;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;

public final class Lexer {
    private enum Estado {
        INICIAL,

        IDENTIFICADOR,

        INTEIRO,

        REAL_FRACAO,

        EXPOENTE_INICIO,

        EXPOENTE_SINAL,

        EXPOENTE_DIGITOS
    }

    private final String fonte;

    private int posicao;

    private int linha;

    private int coluna;

    private final List<LexicalError> erros = new ArrayList<LexicalError>();

    public Lexer(String fonte) {
        this.fonte = fonte == null ? "" : fonte;
        this.posicao = 0;
        this.linha = 1;
        this.coluna = 1;
    }

    public List<LexicalError> getErros() {
        return Collections.unmodifiableList(erros);
    }

    public Token proximoToken() {
        ignorarNaoSignificativos();

        if (fim()) {
            return new Token("", TokenType.EOF, linha, coluna);
        }

        final int linhaInicio = linha;
        final int colunaInicio = coluna;
        char c = atual();

        // Identificadores, palavras reservadas e operadores escritos por extenso.
        if (ehLetraAscii(c)) {
            return lerPalavra(linhaInicio, colunaInicio);
        }

        // Números inteiros e reais.
        if (ehDigito(c)) {
            return lerNumero(linhaInicio, colunaInicio);
        }

        // Constante string delimitada por aspas duplas.
        if (c == '"') {
            return lerString(linhaInicio, colunaInicio);
        }

        // Constante caractere delimitada por aspas simples.
        if (c == '\'') {
            return lerCaractere(linhaInicio, colunaInicio);
        }

        // Operadores e símbolos de um ou dois caracteres.
        switch (c) {
            case '+':
            case '-':
            case '*':
                avancar();
                return new Token(String.valueOf(c), TokenType.OPERADOR_ARITMETICO, linhaInicio, colunaInicio);

            case '/':
                // Comentários /* ... */ já foram tratados em ignorarNaoSignificativos().
                avancar();
                return new Token("/", TokenType.OPERADOR_ARITMETICO, linhaInicio, colunaInicio);

            case ':':
                avancar();
                if (!fim() && atual() == '=') {
                    avancar();
                    return new Token(":=", TokenType.ATRIBUICAO, linhaInicio, colunaInicio);
                }
                return new Token(":", TokenType.SIMBOLO_ESPECIAL, linhaInicio, colunaInicio);

            case '>':
                avancar();
                if (!fim() && atual() == '=') {
                    avancar();
                    return new Token(">=", TokenType.OPERADOR_RELACIONAL, linhaInicio, colunaInicio);
                }
                return new Token(">", TokenType.OPERADOR_RELACIONAL, linhaInicio, colunaInicio);

            case '<':
                avancar();
                if (!fim() && atual() == '=') {
                    avancar();
                    return new Token("<=", TokenType.OPERADOR_RELACIONAL, linhaInicio, colunaInicio);
                }
                if (!fim() && atual() == '>') {
                    avancar();
                    return new Token("<>", TokenType.OPERADOR_RELACIONAL, linhaInicio, colunaInicio);
                }
                return new Token("<", TokenType.OPERADOR_RELACIONAL, linhaInicio, colunaInicio);

            case '=':
                // O enunciado também repete '=' em Símbolo Especial. Para manter
                // uma classificação determinística, damos prioridade à classe relacional.
                avancar();
                return new Token("=", TokenType.OPERADOR_RELACIONAL, linhaInicio, colunaInicio);

            case '(':
            case ')':
            case ',':
            case ';':
                avancar();
                return new Token(String.valueOf(c), TokenType.SIMBOLO_ESPECIAL, linhaInicio, colunaInicio);

            case '.':
                avancar();
                return new Token(".", TokenType.FIM, linhaInicio, colunaInicio);

            default:
                avancar();
                String desconhecido = String.valueOf(c);
                registrarErro(linhaInicio, colunaInicio, desconhecido,
                        "símbolo desconhecido");
                return new Token(desconhecido, TokenType.DESCONHECIDO, linhaInicio, colunaInicio);
        }
    }

    public List<Token> analisarTudo() {
        List<Token> tokens = new ArrayList<Token>();
        Token token;
        do {
            token = proximoToken();
            if (token.getTipo() != TokenType.EOF) {
                tokens.add(token);
            }
        } while (token.getTipo() != TokenType.EOF);
        return tokens;
    }

    private Token lerPalavra(int linhaInicio, int colunaInicio) {
        StringBuilder sb = new StringBuilder();
        Estado estado = Estado.IDENTIFICADOR;

        while (!fim() && estado == Estado.IDENTIFICADOR) {
            char c = atual();
            if (ehLetraAscii(c) || ehDigito(c) || c == '_') {
                sb.append(c);
                avancar();
            } else {
                estado = Estado.INICIAL;
            }
        }

        String lexema = sb.toString();
        String normalizado = lexema.toLowerCase(Locale.ROOT);

        // As classes mais específicas têm prioridade sobre identificador/reservada.
        if ("and".equals(normalizado) || "or".equals(normalizado) || "not".equals(normalizado)) {
            return new Token(lexema, TokenType.OPERADOR_LOGICO, linhaInicio, colunaInicio);
        }
        if ("mod".equals(normalizado)) {
            return new Token(lexema, TokenType.OPERADOR_ARITMETICO, linhaInicio, colunaInicio);
        }
        if (ReservedWords.contem(lexema)) {
            return new Token(lexema, TokenType.PALAVRA_RESERVADA, linhaInicio, colunaInicio);
        }
        return new Token(lexema, TokenType.IDENTIFICADOR, linhaInicio, colunaInicio);
    }

    private Token lerNumero(int linhaInicio, int colunaInicio) {
        StringBuilder sb = new StringBuilder();
        Estado estado = Estado.INTEIRO;
        boolean real = false;

        while (!fim()) {
            char c = atual();

            switch (estado) {
                case INTEIRO:
                    if (ehDigito(c)) {
                        sb.append(c);
                        avancar();
                    } else if (c == '.' && ehDigito(proximo(1))) {
                        real = true;
                        sb.append(c);
                        avancar();
                        estado = Estado.REAL_FRACAO;
                    } else {
                        return new Token(sb.toString(), TokenType.NUMERO_INTEIRO,
                                linhaInicio, colunaInicio);
                    }
                    break;

                case REAL_FRACAO:
                    if (ehDigito(c)) {
                        sb.append(c);
                        avancar();
                    } else if (c == 'e' || c == 'E') {
                        sb.append(c);
                        avancar();
                        estado = Estado.EXPOENTE_INICIO;
                    } else {
                        return new Token(sb.toString(), TokenType.NUMERO_REAL,
                                linhaInicio, colunaInicio);
                    }
                    break;

                case EXPOENTE_INICIO:
                    if (c == '+' || c == '-') {
                        sb.append(c);
                        avancar();
                        estado = Estado.EXPOENTE_SINAL;
                    } else if (ehDigito(c)) {
                        sb.append(c);
                        avancar();
                        estado = Estado.EXPOENTE_DIGITOS;
                    } else {
                        registrarErro(linhaInicio, colunaInicio, sb.toString(),
                                "expoente incompleto em número real");
                        return new Token(sb.toString(), TokenType.DESCONHECIDO,
                                linhaInicio, colunaInicio);
                    }
                    break;

                case EXPOENTE_SINAL:
                    if (ehDigito(c)) {
                        sb.append(c);
                        avancar();
                        estado = Estado.EXPOENTE_DIGITOS;
                    } else {
                        registrarErro(linhaInicio, colunaInicio, sb.toString(),
                                "era esperado um dígito após o sinal do expoente");
                        return new Token(sb.toString(), TokenType.DESCONHECIDO,
                                linhaInicio, colunaInicio);
                    }
                    break;

                case EXPOENTE_DIGITOS:
                    if (ehDigito(c)) {
                        sb.append(c);
                        avancar();
                    } else {
                        return new Token(sb.toString(), TokenType.NUMERO_REAL,
                                linhaInicio, colunaInicio);
                    }
                    break;

                default:
                    throw new IllegalStateException("Estado numérico inesperado: " + estado);
            }
        }

        if (estado == Estado.EXPOENTE_INICIO || estado == Estado.EXPOENTE_SINAL) {
            registrarErro(linhaInicio, colunaInicio, sb.toString(),
                    "expoente incompleto em número real");
            return new Token(sb.toString(), TokenType.DESCONHECIDO,
                    linhaInicio, colunaInicio);
        }

        return new Token(sb.toString(), real ? TokenType.NUMERO_REAL : TokenType.NUMERO_INTEIRO,
                linhaInicio, colunaInicio);
    }

    private Token lerString(int linhaInicio, int colunaInicio) {
        StringBuilder sb = new StringBuilder();
        sb.append(atual());
        avancar(); // abre aspas

        while (!fim()) {
            char c = atual();
            if (c == '"') {
                sb.append(c);
                avancar();
                return new Token(sb.toString(), TokenType.CONSTANTE_STRING,
                        linhaInicio, colunaInicio);
            }
            if (c == '\n' || c == '\r') {
                registrarErro(linhaInicio, colunaInicio, sb.toString(),
                        "constante string não terminada antes do fim da linha");
                return new Token(sb.toString(), TokenType.DESCONHECIDO,
                        linhaInicio, colunaInicio);
            }
            sb.append(c);
            avancar();
        }

        registrarErro(linhaInicio, colunaInicio, sb.toString(),
                "constante string não terminada antes do fim do arquivo");
        return new Token(sb.toString(), TokenType.DESCONHECIDO, linhaInicio, colunaInicio);
    }

    private Token lerCaractere(int linhaInicio, int colunaInicio) {
        StringBuilder sb = new StringBuilder();
        sb.append(atual());
        avancar(); // abre aspas simples

        if (fim() || atual() == '\n' || atual() == '\r') {
            registrarErro(linhaInicio, colunaInicio, sb.toString(),
                    "constante caractere não terminada");
            return new Token(sb.toString(), TokenType.DESCONHECIDO, linhaInicio, colunaInicio);
        }

        // Um caractere exatamente entre aspas simples.
        char conteudo = atual();
        sb.append(conteudo);
        avancar();

        if (!fim() && atual() == '\'') {
            sb.append(atual());
            avancar();
            return new Token(sb.toString(), TokenType.CONSTANTE_CARACTERE,
                    linhaInicio, colunaInicio);
        }

        // Recuperação: consome até aspas, quebra de linha ou EOF.
        while (!fim() && atual() != '\'' && atual() != '\n' && atual() != '\r') {
            sb.append(atual());
            avancar();
        }
        if (!fim() && atual() == '\'') {
            sb.append(atual());
            avancar();
        }

        registrarErro(linhaInicio, colunaInicio, sb.toString(),
                "constante caractere deve conter exatamente um caractere entre aspas simples");
        return new Token(sb.toString(), TokenType.DESCONHECIDO, linhaInicio, colunaInicio);
    }

    private void ignorarNaoSignificativos() {
        boolean repetiu;
        do {
            repetiu = false;

            while (!fim() && ehEspaco(atual())) {
                avancar();
                repetiu = true;
            }

            if (!fim() && atual() == '/' && proximo(1) == '*') {
                int linhaInicio = linha;
                int colunaInicio = coluna;
                StringBuilder comentario = new StringBuilder();
                comentario.append('/');
                avancar();
                comentario.append('*');
                avancar();

                boolean fechado = false;
                while (!fim()) {
                    if (atual() == '*' && proximo(1) == '/') {
                        comentario.append('*');
                        avancar();
                        comentario.append('/');
                        avancar();
                        fechado = true;
                        break;
                    }
                    comentario.append(atual());
                    avancar();
                }

                if (!fechado) {
                    registrarErro(linhaInicio, colunaInicio, resumir(comentario.toString()),
                            "comentário de bloco não terminado antes do fim do arquivo");
                }
                repetiu = true;
            }
        } while (repetiu);
    }

    private String resumir(String texto) {
        if (texto.length() <= 30) {
            return texto;
        }
        return texto.substring(0, 27) + "...";
    }

    private void registrarErro(int linhaErro, int colunaErro, String lexema, String mensagem) {
        erros.add(new LexicalError(linhaErro, colunaErro, lexema, mensagem));
    }

    private boolean fim() {
        return posicao >= fonte.length();
    }

    private char atual() {
        return fonte.charAt(posicao);
    }

    private char proximo(int deslocamento) {
        int i = posicao + deslocamento;
        return i >= 0 && i < fonte.length() ? fonte.charAt(i) : '\0';
    }

    private void avancar() {
        if (fim()) {
            return;
        }

        char c = fonte.charAt(posicao++);
        if (c == '\r') {
            // Trata CRLF como uma única quebra de linha.
            if (!fim() && fonte.charAt(posicao) == '\n') {
                posicao++;
            }
            linha++;
            coluna = 1;
        } else if (c == '\n') {
            linha++;
            coluna = 1;
        } else {
            coluna++;
        }
    }

    private static boolean ehLetraAscii(char c) {
        return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
    }

    private static boolean ehDigito(char c) {
        return c >= '0' && c <= '9';
    }

    private static boolean ehEspaco(char c) {
        return c == ' ' || c == '\t' || c == '\n' || c == '\r' || c == '\f';
    }
}

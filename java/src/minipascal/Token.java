package minipascal;

public final class Token {
    private final String lexema;

    private final TokenType tipo;

    private final int linha;

    private final int coluna;

    public Token(String lexema, TokenType tipo, int linha, int coluna) {
        this.lexema = lexema;
        this.tipo = tipo;
        this.linha = linha;
        this.coluna = coluna;
    }

    public String getLexema() {
        return lexema;
    }

    public TokenType getTipo() {
        return tipo;
    }

    public int getLinha() {
        return linha;
    }

    public int getColuna() {
        return coluna;
    }

    public String comoPar() {
        return "<" + lexema + ", " + tipo.getDescricao() + ">";
    }

    @Override
    public String toString() {
        return comoPar() + " [linha " + linha + ", coluna " + coluna + "]";
    }
}

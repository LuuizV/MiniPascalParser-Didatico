package minipascal;

public final class LexicalError {
    private final int linha;

    private final int coluna;

    private final String lexema;

    private final String mensagem;

    public LexicalError(int linha, int coluna, String lexema, String mensagem) {
        this.linha = linha;
        this.coluna = coluna;
        this.lexema = lexema;
        this.mensagem = mensagem;
    }

    public int getLinha() {
        return linha;
    }

    public int getColuna() {
        return coluna;
    }

    public String getLexema() {
        return lexema;
    }

    public String getMensagem() {
        return mensagem;
    }

    @Override
    public String toString() {
        return "Linha " + linha + ", coluna " + coluna + ": " + mensagem
                + (lexema == null || lexema.isEmpty() ? "" : " [" + lexema + "]");
    }
}

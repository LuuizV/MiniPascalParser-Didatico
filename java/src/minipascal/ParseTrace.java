package minipascal;

public final class ParseTrace {
    private final int passo;
    private final String pilha;
    private final String entrada;
    private final String acao;

    private final ParseStep detalhes;

    public ParseTrace(int passo, String pilha, String entrada, String acao) {
        this(passo, pilha, entrada, acao, null);
    }

    public ParseTrace(int passo, String pilha, String entrada, String acao, ParseStep detalhes) {
        this.detalhes = detalhes;
        this.passo = passo;
        this.pilha = pilha;
        this.entrada = entrada;
        this.acao = acao;
    }

    public int getPasso() {
        return passo;
    }
    public String getPilha() {
        return pilha;
    }
    public String getEntrada() {
        return entrada;
    }
    public String getAcao() {
        return acao;
    }

    public ParseStep getDetalhes() { return detalhes; }
}

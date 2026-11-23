package minipascal;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class SyntaxError {
    private final int linha;
    private final int coluna;
    private final String encontrado;
    private final List<String> esperados;
    private final String mensagem;

    public SyntaxError(int linha, int coluna, String encontrado,
                       List<String> esperados, String mensagem) {
        this.linha = linha;
        this.coluna = coluna;
        this.encontrado = encontrado;
        this.esperados = Collections.unmodifiableList(new ArrayList<String>(esperados));
        this.mensagem = mensagem;
    }

    public int getLinha() {
        return linha;
    }
    public int getColuna() {
        return coluna;
    }
    public String getEncontrado() {
        return encontrado;
    }
    public List<String> getEsperados() {
        return esperados;
    }
    public String getMensagem() {
        return mensagem;
    }

    @Override
    public String toString() {
        return "Linha " + linha + ", coluna " + coluna + ": " + mensagem;
    }
}

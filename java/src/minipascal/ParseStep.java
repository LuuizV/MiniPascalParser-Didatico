package minipascal;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class ParseStep {
    public enum Kind { SHIFT, REDUCE, ACCEPT, ERROR }

    private final int indiceToken;
    private final Token token;
    private final String terminal;
    private final int estado;
    private final Kind tipo;
    private final int destinoShift;
    private final int producao;
    private final int origemGoto;
    private final int destinoGoto;
    private final List<Integer> estados;
    private final List<String> simbolos;
    private final int indiceRetomada;
    private final int estadosRemovidos;

    public ParseStep(int indiceToken, Token token, String terminal, int estado, Kind tipo,
                     int destinoShift, int producao, int origemGoto, int destinoGoto,
                     List<Integer> estados, List<String> simbolos) {
        this(indiceToken, token, terminal, estado, tipo, destinoShift, producao,
                origemGoto, destinoGoto, estados, simbolos, -1, 0);
    }

    public ParseStep(int indiceToken, Token token, String terminal, int estado, Kind tipo,
                     int destinoShift, int producao, int origemGoto, int destinoGoto,
                     List<Integer> estados, List<String> simbolos, int indiceRetomada,
                     int estadosRemovidos) {
        this.indiceRetomada = indiceRetomada;
        this.estadosRemovidos = estadosRemovidos;
        this.indiceToken = indiceToken;
        this.token = token;
        this.terminal = terminal;
        this.estado = estado;
        this.tipo = tipo;
        this.destinoShift = destinoShift;
        this.producao = producao;
        this.origemGoto = origemGoto;
        this.destinoGoto = destinoGoto;
        this.estados = Collections.unmodifiableList(new ArrayList<Integer>(estados));
        this.simbolos = Collections.unmodifiableList(new ArrayList<String>(simbolos));
    }

    public int getIndiceToken() { return indiceToken; }
    public Token getToken() { return token; }
    public String getTerminal() { return terminal; }
    public int getEstado() { return estado; }
    public Kind getTipo() { return tipo; }
    public int getDestinoShift() { return destinoShift; }
    public int getProducao() { return producao; }
    public int getOrigemGoto() { return origemGoto; }
    public int getDestinoGoto() { return destinoGoto; }
    public List<Integer> getEstados() { return estados; }
    public List<String> getSimbolos() { return simbolos; }
    public int getIndiceRetomada() { return indiceRetomada; }
    public int getEstadosRemovidos() { return estadosRemovidos; }
}

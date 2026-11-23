package minipascal;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class ParseResult {
    private final List<Token> tokens;
    private final List<LexicalError> errosLexicos;
    private final List<SyntaxError> errosSintaticos;
    private final List<ParseTrace> passos;
    private final boolean aceito;

    public ParseResult(List<Token> tokens,
                       List<LexicalError> errosLexicos,
                       List<SyntaxError> errosSintaticos,
                       List<ParseTrace> passos,
                       boolean aceito) {
        this.tokens = Collections.unmodifiableList(new ArrayList<Token>(tokens));
        this.errosLexicos = Collections.unmodifiableList(new ArrayList<LexicalError>(errosLexicos));
        this.errosSintaticos = Collections.unmodifiableList(new ArrayList<SyntaxError>(errosSintaticos));
        this.passos = Collections.unmodifiableList(new ArrayList<ParseTrace>(passos));
        this.aceito = aceito;
    }

    public List<Token> getTokens() {
        return tokens;
    }
    public List<LexicalError> getErrosLexicos() {
        return errosLexicos;
    }
    public List<SyntaxError> getErrosSintaticos() {
        return errosSintaticos;
    }
    public List<ParseTrace> getPassos() {
        return passos;
    }
    public boolean isAceito() {
        return aceito;
    }
}

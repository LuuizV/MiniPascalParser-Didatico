package minipascal;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Protocolo JSON entre o aplicativo Electron e o analisador Java. */
public final class Bridge {
    private static final Parser PARSER = new Parser();

    private Bridge() { }

    private static Map<String, Object> object(Object... pairs) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < pairs.length; i += 2) m.put((String)pairs[i], pairs[i + 1]);
        return m;
    }

    private static Map<String, Object> token(Token t) {
        return object("lexema", t.getLexema(), "tipo", t.getTipo().name(),
                "descricao", t.getTipo().getDescricao(), "linha", t.getLinha(),
                "coluna", t.getColuna(), "terminal", ParserTokenMapper.terminal(t));
    }

    private static Object parseResult(String source) {
        ParseResult r = PARSER.analisar(source);
        List<Object> tokens = new ArrayList<>(), lexical = new ArrayList<>(), syntax = new ArrayList<>(), steps = new ArrayList<>();
        for (Token t : r.getTokens()) tokens.add(token(t));
        for (LexicalError e : r.getErrosLexicos()) {
            lexical.add(object("linha",e.getLinha(), "coluna",e.getColuna(),
                    "lexema",e.getLexema(), "mensagem",e.getMensagem()));
        }
        for (SyntaxError e : r.getErrosSintaticos()) {
            syntax.add(object("linha",e.getLinha(), "coluna",e.getColuna(),
                    "encontrado",e.getEncontrado(), "esperados",e.getEsperados(), "mensagem",e.getMensagem()));
        }
        for (ParseTrace t : r.getPassos()) {
            ParseStep d = t.getDetalhes();
            steps.add(object("passo",t.getPasso(), "pilha",t.getPilha(), "entrada",t.getEntrada(),
                    "acao",t.getAcao(), "detalhes",object(
                    "indiceToken",d.getIndiceToken(), "token",token(d.getToken()),
                    "terminal",d.getTerminal(), "estado",d.getEstado(), "tipo",d.getTipo().name(),
                    "destinoShift",d.getDestinoShift(), "producao",d.getProducao(),
                    "origemGoto",d.getOrigemGoto(), "destinoGoto",d.getDestinoGoto(),
                    "estados",d.getEstados(), "simbolos",d.getSimbolos(),
                    "indiceRetomada",d.getIndiceRetomada(), "estadosRemovidos",d.getEstadosRemovidos())));
        }
        return object("tokens",tokens,"errosLexicos",lexical,"errosSintaticos",syntax,
                "passos",steps,"aceito",r.isAceito(),"estados",PARSER.getTabela().getQuantidadeEstados());
    }

    private static Object grammar() {
        List<Object> productions = new ArrayList<>();
        for (Production p : PARSER.getGrammar().getProducoes()) {
            productions.add(object("id",p.getId(),"lhs",p.getEsquerda(),"rhs",p.getDireita()));
        }
        return object("productions",productions,"statesCount",PARSER.getTabela().getQuantidadeEstados());
    }

    public static void main(String[] args) throws Exception {
        try {
            BufferedReader in = new BufferedReader(new InputStreamReader(System.in, StandardCharsets.UTF_8));
            String request = in.readLine();
            if (request == null || request.length() > 2_000_000) throw new IllegalArgumentException("Requisição inválida.");
            Map<String,String> data = Json.readRequest(request);
            String op=data.get("op");
            Object result;
            if ("grammar".equals(op)) result=grammar();
            else if ("analyze".equals(op)) result=parseResult(data.getOrDefault("source", ""));
            else throw new IllegalArgumentException("Operação desconhecida.");
            System.out.write((Json.stringify(object("ok",true,"result",result))+"\n").getBytes(StandardCharsets.UTF_8));
            System.out.flush();
        } catch (Exception e) {
            String message = e.getMessage();
            if (message == null || message.isBlank()) message="Falha na análise.";
            System.out.write((Json.stringify(object("ok",false,"error",message))+"\n").getBytes(StandardCharsets.UTF_8));
            System.out.flush();
            System.exit(1);
        }
    }
}

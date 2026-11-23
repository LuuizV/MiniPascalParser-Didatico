package minipascal;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Deque;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

public final class SLRTable {
    private final Grammar grammar;
    private final Map<String, List<Integer>> producoesPorEsquerda = new HashMap<String, List<Integer>>();
    private final Map<String, Set<String>> first = new LinkedHashMap<String, Set<String>>();
    private final Set<String> nullable = new LinkedHashSet<String>();
    private final Map<String, Set<String>> follow = new LinkedHashMap<String, Set<String>>();

    private final List<Set<LR0Item>> estados = new ArrayList<Set<LR0Item>>();
    private final Map<Integer, Map<String, Integer>> transicoes = new LinkedHashMap<Integer, Map<String, Integer>>();
    private final Map<Integer, Map<String, ParserAction>> action = new LinkedHashMap<Integer, Map<String, ParserAction>>();
    private final Map<Integer, Map<String, Integer>> goTo = new LinkedHashMap<Integer, Map<String, Integer>>();

    public SLRTable(Grammar grammar) {
        this.grammar = grammar;
        indexarProducoes();
        calcularFirstNullable();
        calcularFollow();
        construirColecaoCanonica();
        construirTabelas();
    }

    private void indexarProducoes() {
        for (Production p : grammar.getProducoes()) {
            List<Integer> ids = producoesPorEsquerda.get(p.getEsquerda());
            if (ids == null) {
                ids = new ArrayList<Integer>();
                producoesPorEsquerda.put(p.getEsquerda(), ids);
            }
            ids.add(p.getId());
        }
    }

    private void calcularFirstNullable() {
        for (String nt : grammar.getNaoTerminais()) {
            first.put(nt, new LinkedHashSet<String>());
        }

        boolean mudou;
        do {
            mudou = false;
            for (Production p : grammar.getProducoes()) {
                String a = p.getEsquerda();
                List<String> rhs = p.getDireita();

                if (rhs.isEmpty()) {
                    if (nullable.add(a)) mudou = true;
                    continue;
                }

                boolean todosNullable = true;
                for (String x : rhs) {
                    if (grammar.getNaoTerminais().contains(x)) {
                        int antes = first.get(a).size();
                        first.get(a).addAll(first.get(x));
                        if (first.get(a).size() != antes) mudou = true;
                        if (!nullable.contains(x)) {
                            todosNullable = false;
                            break;
                        }
                    } else {
                        if (first.get(a).add(x)) mudou = true;
                        todosNullable = false;
                        break;
                    }
                }
                if (todosNullable && nullable.add(a)) mudou = true;
            }
        } while (mudou);
    }

    private void calcularFollow() {
        for (String nt : grammar.getNaoTerminais()) {
            follow.put(nt, new LinkedHashSet<String>());
        }
        follow.get(grammar.getInicialAumentado()).add("$");

        boolean mudou;
        do {
            mudou = false;
            for (Production p : grammar.getProducoes()) {
                List<String> rhs = p.getDireita();
                for (int i = 0; i < rhs.size(); i++) {
                    String b = rhs.get(i);
                    if (!grammar.getNaoTerminais().contains(b)) continue;

                    FirstSeq resultado = firstDaSequencia(rhs, i + 1);
                    int antes = follow.get(b).size();
                    follow.get(b).addAll(resultado.terminais);
                    if (resultado.nullable) {
                        follow.get(b).addAll(follow.get(p.getEsquerda()));
                    }
                    if (follow.get(b).size() != antes) mudou = true;
                }
            }
        } while (mudou);
    }

    private FirstSeq firstDaSequencia(List<String> seq, int inicio) {
        Set<String> resultado = new LinkedHashSet<String>();
        boolean tudoNullable = true;
        for (int i = inicio; i < seq.size(); i++) {
            String x = seq.get(i);
            if (grammar.getNaoTerminais().contains(x)) {
                resultado.addAll(first.get(x));
                if (!nullable.contains(x)) {
                    tudoNullable = false;
                    break;
                }
            } else {
                resultado.add(x);
                tudoNullable = false;
                break;
            }
        }
        return new FirstSeq(resultado, tudoNullable);
    }

    private Set<LR0Item> fechamento(Set<LR0Item> base) {
        TreeSet<LR0Item> resultado = new TreeSet<LR0Item>(base);
        Deque<LR0Item> fila = new ArrayDeque<LR0Item>(resultado);

        while (!fila.isEmpty()) {
            LR0Item item = fila.removeFirst();
            Production p = grammar.getProducoes().get(item.getProducao());
            if (item.getPonto() >= p.getDireita().size()) continue;

            String x = p.getDireita().get(item.getPonto());
            if (!grammar.getNaoTerminais().contains(x)) continue;

            List<Integer> ids = producoesPorEsquerda.get(x);
            if (ids == null) continue;
            for (Integer id : ids) {
                LR0Item novo = new LR0Item(id.intValue(), 0);
                if (resultado.add(novo)) {
                    fila.addLast(novo);
                }
            }
        }
        return Collections.unmodifiableSet(new LinkedHashSet<LR0Item>(resultado));
    }

    private Set<LR0Item> irPara(Set<LR0Item> estado, String simbolo) {
        Set<LR0Item> movidos = new LinkedHashSet<LR0Item>();
        for (LR0Item item : estado) {
            Production p = grammar.getProducoes().get(item.getProducao());
            if (item.getPonto() < p.getDireita().size()
                    && simbolo.equals(p.getDireita().get(item.getPonto()))) {
                movidos.add(new LR0Item(item.getProducao(), item.getPonto() + 1));
            }
        }
        if (movidos.isEmpty()) return Collections.emptySet();
        return fechamento(movidos);
    }

    private void construirColecaoCanonica() {
        Set<LR0Item> inicial = new LinkedHashSet<LR0Item>();
        inicial.add(new LR0Item(0, 0));
        inicial = fechamento(inicial);

        estados.add(inicial);
        Map<Set<LR0Item>, Integer> indice = new HashMap<Set<LR0Item>, Integer>();
        indice.put(inicial, Integer.valueOf(0));
        Deque<Integer> fila = new ArrayDeque<Integer>();
        fila.add(Integer.valueOf(0));

        TreeSet<String> simbolos = new TreeSet<String>();
        simbolos.addAll(grammar.getTerminais());
        simbolos.remove("$");
        simbolos.addAll(grammar.getNaoTerminais());

        while (!fila.isEmpty()) {
            int i = fila.removeFirst().intValue();
            Map<String, Integer> linha = new LinkedHashMap<String, Integer>();
            transicoes.put(Integer.valueOf(i), linha);

            for (String x : simbolos) {
                Set<LR0Item> j = irPara(estados.get(i), x);
                if (j.isEmpty()) continue;

                Integer existente = indice.get(j);
                if (existente == null) {
                    existente = Integer.valueOf(estados.size());
                    estados.add(j);
                    indice.put(j, existente);
                    fila.addLast(existente);
                }
                linha.put(x, existente);
            }
        }
    }

    private void construirTabelas() {
        for (int i = 0; i < estados.size(); i++) {
            action.put(Integer.valueOf(i), new LinkedHashMap<String, ParserAction>());
            goTo.put(Integer.valueOf(i), new LinkedHashMap<String, Integer>());
        }

        for (int i = 0; i < estados.size(); i++) {
            Set<LR0Item> itens = estados.get(i);
            for (LR0Item item : itens) {
                Production p = grammar.getProducoes().get(item.getProducao());

                if (item.getPonto() < p.getDireita().size()) {
                    String x = p.getDireita().get(item.getPonto());
                    Integer destino = transicao(i, x);
                    if (destino == null) continue;

                    if (grammar.getTerminais().contains(x) && !"$".equals(x)) {
                        colocarAction(i, x, ParserAction.shift(destino.intValue()));
                    } else if (grammar.getNaoTerminais().contains(x)) {
                        goTo.get(Integer.valueOf(i)).put(x, destino);
                    }
                } else {
                    if (p.getId() == 0) {
                        colocarAction(i, "$", ParserAction.accept());
                    } else {
                        Set<String> lookaheads = follow.get(p.getEsquerda());
                        for (String a : lookaheads) {
                            colocarAction(i, a, ParserAction.reduce(p.getId()));
                        }
                    }
                }
            }
        }
    }

    private Integer transicao(int estado, String simbolo) {
        Map<String, Integer> linha = transicoes.get(Integer.valueOf(estado));
        return linha == null ? null : linha.get(simbolo);
    }

    private void colocarAction(int estado, String terminal, ParserAction nova) {
        Map<String, ParserAction> linha = action.get(Integer.valueOf(estado));
        ParserAction antiga = linha.get(terminal);
        if (antiga != null && !antiga.equals(nova)) {
            throw new IllegalStateException(
                    "Conflito SLR no estado " + estado + ", terminal '" + terminal
                            + "': " + antiga + " x " + nova);
        }
        linha.put(terminal, nova);
    }

    public ParserAction getAction(int estado, String terminal) {
        Map<String, ParserAction> linha = action.get(Integer.valueOf(estado));
        return linha == null ? null : linha.get(terminal);
    }

    public Integer getGoto(int estado, String naoTerminal) {
        Map<String, Integer> linha = goTo.get(Integer.valueOf(estado));
        return linha == null ? null : linha.get(naoTerminal);
    }

    public Set<String> esperados(int estado) {
        Map<String, ParserAction> linha = action.get(Integer.valueOf(estado));
        if (linha == null) return Collections.emptySet();
        TreeSet<String> ordenados = new TreeSet<String>(linha.keySet());
        return Collections.unmodifiableSet(ordenados);
    }

    public int getQuantidadeEstados() {
        return estados.size();
    }

    public Grammar getGrammar() {
        return grammar;
    }

    public Map<String, Set<String>> getFollow() {
        Map<String, Set<String>> copia = new LinkedHashMap<String, Set<String>>();
        List<String> nts = new ArrayList<String>(follow.keySet());
        Collections.sort(nts);
        for (String nt : nts) {
            copia.put(nt, Collections.unmodifiableSet(new TreeSet<String>(follow.get(nt))));
        }
        return Collections.unmodifiableMap(copia);
    }

    public Map<String, Set<String>> getFirst() {
        Map<String, Set<String>> copia = new LinkedHashMap<String, Set<String>>();
        for (String nt : new TreeSet<String>(first.keySet())) {
            copia.put(nt, Collections.unmodifiableSet(new TreeSet<String>(first.get(nt))));
        }
        return Collections.unmodifiableMap(copia);
    }

    public Map<String, ParserAction> getAcoes(int estado) {
        Map<String, ParserAction> linha = action.get(Integer.valueOf(estado));
        if (linha == null) return Collections.emptyMap();
        return Collections.unmodifiableMap(new LinkedHashMap<String, ParserAction>(linha));
    }

    public Map<String, Integer> getDesvios(int estado) {
        Map<String, Integer> linha = goTo.get(Integer.valueOf(estado));
        if (linha == null) return Collections.emptyMap();
        return Collections.unmodifiableMap(new LinkedHashMap<String, Integer>(linha));
    }

    public Map<String, Integer> getTransicoes(int estado) {
        Map<String, Integer> linha = transicoes.get(Integer.valueOf(estado));
        if (linha == null) return Collections.emptyMap();
        return Collections.unmodifiableMap(new LinkedHashMap<String, Integer>(linha));
    }

    public String descreverEstado(int estado) {
        if (estado < 0 || estado >= estados.size()) return "";
        List<LR0Item> itens = new ArrayList<LR0Item>(estados.get(estado));
        Collections.sort(itens, new Comparator<LR0Item>() {
            @Override public int compare(LR0Item a, LR0Item b) { return a.compareTo(b); }
        });
        StringBuilder sb = new StringBuilder();
        for (LR0Item item : itens) {
            Production p = grammar.getProducoes().get(item.getProducao());
            sb.append('[').append(p.getId()).append("] ").append(p.getEsquerda()).append(" -> ");
            for (int i = 0; i <= p.getDireita().size(); i++) {
                if (i == item.getPonto()) sb.append(". ");
                if (i < p.getDireita().size()) sb.append(p.getDireita().get(i)).append(' ');
            }
            sb.append('\n');
        }
        return sb.toString();
    }

    private static final class FirstSeq {
        private final Set<String> terminais;
        private final boolean nullable;
        private FirstSeq(Set<String> terminais, boolean nullable) {
            this.terminais = terminais;
            this.nullable = nullable;
        }
    }
}

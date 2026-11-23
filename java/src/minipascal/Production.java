package minipascal;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class Production {
    private final int id;
    private final String esquerda;
    private final List<String> direita;

    public Production(int id, String esquerda, List<String> direita) {
        this.id = id;
        this.esquerda = esquerda;
        this.direita = Collections.unmodifiableList(new ArrayList<String>(direita));
    }

    public int getId() {
        return id;
    }
    public String getEsquerda() {
        return esquerda;
    }
    public List<String> getDireita() {
        return direita;
    }

    public boolean ehEpsilon() {
        return direita.isEmpty();
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append(esquerda).append(" -> ");
        if (direita.isEmpty()) {
            sb.append("epsilon");
        } else {
            for (int i = 0; i < direita.size(); i++) {
                if (i > 0) sb.append(' ');
                sb.append(direita.get(i));
            }
        }
        return sb.toString();
    }
}

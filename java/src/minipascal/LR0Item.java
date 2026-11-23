package minipascal;

public final class LR0Item implements Comparable<LR0Item> {
    private final int producao;
    private final int ponto;

    public LR0Item(int producao, int ponto) {
        this.producao = producao;
        this.ponto = ponto;
    }

    public int getProducao() {
        return producao;
    }
    public int getPonto() {
        return ponto;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof LR0Item)) return false;
        LR0Item other = (LR0Item) o;
        return producao == other.producao && ponto == other.ponto;
    }

    @Override
    public int hashCode() {
        return 31 * producao + ponto;
    }

    @Override
    public int compareTo(LR0Item o) {
        int c = Integer.compare(producao, o.producao);
        return c != 0 ? c : Integer.compare(ponto, o.ponto);
    }
}

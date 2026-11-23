package minipascal;

public final class ParserAction {
    public enum Kind { SHIFT, REDUCE, ACCEPT }

    private final Kind kind;
    private final int value;

    private ParserAction(Kind kind, int value) {
        this.kind = kind;
        this.value = value;
    }

    public static ParserAction shift(int estado) {
        return new ParserAction(Kind.SHIFT, estado);
    }
    public static ParserAction reduce(int producao) {
        return new ParserAction(Kind.REDUCE, producao);
    }
    public static ParserAction accept() {
        return new ParserAction(Kind.ACCEPT, -1);
    }

    public Kind getKind() {
        return kind;
    }
    public int getValue() {
        return value;
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof ParserAction)) return false;
        ParserAction a = (ParserAction) o;
        return kind == a.kind && value == a.value;
    }

    @Override
    public int hashCode() {
        return 31 * kind.hashCode() + value;
    }

    @Override
    public String toString() {
        switch (kind) {
            case SHIFT: return "s" + value;
            case REDUCE: return "r" + value;
            default: return "acc";
        }
    }
}

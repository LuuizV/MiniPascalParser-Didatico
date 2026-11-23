package minipascal;

public enum TokenType {
    PALAVRA_RESERVADA("Palavra reservada"),

    IDENTIFICADOR("Identificador"),

    NUMERO_INTEIRO("Número inteiro"),

    NUMERO_REAL("Número real"),

    OPERADOR_ARITMETICO("Operador aritmético"),

    OPERADOR_RELACIONAL("Operador relacional"),

    OPERADOR_LOGICO("Operador lógico"),

    SIMBOLO_ESPECIAL("Símbolo especial"),

    ATRIBUICAO("Atribuição"),

    FIM("Fim"),

    CONSTANTE_CARACTERE("Constante caractere"),

    CONSTANTE_STRING("Constante string"),

    DESCONHECIDO("Desconhecido"),

    EOF("EOF");

    private final String descricao;

    TokenType(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}

package minipascal;

import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.Map;

/** Codificação JSON do protocolo local; recebe apenas campos de texto. */
final class Json {
    private Json() { }

    static Map<String,String> readRequest(String text) {
        Reader reader = new Reader(text);
        Map<String,String> fields = new LinkedHashMap<>();
        reader.ws(); reader.expect('{'); reader.ws();
        if(reader.consume('}')) return fields;
        do {
            String key = reader.string(); reader.ws(); reader.expect(':');
            fields.put(key,reader.string()); reader.ws();
            if(reader.consume('}')) { reader.ws();reader.end();return fields; }
            reader.expect(',');
        } while(true);
    }

    static String stringify(Object value) {
        StringBuilder b = new StringBuilder();
        write(b,value); return b.toString();
    }

    private static void write(StringBuilder b,Object value) {
        if(value==null) {b.append("null");return;}
        if(value instanceof String) {quote(b,(String)value);return;}
        if(value instanceof Boolean || value instanceof Number) {b.append(value);return;}
        if(value instanceof Map<?,?> map) {
            b.append('{'); boolean first=true;
            for(var entry:map.entrySet()) {
                if(!first)b.append(',');first=false;
                quote(b,String.valueOf(entry.getKey()));b.append(':');write(b,entry.getValue());
            }
            b.append('}');return;
        }
        if(value instanceof Collection<?> values) {
            b.append('[');boolean first=true;
            for(Object item:values){if(!first)b.append(',');first=false;write(b,item);}
            b.append(']');return;
        }
        throw new IllegalArgumentException("Tipo JSON inválido.");
    }

    private static void quote(StringBuilder b,String text) {
        b.append('"');
        for(int i=0;i<text.length();i++) {
            char c=text.charAt(i);
            switch(c) {
                case '"' -> b.append("\\\"");
                case '\\' -> b.append("\\\\");
                case '\n' -> b.append("\\n");
                case '\r' -> b.append("\\r");
                case '\t' -> b.append("\\t");
                case '\b' -> b.append("\\b");
                case '\f' -> b.append("\\f");
                default -> {if(c<32)b.append(String.format("\\u%04x",(int)c));else b.append(c);}
            }
        }
        b.append('"');
    }

    private static final class Reader {
        private final String s;private int pos;
        Reader(String s){this.s=s;}
        void ws(){while(pos<s.length()&&Character.isWhitespace(s.charAt(pos)))pos++;}
        boolean consume(char c){ws();if(pos<s.length()&&s.charAt(pos)==c){pos++;return true;}return false;}
        void expect(char c){if(!consume(c))throw new IllegalArgumentException("JSON inválido.");}
        void end(){if(pos!=s.length())throw new IllegalArgumentException("JSON inválido.");}
        String string(){
            ws();expect('"');StringBuilder b=new StringBuilder();
            while(pos<s.length()){
                char c=s.charAt(pos++);
                if(c=='"')return b.toString();
                if(c!='\\'){if(c<32)throw new IllegalArgumentException("JSON inválido.");b.append(c);continue;}
                if(pos>=s.length())break;
                char escape=s.charAt(pos++);
                switch(escape){
                    case '"','\\','/' -> b.append(escape);
                    case 'b' -> b.append('\b');case 'f' -> b.append('\f');
                    case 'n' -> b.append('\n');case 'r' -> b.append('\r');case 't' -> b.append('\t');
                    case 'u' -> {if(pos+4>s.length())throw new IllegalArgumentException("JSON inválido.");
                        try{b.append((char)Integer.parseInt(s.substring(pos,pos+4),16));}catch(NumberFormatException e){throw new IllegalArgumentException("JSON inválido.");}pos+=4;}
                    default -> throw new IllegalArgumentException("JSON inválido.");
                }
            }
            throw new IllegalArgumentException("JSON inválido.");
        }
    }
}

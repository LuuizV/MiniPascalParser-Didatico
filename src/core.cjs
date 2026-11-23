'use strict';
/**
 * NÚCLEO DA LINGUAGEM MINI_PASCAL (sem dependências gráficas)
 * ---------------------------------------------------------
 * Pipeline: fonte -> lex() -> tokens -> analisar() -> passos do Parser SLR(1).
 *
 * `grammar.json` é a fonte única das produções. A partir dele, buildGrammar()
 * calcula FIRST, FOLLOW, a coleção canônica LR(0) e as tabelas ACTION/GOTO.
 * Nenhuma animação inventa reduções: cada passo do simulador vem de `analisar`.
 *
 * CONTEXTO ACADÊMICO: esta gramática Mini_Pascal é DIFERENTE da Sigma do
 * enunciado. Não adicionar boolean, read/write ou restrições da Sigma aqui sem
 * uma revisão planejada da gramática e dos testes. Os números de referência
 * (71 regras, 130 estados, 611 ações de regressão) são específicos desta base.
 *
 * Uso sem Electron: const {lex, analisar, modelo} = require('./core.cjs').
 */
const rules = require('./grammar.json');
const LABEL = Object.freeze({
  PALAVRA_RESERVADA:'Palavra reservada', IDENTIFICADOR:'Identificador',
  NUMERO_INTEIRO:'Número inteiro', NUMERO_REAL:'Número real',
  OPERADOR_ARITMETICO:'Operador aritmético', OPERADOR_RELACIONAL:'Operador relacional',
  OPERADOR_LOGICO:'Operador lógico', SIMBOLO_ESPECIAL:'Símbolo especial',
  ATRIBUICAO:'Atribuição', FIM:'Fim', CONSTANTE_CARACTERE:'Constante caractere',
  CONSTANTE_STRING:'Constante string', DESCONHECIDO:'Desconhecido', EOF:'EOF'
});
const RESERVED = new Set(('ABSOLUTE ARRAY BEGIN CASE CHAR CONST DIV DO DOWTO ELSE END EXTERNAL FILE FOR FORWARD FUNC FUNCTION GOTO IF IMPLEMENTATION INTEGER INTERFACE INTERRUPT LABEL MAIN NIL NIT OF PACKED PROC PROCEDURE PROGRAM REAL RECORD REPEAT SET SHL SHR STRING THEN TO TYPE UNIT UNTIL USES VAR WHILE WITH XOR').split(' '));
const letter = c => !!c && /[A-Za-z]/.test(c);
const digit = c => !!c && /[0-9]/.test(c);
const space = c => !!c && /[ \t\r\n\f]/.test(c);
/**
 * Converte a classificação do Lexer no terminal esperado pela tabela SLR.
 * Identificadores viram ID, números viram NUM; pontuação e palavras reservadas
 * mantêm sua grafia canônica em minúsculas. `procedure` é uma palavra-chave,
 * não uma chamada de identificador. `$` é o marcador de fim de entrada.
 */
function terminal(token) {
  if(token.tipo==='EOF') return '$';
  if(token.tipo==='IDENTIFICADOR') return token.lexema.toLowerCase()==='procedure'?'procedure':'ID';
  if(token.tipo==='NUMERO_INTEIRO'||token.tipo==='NUMERO_REAL') return 'NUM';
  if(token.tipo==='CONSTANTE_STRING') return 'STR';
  if(token.tipo==='CONSTANTE_CARACTERE') return 'CHAR_CONST';
  if(token.tipo==='DESCONHECIDO') return 'DESCONHECIDO';
  return token.lexema.toLowerCase();
}
/**
 * Analisador léxico determinístico de varredura da esquerda para a direita.
 *
 * Invariantes:
 *  - `i` é a posição UTF-16 no código-fonte; linha/coluna começam em 1;
 *  - CRLF é uma única quebra lógica, assim como LF ou CR isolado;
 *  - cada token guarda lexema, tipo, linha, coluna e terminal SLR;
 *  - um token EOF é emitido mesmo quando há erros, para diagnóstico consistente.
 *
 * O Lexer não valida a sequência gramatical dos tokens: isso é papel do Parser.
 * Erros léxicos são acumulados e impedem o início da análise sintática.
 */
function lex(source) {
  source = String(source??'');
  let i=0, linha=1, coluna=1;
  const tokens=[], erros=[];
  const ch=(ahead=0)=>source[i+ahead]??'\0';
  const eof=()=>i>=source.length;
  // A posição avançada inclui o par CRLF como UMA linha, nunca duas.
  const advance=()=>{if(eof()) return; const c=source[i++]; if(c==='\r'){if(ch()==='\n')i++;linha++;coluna=1;} else if(c==='\n'){linha++;coluna=1;}else coluna++;};
  const push=(lexema,tipo,l=linha,c=coluna)=>{const t={lexema,tipo,descricao:LABEL[tipo],linha:l,coluna:c};t.terminal=terminal(t);tokens.push(t);};
  const err=(l,c,lexema,mensagem)=>erros.push({linha:l,coluna:c,lexema,mensagem});
  for(;;){
    let repeated;
    do{
      repeated=false;
      while(!eof()&&space(ch())){advance();repeated=true;}
      // Comentários /* ... */ são descartados sem produzir terminais.
      // Um comentário não encerrado produz diagnóstico na posição inicial.
      if(!eof()&&ch()==='/'&&ch(1)==='*'){
        const l=linha,c=coluna;let comm='';comm+=ch();advance();comm+=ch();advance();let closed=false;
        while(!eof()){if(ch()==='*'&&ch(1)==='/'){comm+='*/';advance();advance();closed=true;break;}comm+=ch();advance();}
        if(!closed)err(l,c,comm.length>30?comm.slice(0,27)+'...':comm,'comentário de bloco não terminado antes do fim do arquivo');
        repeated=true;
      }
    }while(repeated);
    if(eof()){push('','EOF');break;}
    const l=linha,c=coluna, start=i, a=ch();
    if(letter(a)){
      while(!eof()&&(letter(ch())||digit(ch())||ch()==='_'))advance();
      const s=source.slice(start,i),low=s.toLowerCase();
      push(s,['and','or','not'].includes(low)?'OPERADOR_LOGICO':low==='mod'?'OPERADOR_ARITMETICO':RESERVED.has(s.toUpperCase())?'PALAVRA_RESERVADA':'IDENTIFICADOR',l,c);
      continue;
    }
    // Números usam estados explícitos: INT, FRAC, EXP, SIGN e DIGITS.
    // Isso diferencia expoente incompleto de número real bem formado.
    if(digit(a)){
      let state='INT',tipo='NUMERO_INTEIRO';
      while(!eof()){
        const x=ch();
        if(state==='INT'){
          if(digit(x)){advance();continue;}
          if(x==='.'&&digit(ch(1))){advance();tipo='NUMERO_REAL';state='FRAC';continue;}
          break;
        }
        if(state==='FRAC'){
          if(digit(x)){advance();continue;}
          if(x==='e'||x==='E'){advance();state='EXP';continue;}
          break;
        }
        if(state==='EXP'){
          if(x==='+'||x==='-'){advance();state='SIGN';continue;}
          if(digit(x)){advance();state='DIGITS';continue;}
          tipo='DESCONHECIDO';err(l,c,source.slice(start,i),'expoente incompleto em número real');break;
        }
        if(state==='SIGN'){
          if(digit(x)){advance();state='DIGITS';continue;}
          tipo='DESCONHECIDO';err(l,c,source.slice(start,i),'era esperado um dígito após o sinal do expoente');break;
        }
        if(state==='DIGITS'){
          if(digit(x)){advance();continue;}break;
        }
      }
      if(eof()&&(state==='EXP'||state==='SIGN')){tipo='DESCONHECIDO';err(l,c,source.slice(start,i),'expoente incompleto em número real');}
      push(source.slice(start,i),tipo,l,c);continue;
    }
    // Strings usam aspas duplas; quebras de linha encerram um literal inválido.
    if(a==='"'){
      advance();let closed=false;
      while(!eof()){if(ch()==='"'){advance();closed=true;break;}if(ch()==='\r'||ch()==='\n')break;advance();}
      const s=source.slice(start,i);
      if(!closed)err(l,c,s,eof()?'constante string não terminada antes do fim do arquivo':'constante string não terminada antes do fim da linha');
      push(s,closed?'CONSTANTE_STRING':'DESCONHECIDO',l,c);continue;
    }
    // Caracteres usam aspas simples e devem conter exatamente 1 caractere.
    if(a==="'"){
      advance();
      if(eof()||ch()==='\r'||ch()==='\n'){
        const s=source.slice(start,i);err(l,c,s,'constante caractere não terminada');push(s,'DESCONHECIDO',l,c);continue;
      }
      advance();
      if(!eof()&&ch()==="'"){advance();push(source.slice(start,i),'CONSTANTE_CARACTERE',l,c);continue;}
      while(!eof()&&ch()!=="'"&&ch()!=='\r'&&ch()!=='\n')advance();
      if(!eof()&&ch()==="'")advance();
      const s=source.slice(start,i);
      err(l,c,s,'constante caractere deve conter exatamente um caractere entre aspas simples');
      push(s,'DESCONHECIDO',l,c);continue;
    }
    advance();let tipo;
    if(a==='+'||a==='-'||a==='*'||a==='/')tipo='OPERADOR_ARITMETICO';
    else if(a===':'){if(ch()==='='){advance();tipo='ATRIBUICAO';}else tipo='SIMBOLO_ESPECIAL';}
    else if(a==='>'||a==='<'){if(ch()==='='||(a==='<'&&ch()==='>'))advance();tipo='OPERADOR_RELACIONAL';}
    else if(a==='=')tipo='OPERADOR_RELACIONAL';
    else if('(),;'.includes(a))tipo='SIMBOLO_ESPECIAL';
    else if(a==='.')tipo='FIM';
    else {tipo='DESCONHECIDO';err(l,c,a,'símbolo desconhecido');}
    push(source.slice(start,i),tipo,l,c);
  }
  return {tokens,erros};
}
/**
 * CONSTRUÇÃO DAS TABELAS SLR(1)
 * ----------------------------
 * 1. Cada produção vira (lado esquerdo, lista de símbolos à direita).
 * 2. FIRST calcula os terminais que podem iniciar cada não-terminal.
 * 3. `nullable` rastreia não-terminais capazes de produzir ε (cadeia vazia).
 * 4. FOLLOW calcula os terminais que podem seguir cada não-terminal.
 * 5. closure() e GOTO geram a coleção canônica de itens LR(0), em ordem
 *    determinística compatível com a versão Java da atividade.
 * 6. ACTION decide SHIFT/REDUCE/ACCEPT; GOTO decide o estado após REDUCE.
 *    Uma colisão inconsistente falha explicitamente, em vez de escolher uma
 *    operação arbitrária e ensinar um resultado incorreto.
 *
 * Importante: FIRST/FOLLOW e ACTION/GOTO continuam NECESSÁRIOS ao algoritmo,
 * mesmo quando a interface exibe somente as produções da gramática.
 */
function buildGrammar(){
  const productions=rules.map(([lhs,rhs],id)=>({id,lhs,rhs:rhs?rhs.split(' '):[]}));
  const nonterminals=new Set(productions.map(p=>p.lhs)),terminals=new Set(['$']);
  for(const p of productions)for(const s of p.rhs)if(!nonterminals.has(s))terminals.add(s);
  const byLhs=new Map();for(const p of productions){if(!byLhs.has(p.lhs))byLhs.set(p.lhs,[]);byLhs.get(p.lhs).push(p.id);}
  const first={},nullable=new Set(),follow={};
  for(const nt of nonterminals){first[nt]=new Set();follow[nt]=new Set();}
  // Ponto fixo de FIRST: repetimos até nenhuma inclusão modificar os conjuntos.
  let changed=true;
  while(changed){changed=false;for(const p of productions){
    if(!p.rhs.length){if(!nullable.has(p.lhs)){nullable.add(p.lhs);changed=true;}continue;}
    let all=true;for(const s of p.rhs){
      const els=nonterminals.has(s)?first[s]:new Set([s]);
      for(const x of els)if(!first[p.lhs].has(x)){first[p.lhs].add(x);changed=true;}
      if(!nonterminals.has(s)||!nullable.has(s)){all=false;break;}
    }
    if(all&&!nullable.has(p.lhs)){nullable.add(p.lhs);changed=true;}
  }}
  // FOLLOW(S') recebe `$`: apenas a produção aumentada aceita fim de entrada.
  // As inclusões de FIRST(β) e FOLLOW(A) seguem o algoritmo clássico de GLC.
  follow["S'"].add('$');changed=true;
  while(changed){changed=false;for(const p of productions)for(let i=0;i<p.rhs.length;i++){
    const s=p.rhs[i];if(!nonterminals.has(s))continue;
    let all=true;for(let j=i+1;j<p.rhs.length;j++){
      const q=p.rhs[j];for(const x of (nonterminals.has(q)?first[q]:[q]))if(!follow[s].has(x)){follow[s].add(x);changed=true;}
      if(!nonterminals.has(q)||!nullable.has(q)){all=false;break;}
    }
    if(all)for(const x of follow[p.lhs])if(!follow[s].has(x)){follow[s].add(x);changed=true;}
  }}
  const compare=(a,b)=>a[0]-b[0]||a[1]-b[1];
  const key=items=>items.map(x=>x.join(':')).join('|');
  // closure(I): para A -> α . B β, inclui todos os itens B -> . γ.
  // Uma chave estável garante que estados iguais não sejam criados duas vezes.
  function closure(base){
    const seen=new Set(),queue=[];
    function add(pair){const k=pair.join(':');if(!seen.has(k)){seen.add(k);queue.push(pair);}}
    for(const x of [...base].sort(compare))add(x);
    for(let i=0;i<queue.length;i++){
      const [p,dot]=queue[i],sym=productions[p].rhs[dot];
      if(nonterminals.has(sym))for(const id of byLhs.get(sym)||[])add([id,0]);
    }
    return queue.sort(compare);
  }
  const symbols=[...new Set([...terminals].filter(s=>s!=='$').concat([...nonterminals]))].sort();
  const states=[closure([[0,0]])], transitions=[],known=new Map([[key(states[0]),0]]);
  for(let i=0;i<states.length;i++){
    const row={};
    for(const sym of symbols){
      const moved=[];
      for(const [pid,dot]of states[i])if(productions[pid].rhs[dot]===sym)moved.push([pid,dot+1]);
      if(!moved.length)continue;
      const target=closure(moved),k=key(target);
      if(!known.has(k)){known.set(k,states.length);states.push(target);}
      row[sym]=known.get(k);
    }
    transitions.push(row);
  }
  // REDUCE só aparece nos terminais FOLLOW da produção reconhecida.
  // ACCEPT só aparece na produção artificial S' -> PROG . com `$`.
  const actions=[],gotos=[];
  for(let i=0;i<states.length;i++){
    const row={},gt={};
    function put(sym,act){if(row[sym]&&JSON.stringify(row[sym])!==JSON.stringify(act))throw Error(`Conflito SLR no estado ${i}, ${sym}`);row[sym]=act;}
    for(const [pid,dot]of states[i]){
      const p=productions[pid];
      if(dot<p.rhs.length){const sym=p.rhs[dot],dst=transitions[i][sym];if(dst===undefined)continue;
        if(terminals.has(sym)&&sym!=='$')put(sym,{kind:'SHIFT',value:dst});
        else if(nonterminals.has(sym))gt[sym]=dst;
      }else if(pid===0)put('$',{kind:'ACCEPT',value:0});
      else for(const t of follow[p.lhs])put(t,{kind:'REDUCE',value:pid});
    }
    actions.push(row);gotos.push(gt);
  }
  const objSet=o=>Object.fromEntries(Object.entries(o).map(([k,v])=>[k,[...v].sort()]));
  return {productions,states,transitions,actions,gotos,first:objSet(first),follow:objSet(follow),symbols,terminals:[...terminals].sort(),nonterminals:[...nonterminals].sort()};
}
const modelo=buildGrammar();
const friendly=s=>s==='ID'?'identificador':s==='NUM'?'número':s==='STR'?'constante string':s==='CHAR_CONST'?'constante caractere':s==='$'?'fim do arquivo':`'${s}'`;
const stackText=(states,symbols)=>'0'+symbols.map((s,i)=>` ${s} ${states[i+1]}`).join('');
/**
 * Simula o autômato SLR(1) para o texto fornecido.
 *
 * `st` é a pilha de estados (começa em q0). `sy` é a pilha de símbolos
 * gramaticais, alinhada com os estados após q0. O par (estado, terminal)
 * consulta ACTION e executa SHIFT, REDUCE ou ACCEPT.
 *
 * O resultado inclui um histórico de fotografias independentes anteriores à ação.
 * Isso permite navegar para trás e para frente sem executar o Parser novamente.
 * A árvore gráfica reconstrói as reduções realizadas a partir desses registros.
 *
 * Na ocorrência de erro: registra token e terminais esperados, tenta
 * sincronizar em ;, end, else, . ou fim de entrada e conserva a fotografia da
 * pilha ANTES de descartar símbolos. Esse mecanismo é recuperação sintática,
 * não verificação semântica nem interpretação do programa.
 */
function analisar(source){
  const lexed=lex(source),tokens=lexed.tokens, errosLexicos=lexed.erros,errosSintaticos=[],passos=[];
  if(errosLexicos.length)return {tokens:tokens.slice(0,-1),errosLexicos,errosSintaticos,passos,aceito:false,estados:modelo.states.length};
  const st=[0],sy=[];let pos=0,aceito=false;
  const remaining=()=>{const limit=Math.min(tokens.length,pos+8);return tokens.slice(pos,limit).map(t=>['ID','NUM','STR','CHAR_CONST'].includes(t.terminal)?t.lexema:t.terminal).join(' ')+(limit<tokens.length?' ...':'');};
  // Um passo guarda índice do token, estado de consulta, pilhas e decisão.
  // REDUCE fotografa a pilha antes do GOTO; SHIFT fotografa antes do consumo.
  function trace(kind,acao,dest=-1,prod=-1,goFrom=-1,goTo=-1,restart=-1,popped=0){
    const t=tokens[pos];passos.push({passo:passos.length+1,pilha:stackText(st,sy),entrada:remaining(),acao,
      detalhes:{indiceToken:pos,token:t,terminal:t.terminal,estado:st.at(-1),tipo:kind,destinoShift:dest,producao:prod,origemGoto:goFrom,destinoGoto:goTo,estados:[...st],simbolos:[...sy],indiceRetomada:restart,estadosRemovidos:popped}});
  }
  // Panic-mode: procurar um terminal conhecido e, se necessário, recuar
  // estados da pilha até existir uma ação válida para esse terminal.
  const synchronizers=new Set([';','end','else','.','$']);
  function recover(){let j=pos;while(j<tokens.length){const term=tokens[j].terminal;if(modelo.actions[st.at(-1)][term])return j;
    if(synchronizers.has(term)){while(st.length>1&&!modelo.actions[st.at(-1)][term]){st.pop();sy.pop();}if(modelo.actions[st.at(-1)][term])return j;}
    if(term==='$')return -1;j++;
  }return -1;}
  while(passos.length<20000&&pos<tokens.length){
    const t=tokens[pos],state=st.at(-1),act=modelo.actions[state][t.terminal];
    if(!act){
      const expected=Object.keys(modelo.actions[state]).map(friendly).sort();
      const found=t.tipo==='EOF'?'fim do arquivo':t.lexema;
      const mensagem=`símbolo inesperado '${found}'`+(expected.length?'. Esperado: '+expected.join(', '):'');
      errosSintaticos.push({linha:t.linha,coluna:t.coluna,encontrado:found,esperados:expected,mensagem});
      // Fotografia ANTES da recuperação; o histórico permite navegar sem reexecutar.
      const originalStates=st.slice(),originalSymbols=sy.slice(),originalText=stackText(st,sy);
      const restart=recover();
      passos.push({passo:passos.length+1,pilha:originalText,entrada:remaining(),acao:`ERRO - ${mensagem}`,detalhes:{indiceToken:pos,token:t,terminal:t.terminal,estado:state,tipo:'ERROR',destinoShift:-1,producao:-1,origemGoto:-1,destinoGoto:-1,estados:originalStates,simbolos:originalSymbols,indiceRetomada:restart,estadosRemovidos:originalStates.length-st.length}});
      if(restart<0)break;pos=restart;continue;
    }
    // SHIFT: consome um terminal e empilha o estado de destino.
    // REDUCE: remove |β| estados/símbolos, consulta GOTO(q,A) e empilha A.
    // ACCEPT: a entrada sintaticamente válida chegou ao marcador `$`.
    if(act.kind==='SHIFT'){trace('SHIFT',`SHIFT para estado ${act.value} com '${friendly(t.terminal)}'`,act.value);sy.push(t.terminal);st.push(act.value);pos++;}
    else if(act.kind==='REDUCE'){
      const p=modelo.productions[act.value],n=p.rhs.length,from=st[st.length-1-n],to=modelo.gotos[from][p.lhs];
      trace('REDUCE',`REDUCE por [${p.id}] ${p.lhs} -> ${p.rhs.join(' ')||'epsilon'}`,-1,p.id,from,to??-1);
      st.splice(st.length-n,n);if(n)sy.splice(sy.length-n,n);
      const dest=modelo.gotos[st.at(-1)][p.lhs];if(dest===undefined)throw Error('GOTO ausente após redução '+p.id);
      sy.push(p.lhs);st.push(dest);
    }else{trace('ACCEPT','ACCEPT');aceito=true;break;}
  }
  if(passos.length>=20000&&!aceito){const t=tokens[Math.min(pos,tokens.length-1)];errosSintaticos.push({linha:t.linha,coluna:t.coluna,encontrado:t.lexema,esperados:[],mensagem:'análise interrompida: limite interno de passos excedido'});}
  return {tokens:tokens.slice(0,-1),errosLexicos,errosSintaticos,passos,aceito:aceito&&!errosSintaticos.length,estados:modelo.states.length};
}
module.exports={lex,analisar,modelo,terminal,LABEL};

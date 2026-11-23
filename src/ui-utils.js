'use strict';
/** Helpers puros usados pela interface e pelos testes Node.js. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.MiniPascalUI=api;
})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function offsetAt(source,line,col){
    const content=String(source??'');let start=0,number=1;
    for(const match of content.matchAll(/\r\n|\r|\n/g)){
      if(number>=line)break;
      start=match.index+match[0].length;number++;
    }
    return Math.min(content.length,start+Math.max(0,Number(col||1)-1));
  }
  function sourceLine(source,line){
    const lines=String(source??'').split(/\r\n|\r|\n/);
    return lines[Math.max(0,Math.min(lines.length-1,Number(line||1)-1))]??'';
  }
  // Rótulos usados apenas na interface; as produções conservam os símbolos originais.
  const symbolNames=Object.freeze({
    "S'":'Início',PROG:'Programa',BLOCO:'Bloco',SECOES_VAR:'Declarações',
    LISTA_DECL:'Lista de declarações',LISTA_DECL_TAIL:'Mais declarações',DECL:'Declaração',
    LISTA_ID:'Identificadores',LISTA_ID_TAIL:'Mais identificadores',TIPO:'Tipo',
    PROCEDIMENTOS:'Procedimentos',PALIST:'Parâmetros',LISTA_PARAM:'Lista de parâmetros',
    LISTA_PARAM_TAIL:'Mais parâmetros',PARAM:'Parâmetro',OPT_VAR:'Var opcional',
    LISTA_COMANDOS:'Lista de comandos',LISTA_COMANDOS_TAIL:'Mais comandos',
    COMANDO:'Comando',MATCHED:'Comando completo',OPEN:'Comando pendente',
    COMANDO_ID_TAIL:'Continuação do ID',LISTA_EXPR:'Lista de expressões',
    LISTA_EXPR_TAIL:'Mais expressões',EXPR:'Expressão',EXPR_TAIL:'Comparação opcional',
    OP_REL:'Operador relacional',SIEXPR:'Expressão simples',OPT_SIGN:'Sinal opcional',
    SIEXPR_TAIL:'Mais termos',TERMO:'Termo',TERMO_TAIL:'Cont. do termo',FATOR:'Fator'
  });
  const symbolDescriptions=Object.freeze({
    PROG:'Programa completo.',BLOCO:'Declarações e comandos do bloco.',
    SECOES_VAR:'Declarações de variáveis, quando presentes.',
    MATCHED:'Comando sem else pendente.',OPEN:'Comando ainda sujeito a else.',
    COMANDO_ID_TAIL:'Continuação de um comando iniciado por identificador.',
    EXPR:'Expressão aritmética ou relacional.',EXPR_TAIL:'Comparação opcional da expressão.',
    SIEXPR:'Termos ligados por soma ou subtração.',SIEXPR_TAIL:'Continuação de soma ou subtração.',
    OPT_SIGN:'Sinal inicial opcional.',TERMO:'Fatores combinados por multiplicação ou divisão.',
    TERMO_TAIL:'Continuação multiplicativa do termo.',FATOR:'Operando simples ou expressão entre parênteses.'
  });
  function symbolLabel(symbol){return symbolNames[symbol]||symbol;}
  function symbolDescription(symbol){return symbolDescriptions[symbol]||'';}
  function lineProgress(source,line){
    const total=String(source??'').split(/\r\n|\r|\n/).length;
    const current=Number(line);
    const valid=Number.isFinite(current)&&current>0;
    const position=valid?Math.max(1,Math.min(total,current)):0;
    return {position,total,percentage:valid?Math.round(position/total*10000)/100:0};
  }
  function errorExcerpt(source,error){
    const lines=String(source??'').split(/\r\n|\r|\n/);
    const index=Number(error.linha)-1;
    if(!Number.isInteger(index)||index<0||index>=lines.length)return {line:'',start:0,end:0};
    const line=lines[index],start=Math.max(0,Math.min(line.length,Number(error.coluna||1)-1));
    const actual=String(error.lexema||error.encontrado||'');
    const length=actual&&line.slice(start,start+actual.length)===actual?actual.length:0;
    return {line,start,end:start+length};
  }
  function actionInfo(step,grammar){
    const d=step?.detalhes;
    if(!d)return {kind:'idle',title:'Sem etapa',description:'Execute uma análise para começar.'};
    if(d.tipo==='SHIFT')return {kind:'shift',title:'Consumiu um token',description:`O Parser leu “${d.token?.lexema??d.terminal}” e passou do estado ${d.estado} para o estado ${d.destinoShift}.`,technical:`ACTION[${d.estado}, ${d.terminal}] = s${d.destinoShift}`};
    if(d.tipo==='REDUCE'){
      const p=grammar?.productions?.[d.producao], n=p?.rhs?.length??0;
      return {kind:'reduce',title:'Reconheceu uma regra',description:`O Parser reconheceu ${n} símbolo${n===1?'':'s'} como “${p?.lhs??'?'}” e seguiu para o estado ${d.destinoGoto}. O próximo token ainda não foi consumido.`,technical:p?`Regra ${p.id}: ${p.lhs} → ${p.rhs.join(' ')||'ε'} · GOTO[${d.origemGoto}, ${p.lhs}] = ${d.destinoGoto}`:`REDUCE r${d.producao}`};
    }
    if(d.tipo==='ACCEPT')return {kind:'accept',title:'Código aceito pela gramática',description:'Todos os tokens foram reconhecidos pela gramática. Isso confirma a análise sintática, não a execução do programa.',technical:'ACTION = ACCEPT'};
    return {kind:'error',title:'Encontrou um erro',description:`O token “${d.token?.lexema??d.terminal}” não é aceito neste estado. ${d.indiceRetomada<0?'A análise não conseguiu continuar.':'O Parser tentou recuperar e retomar a leitura.'}`,technical:`ACTION[${d.estado}, ${d.terminal}] = erro · Estados removidos: ${d.estadosRemovidos??0}`};
  }
  function tokenReport(tokens){
    return tokens.map(t=>`<${t.lexema}, ${t.descricao}>`).join('\n')+'\n';
  }
  function analysisReport(result,name,version){
    const lines=[`MiniPascal v${version} — ${name}`,`ESTADOS=${result.estados}`,`ACEITO=${result.aceito}`];
    result.tokens.forEach(t=>lines.push(`TOK=<${t.lexema}, ${t.descricao}> [linha ${t.linha}, coluna ${t.coluna}]`));
    result.errosLexicos.forEach(e=>lines.push(`LEX=Linha ${e.linha}, coluna ${e.coluna}: ${e.mensagem}`));
    result.errosSintaticos.forEach(e=>lines.push(`SYN=Linha ${e.linha}, coluna ${e.coluna}: ${e.mensagem}`));
    result.passos.forEach(p=>lines.push(`STEP=${p.passo}|${p.pilha}|${p.entrada}|${p.acao}`));
    return lines.join('\n')+'\n';
  }
  return {escapeHTML:esc,offsetAt,sourceLine,actionInfo,tokenReport,analysisReport,symbolLabel,symbolDescription,lineProgress,errorExcerpt};
});

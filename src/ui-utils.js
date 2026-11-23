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
  return {escapeHTML:esc,offsetAt,sourceLine,actionInfo,tokenReport,analysisReport};
});

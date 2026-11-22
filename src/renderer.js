'use strict';
/** Interface HTML/CSS nativa do Electron. Nenhum dado do usuário vira HTML não escapado. */
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const sample=`program exemplo;
var contador: integer;
begin
  contador := 10;
  contador := contador + 5;
  while contador > 0 do
    contador := contador - 1;
end.`;
const state={result:null,grammar:null,step:0,tab:'simulator',fileName:'programa_exemplo.pas',filePath:null,dirty:false,font:13,playing:false,timer:null,selectedToken:-1,grammarTab:'states',inspectState:0,examples:[],mutated:false};
const input=$('#codeInput');input.value=sample;
let currentUpdate=null;
function notify(message){const el=$('#toast');el.textContent=message;el.classList.add('visible');clearTimeout(notify.timer);notify.timer=setTimeout(()=>el.classList.remove('visible'),3000);}
function status(message){$('#statusText').textContent=message;}
function setDirty(flag){state.dirty=flag;$('#dirtyFlag').hidden=!flag;$('#fileStatus').textContent=flag?'Alterações não salvas':'Sem alterações';}
function syntaxColor(code){
  const reg=/\/\*[\s\S]*?(?:\*\/|$)|"[^"\r\n]*"|'[^'\r\n]*'|\b(?:program|var|begin|end|integer|real|char|string|procedure|if|then|else|while|do|div|mod)\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|:=|<=|>=|<>|[+\-*\/=<>]/gi;
  let s='',from=0;
  for(const m of code.matchAll(reg)){
    s+=escapeHTML(code.slice(from,m.index));const text=m[0],kind=text.startsWith('/*')?'cm':text[0]==='"'||text[0]==="'"?'str':/^\d/.test(text)?'num':/^(?:\w)+$/.test(text)&&!['mod','div'].includes(text.toLowerCase())?'kw':'op';
    s+=`<span class="${kind}">${escapeHTML(text)}</span>`;from=m.index+text.length;
  }
  return s+escapeHTML(code.slice(from));
}
function posToOffset(line,col){const ls=input.value.split(/\r\n|\r|\n/);let off=0;for(let i=0;i<line-1&&i<ls.length;i++)off+=ls[i].length+1;return Math.min(input.value.length,off+Math.max(0,col-1));}
function highlightedCode(){
  const code=input.value,step=state.result?.passos?.[state.step],t=state.selectedToken>=0?state.result?.tokens[state.selectedToken]:step?.detalhes?.token;
  if(!t||!t.lexema)return syntaxColor(code)+'\n';
  const start=posToOffset(t.linha,t.coluna),end=Math.min(code.length,start+t.lexema.length);
  return syntaxColor(code.slice(0,start))+`<span class="hit">${escapeHTML(code.slice(start,end))}</span>`+syntaxColor(code.slice(end))+'\n';
}
function refreshEditor(){
  $('#codeHighlight').innerHTML=highlightedCode();
  const count=input.value.split(/\r\n|\r|\n/).length;
  $('#editorLines').textContent=`${count} linha${count!==1?'s':''}`;
  const active=state.result?.passos[state.step]?.detalhes?.token?.linha||0;
  const errorLines=new Set([...(state.result?.errosLexicos||[]),...(state.result?.errosSintaticos||[])].map(e=>e.linha));
  $('#lineNumbers').innerHTML=Array.from({length:count},(_,i)=>`<span class="${i+1===active?'line-active':''} ${errorLines.has(i+1)?'line-error':''}">${i+1}</span>`).join('\n');
  cursorInfo();scrollTogether();
}
function scrollTogether(){const h=$('#codeHighlight'),lines=$('#lineNumbers');h.scrollTop=input.scrollTop;h.scrollLeft=input.scrollLeft;lines.scrollTop=input.scrollTop;}
function cursorInfo(){let before=input.value.slice(0,input.selectionStart).split(/\r\n|\r|\n/),line=before.length,col=before.at(-1).length+1;$('#editorCaret').textContent=`Ln ${line}, Col ${col}`;}
function changeSource(s,filename=null){input.value=s;if(filename){state.fileName=filename;$('#filename').textContent=filename;state.filePath=null;}state.selectedToken=-1;invalidate();refreshEditor();}
function invalidate(){pause();state.result=null;state.step=0;setDirty(true);updateStats();updateTimeline();renderInspector();}
function updateStats(){const r=state.result;
  $('#statTokens').textContent=r?r.tokens.length:'—';$('#statSteps').textContent=r?r.passos.length:'—';$('#statStates').textContent=state.grammar?.states.length||130;
  $('#statResult').textContent=!r?'Pendente':r.aceito?'Aceito':'Rejeitado';$('#statResult').style.color=!r?'var(--text)':r.aceito?'#72e0b6':'#ffb6ac';
  const n=(r?.errosLexicos.length||0)+(r?.errosSintaticos.length||0);
  $('#statErrorCount').textContent=r?`${n} erro${n===1?'':'s'}`:'Executar análise';$('#navErrors').textContent=n;
}
function reportText(r){const a=[`MiniPascal Studio v5.1 — ${state.fileName}`,`ESTADOS=${r.estados}`,`ACEITO=${r.aceito}`];
  for(const t of r.tokens)a.push(`TOK=<${t.lexema}, ${t.descricao}> [linha ${t.linha}, coluna ${t.coluna}]`);
  for(const e of r.errosLexicos)a.push(`LEX=Linha ${e.linha}, coluna ${e.coluna}: ${e.mensagem}${e.lexema?' ['+e.lexema+']':''}`);
  for(const e of r.errosSintaticos)a.push(`SYN=Linha ${e.linha}, coluna ${e.coluna}: ${e.mensagem}`);
  for(const t of r.passos)a.push(`STEP=${t.passo}|${t.pilha}|${t.entrada}|${t.acao}`);
  return a.join('\n')+'\n';
}
async function runAnalysis(){pause();if(!window.studio){notify('Abra a aplicação no Electron para executar o analisador.');return;}
  try{status('Executando análise...');const r=await window.studio.analyze(input.value);state.result=r;state.step=0;state.selectedToken=-1;updateStats();updateTimeline();renderInspector();refreshEditor();status(r.aceito?'Programa aceito pela gramática':`Análise concluída · ${r.errosLexicos.length+r.errosSintaticos.length} erro(s)`);}
  catch(err){status('Não foi possível analisar');notify(err.message);}}
function explain(step){const d=step?.detalhes;if(!d)return 'Sem etapas registradas.';
  if(d.tipo==='SHIFT')return `O Parser consumiu <strong>${escapeHTML(d.token.lexema)}</strong> e empilhou o estado <strong>${d.destinoShift}</strong> pela tabela ACTION.`;
  if(d.tipo==='REDUCE'){const p=state.grammar?.productions[d.producao];return `REDUCE pela produção <strong>[${d.producao}] ${escapeHTML(p?.lhs||'')}</strong>. Após desempilhar ${p?.rhs.length||0} símbolo(s), GOTO[${d.origemGoto}, ${escapeHTML(p?.lhs||'')}] = <strong>${d.destinoGoto}</strong>.`;}
  if(d.tipo==='ACCEPT')return 'O analisador reconheceu toda a entrada. <strong>ACCEPT:</strong> programa sintaticamente válido.';
  return `ACTION[${d.estado}, ${escapeHTML(d.terminal)}] não possui entrada. Recuperação: ${d.indiceRetomada<0?'não foi possível continuar':`retomada no token ${d.indiceRetomada+1}`}; ${d.estadosRemovidos} estado(s) removidos.`;
}
function updateTimeline(){const r=state.result,steps=r?.passos||[],current=steps[state.step];
  $('#timelinePos').textContent=steps.length?`ETAPA ${state.step+1} DE ${steps.length}`:'Nenhum passo selecionado';
  $('#timelineAction').textContent=current?current.acao:'Aguardando execução';
  const range=$('#stepRange');range.disabled=!steps.length;range.min=0;range.max=Math.max(0,steps.length-1);range.value=state.step;
  $('#timelineTicks').innerHTML=steps.length?`<span>Passo 1</span><span>${Math.ceil(steps.length/2)}</span><span>Passo ${steps.length}</span>`:'';
  $('#actionExplain').innerHTML=current?explain(current):'Clique em <strong>Analisar código</strong> ou pressione <kbd>Ctrl + Enter</kbd> para começar.';
  $('#stepBadge').textContent=current?`Estado ${current.detalhes.estado}`:'Aguardando análise';
  for(const [id,cond] of [['#btnFirst',!steps.length||state.step===0],['#btnPrev',!steps.length||state.step===0],['#btnNext',!steps.length||state.step>=steps.length-1],['#btnLast',!steps.length||state.step>=steps.length-1],['#btnPlay',steps.length<2]])$(id).disabled=cond;
  $('#btnPlay').textContent=state.playing?'Ⅱ':'▶';
}
function setStep(idx){const steps=state.result?.passos||[];if(!steps.length)return;state.step=Math.max(0,Math.min(steps.length-1,idx));state.selectedToken=-1;updateTimeline();renderInspector();refreshEditor();}
function pause(){if(state.timer)clearInterval(state.timer);state.timer=null;state.playing=false;$('#btnPlay').textContent='▶';}
function play(){const total=state.result?.passos.length||0;if(!total)return;if(state.playing){pause();return;}if(state.step>=total-1)setStep(0);state.playing=true;updateTimeline();state.timer=setInterval(()=>{if(state.step>=total-1){pause();updateTimeline();return;}setStep(state.step+1);},Number($('#speed').value)||650);}
function setView(tab){state.tab=tab;$$('.tab').forEach(e=>e.classList.toggle('active',e.dataset.tab===tab));$$('.nav-item').forEach(e=>e.classList.toggle('active',e.dataset.view===tab));renderInspector();}
function pills(items){return items.map(x=>`<span class="chip">${escapeHTML(x)}</span>`).join('');}
function detailStep(){const trace=state.result?.passos[state.step];if(!trace)return '<div class="empty"><div class="empty-symbol">⇄</div><h3>Nenhum passo registrado</h3><p>Faça uma análise sintática para percorrer as operações.</p></div>';
  const d=trace.detalhes,p=state.grammar?.productions[d.producao],kind=d.tipo.toLowerCase();
  return `<div class="detail-head"><div><div class="minor-label">OPERAÇÃO ATUAL</div><div class="muted-small">Etapa ${trace.passo} de ${state.result.passos.length}</div></div><span class="action-tag ${kind}">${kind==='error'?'ERRO':d.tipo}</span></div>
    <div class="detail-grid"><div class="detail-card"><div class="minor-label">ESTADO</div><div class="val">q${d.estado}</div></div><div class="detail-card"><div class="minor-label">TOKEN ATUAL</div><div class="val" title="${escapeHTML(d.token.lexema||'$')}">${escapeHTML(d.token.lexema||'$')}</div></div>
    <div class="detail-card"><div class="minor-label">TERMINAL</div><div class="val">${escapeHTML(d.terminal)}</div></div><div class="detail-card"><div class="minor-label">ACTION / GOTO</div><div class="val">${d.tipo==='SHIFT'?`s${d.destinoShift}`:d.tipo==='REDUCE'?`r${d.producao} → ${d.destinoGoto}`:d.tipo==='ACCEPT'?'acc':'—'}</div></div></div>
    <div class="minor-label">PILHA DO ANALISADOR</div><div class="stack-chips"><span class="chip state">0</span>${d.simbolos.map((s,i)=>`<span class="chip">${escapeHTML(s)}</span><span class="chip state">${d.estados[i+1]}</span>`).join('')}</div>
    <div class="minor-label" style="margin-top:11px">ENTRADA RESTANTE</div><div class="grammar-box">${escapeHTML(trace.entrada)}</div>
    ${p?`<div class="minor-label" style="margin-top:13px">PRODUÇÃO UTILIZADA</div><div class="grammar-box">[${p.id}] ${escapeHTML(p.lhs)} → ${escapeHTML(p.rhs.join(' ')||'ε')}</div>`:''}
    <div class="tip-card">✦ &nbsp; ${explain(trace)}</div>`;
}
function rowToken(t,i){return `<tr data-token="${i}" class="${state.selectedToken===i?'selected':''}"><td class="mono">${i+1}</td><td class="mono">${escapeHTML(t.lexema)}</td><td>${escapeHTML(t.descricao)}</td><td class="mono">${escapeHTML(t.terminal)}</td><td class="mono">${t.linha}:${t.coluna}</td></tr>`;}
function tokenView(){const toks=state.result?.tokens||[];return `<div class="detail-head"><div><div class="minor-label">SAÍDA DO ANALISADOR LÉXICO</div><strong>${toks.length} tokens reconhecidos</strong></div><span class="action-tag">LEXER</span></div>${toks.length?`<div class="table-scroll"><table class="data-table"><thead><tr><th>#</th><th>Lexema</th><th>Tipo</th><th>Terminal</th><th>Pos.</th></tr></thead><tbody>${toks.map(rowToken).join('')}</tbody></table></div><p class="hint">Selecione um token para localizá-lo no editor. O terminal é o símbolo entregue ao Parser SLR(1).</p>`:'<p class="ghost-note">Não há tokens para exibir.</p>'}`;}
function errorView(){const r=state.result,all=[...(r?.errosLexicos||[]).map(e=>({...e,tipo:'Léxico'})),...(r?.errosSintaticos||[]).map(e=>({...e,tipo:'Sintático'}))];
  if(!all.length)return '<div class="healthy">✓ &nbsp; Nenhum erro encontrado nesta análise.<p class="hint">Para visualizar a recuperação de erros, abra os exemplos inválidos.</p></div>';
  return `<div class="minor-label">${all.length} DIAGNÓSTICO(S)</div>${all.map(e=>`<div class="problem" data-line="${e.linha}" data-col="${e.coluna}"><strong>${escapeHTML(e.tipo)} · Linha ${e.linha}, coluna ${e.coluna}</strong><p>${escapeHTML(e.mensagem)}</p></div>`).join('')}`;
}
function grammarView(){const g=state.grammar;if(!g)return '<p class="ghost-note">Carregando a gramática...</p>';
  const selected=Math.max(0,Math.min(state.inspectState,g.states.length-1));let content='';
  if(state.grammarTab==='rules')content=`<div class="table-scroll" style="max-height:240px"><table class="data-table"><thead><tr><th>#</th><th>Produção</th></tr></thead><tbody>${g.productions.map(p=>`<tr><td>${p.id}</td><td class="mono">${escapeHTML(p.lhs)} → ${escapeHTML(p.rhs.join(' ')||'ε')}</td></tr>`).join('')}</tbody></table></div>`;
  else if(state.grammarTab==='sets')content=`<div class="table-scroll" style="max-height:240px"><table class="data-table"><thead><tr><th>Não terminal</th><th>FIRST</th><th>FOLLOW</th></tr></thead><tbody>${g.nonterminals.map(nt=>`<tr><td class="mono">${escapeHTML(nt)}</td><td>${escapeHTML((g.first[nt]||[]).join(', '))}</td><td>${escapeHTML((g.follow[nt]||[]).join(', '))}</td></tr>`).join('')}</tbody></table></div>`;
  else if(state.grammarTab==='table'){
    const entries=Object.entries(g.actions[selected]||{}).map(([k,v])=>`<tr class="${state.result?.passos[state.step]?.detalhes?.terminal===k?'selected':''}"><td class="mono">${escapeHTML(k)}</td><td class="mono">${v.kind==='SHIFT'?'s'+v.value:v.kind==='REDUCE'?'r'+v.value:'acc'}</td></tr>`).join('');
    content=`<div class="table-scroll" style="max-height:200px"><table class="data-table"><thead><tr><th>Terminal</th><th>ACTION[${selected}, ...]</th></tr></thead><tbody>${entries}</tbody></table></div><div class="minor-label" style="margin-top:12px">GOTO</div><div class="stack-chips">${Object.entries(g.gotos[selected]||{}).map(([k,v])=>`<span class="chip">${escapeHTML(k)} → ${v}</span>`).join('')||'Sem desvios'}</div>`;
  }else{
    content=`<div class="state-lines">${g.states[selected].map(([pid,dot])=>{const p=g.productions[pid],parts=[...p.rhs];parts.splice(dot,0,'•');return escapeHTML(`[${pid}] ${p.lhs} → ${parts.join(' ')}`);}).join('\n')}</div><div class="minor-label" style="margin-top:12px">TRANSIÇÕES LOCAIS</div><div style="max-height:90px;overflow:auto">${Object.entries(g.transitions[selected]||{}).map(([k,v])=>`<button class="transition" style="width:100%" data-state="${v}"><span>${escapeHTML(k)}</span><strong>q${v} →</strong></button>`).join('')||'<p class="ghost-note">Nenhuma transição</p>'}</div>`;
  }
  return `<div class="detail-head"><div><div class="minor-label">GRAMÁTICA SLR(1)</div><strong>${g.productions.length} produções · ${g.states.length} estados</strong></div><span class="action-tag accept">0 conflitos</span></div>
    <div class="segment-control"><button data-grammar="states" class="${state.grammarTab==='states'?'active':''}">Estados LR(0)</button><button data-grammar="table" class="${state.grammarTab==='table'?'active':''}">ACTION/GOTO</button><button data-grammar="sets" class="${state.grammarTab==='sets'?'active':''}">FIRST/FOLLOW</button><button data-grammar="rules" class="${state.grammarTab==='rules'?'active':''}">Produções</button></div>
    ${['states','table'].includes(state.grammarTab)?`<div class="inspector-actions"><span class="muted-small">Estado</span><select id="stateSelect">${g.states.map((_,i)=>`<option value="${i}" ${i===selected?'selected':''}>q${i}</option>`).join('')}</select><button class="subtle-button" id="toCurrent">Estado da etapa</button></div>`:''}${content}`;
}
function treeView(){const r=state.result,g=state.grammar;if(!r?.passos.length)return '<p class="ghost-note">Execute a análise para construir a árvore de derivação.</p>';
  const stack=[];let partial=false,limit=false;
  for(let i=0;i<state.step;i++){
    const d=r.passos[i].detalhes;
    if(d.tipo==='ERROR'){partial=true;break;}
    if(d.tipo==='SHIFT')stack.push({label:d.token.lexema||d.terminal,leaf:true,children:[]});
    if(d.tipo==='REDUCE'){
      const p=g.productions[d.producao],num=p.rhs.length,children=num?stack.splice(stack.length-num,num):[{label:'ε',leaf:true,children:[]}];
      stack.push({label:p.lhs,leaf:false,children});
    }
    if(stack.length>2000){limit=true;break;}
  }
  let seen=0;
  function treeHtml(node,depth=0){if(!node||depth>15||seen++>800)return '<span class="ghost-note">…</span>';
    return `<div class="tree-node"><span class="tree-label ${node.leaf?'leaf':''}">${escapeHTML(node.label)}</span>${node.children?.map(x=>treeHtml(x,depth+1)).join('')||''}</div>`;
  }
  return `<div class="detail-head"><div><div class="minor-label">DERIVAÇÃO CONCRETA</div><strong>Árvore até a etapa ${state.step+1}</strong></div><span class="action-tag ${partial?'error':''}">${partial?'Parcial':'Em construção'}</span></div><div class="ghost-note" style="margin-bottom:12px">A árvore é reconstruída a partir dos SHIFT/REDUCE anteriores à etapa selecionada.</div><div style="max-height:240px;overflow:auto">${stack.length?stack.map(x=>treeHtml(x)).join(''):'<p class="ghost-note">Avance nas operações para formar os nós.</p>'}</div>${partial?'<p class="hint error-count">A recuperação de erros interrompe a árvore íntegra.</p>':''}${limit?'<p class="hint">Visualização limitada por desempenho.</p>':''}`;
}
function renderInspector(){const root=$('#inspectorContent');if(!state.result&&state.tab!=='grammar'){root.innerHTML='<div class="empty"><div class="empty-symbol">⌘</div><h3>Pronto para analisar</h3><p>Execute o código para explorar a pilha, a gramática e os tokens.</p></div>';return;}
  root.innerHTML=({simulator:detailStep,tokens:tokenView,grammar:grammarView,errors:errorView,tree:treeView}[state.tab]||detailStep)();
  if(state.tab==='grammar')$('#stepBadge').textContent=`${state.grammar?.states.length||130} estados LR(0)`;
}
function jump(line,col=1,length=1){input.focus();const pos=posToOffset(line,col);input.setSelectionRange(pos,pos+length);refreshEditor();}
// Ações de navegação e inspeção da bancada.
$$('.tab').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.tab)));
$$('.nav-item').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$('#inspectorContent').addEventListener('click',e=>{
  const token=e.target.closest('[data-token]');if(token&&state.result){state.selectedToken=Number(token.dataset.token);const t=state.result.tokens[state.selectedToken];jump(t.linha,t.coluna,t.lexema.length);renderInspector();return;}
  const err=e.target.closest('[data-line]');if(err){jump(Number(err.dataset.line),Number(err.dataset.col));return;}
  const gram=e.target.closest('[data-grammar]');if(gram){state.grammarTab=gram.dataset.grammar;renderInspector();return;}
  const tr=e.target.closest('[data-state]');if(tr){state.inspectState=Number(tr.dataset.state);renderInspector();return;}
  if(e.target.closest('#toCurrent')){state.inspectState=state.result?.passos[state.step]?.detalhes.estado||0;renderInspector();}
});
$('#inspectorContent').addEventListener('change',e=>{if(e.target.id==='stateSelect'){state.inspectState=Number(e.target.value);renderInspector();}});
$('#btnRun').addEventListener('click',runAnalysis);$('#btnFirst').addEventListener('click',()=>setStep(0));$('#btnLast').addEventListener('click',()=>setStep((state.result?.passos.length||1)-1));$('#btnPrev').addEventListener('click',()=>{pause();setStep(state.step-1);});$('#btnNext').addEventListener('click',()=>{pause();setStep(state.step+1);});$('#btnPlay').addEventListener('click',play);$('#speed').addEventListener('change',()=>{if(state.playing){pause();play();}});$('#stepRange').addEventListener('input',e=>{pause();setStep(Number(e.target.value));});
$('#btnPresentation').addEventListener('click',()=>{document.body.classList.toggle('presentation');$('#btnPresentation').textContent=document.body.classList.contains('presentation')?'⛶ Sair da apresentação':'⛶ Apresentação';});
$('#btnFontPlus').addEventListener('click',()=>resizeFont(1));$('#btnFontMinus').addEventListener('click',()=>resizeFont(-1));
function resizeFont(delta){state.font=Math.max(11,Math.min(21,state.font+delta));$('#codeInput').style.fontSize=state.font+'px';$('#codeHighlight').style.fontSize=state.font+'px';$('#lineNumbers').style.fontSize=state.font+'px';}
input.addEventListener('input',()=>{invalidate();refreshEditor();});input.addEventListener('scroll',scrollTogether);input.addEventListener('click',cursorInfo);input.addEventListener('keyup',cursorInfo);
input.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const start=input.selectionStart,end=input.selectionEnd;input.setRangeText('  ',start,end,'end');input.dispatchEvent(new Event('input'));}});
function confirmDiscard(){return !state.dirty||window.confirm('O código foi alterado e não foi salvo. Deseja descartá-lo?');}
$('#btnNew').addEventListener('click',()=>{if(!confirmDiscard())return;changeSource('program novo;\nbegin\n  \nend.','novo.pas');state.filePath=null;});
$('#btnOpen').addEventListener('click',async()=>{if(!confirmDiscard())return;try{const d=await window.studio?.openFile();if(!d)return;changeSource(d.content,d.name);state.filePath=d.path;setDirty(false);status('Arquivo aberto: '+d.name);}catch(e){notify(e.message);}});
async function saveFile(saveAs=false){try{const d=await window.studio?.saveFile({name:state.fileName,path:state.filePath,content:input.value,saveAs});if(d){state.filePath=d.path;state.fileName=d.name;$('#filename').textContent=d.name;setDirty(false);status('Arquivo salvo: '+d.name);}}catch(e){notify(e.message);}}
$('#btnSave').addEventListener('click',()=>saveFile());
$('#btnExport').addEventListener('click',async()=>{if(!state.result){notify('Analise o código antes de exportar.');return;}try{const ok=await window.studio?.exportReport(reportText(state.result));if(ok)notify('Relatório exportado.');}catch(e){notify(e.message);}});
$('#examples').addEventListener('click',async e=>{
  const b=e.target.closest('[data-example]');if(!b)return;if(!confirmDiscard())return;
  try{const s=await window.studio?.loadSample(b.dataset.example);if(s===undefined)return;changeSource(s,b.dataset.example);$$('[data-example]').forEach(x=>x.classList.toggle('active',x===b));setDirty(false);status('Exemplo aberto: '+b.dataset.example);}catch(err){notify(err.message);}
});
document.addEventListener('keydown',e=>{if(!(e.ctrlKey||e.metaKey))return;
  const k=e.key.toLowerCase();if(k==='enter'){e.preventDefault();runAnalysis();}else if(k==='s'){e.preventDefault();saveFile(e.shiftKey);}else if(k==='o'){e.preventDefault();$('#btnOpen').click();}else if(k==='1'){e.preventDefault();setView('simulator');}else if(k==='2'){e.preventDefault();setView('tokens');}else if(k==='3'){e.preventDefault();setView('simulator');}else if(k==='4'){e.preventDefault();setView('grammar');}
});
/** Comunicação de atualização: consulta, download e instalação confirmada. */
function showUpdate(data){
  if(!data)return;
  currentUpdate=data;$('#updateVersion').textContent='v'+String(data.version||'5.1.0');
  $('#updateMessage').textContent=String(data.message||'');
  const progress=Number(data.progress);
  $('#updateProgressWrap').hidden=!(data.status==='downloading'&&Number.isFinite(progress));
  $('#updateProgressBar').style.width=Math.min(100,Math.max(0,progress||0))+'%';
  const labels={idle:'Verificar atualizações',checking:'Verificando...',available:'Baixar atualização',downloading:'Baixando...',downloaded:'Instalar e reiniciar',installing:'Instalando...',current:'Verificar novamente',error:'Tentar novamente',manual:'Abrir Releases'};
  $('#btnUpdate').textContent=labels[data.status]||'Verificar atualizações';
  $('#btnUpdate').disabled=['checking','downloading','installing'].includes(data.status);
  $('#btnUpdatesTop').title=String(data.message||'Atualizações');
  $('#btnUpdatesTop').textContent=['available','downloaded'].includes(data.status)?'⬆':'↻';
}
async function updateAction(){
  if(!window.studio)return;
  try{
    if(!currentUpdate?.canAutoUpdate){await window.studio.openReleases();return;}
    if(currentUpdate.status==='available'){await window.studio.downloadUpdate();return;}
    if(currentUpdate.status==='downloaded'){
      if(!window.confirm((state.dirty?'Há código não salvo.\\n\\n':'')+'Instalar a atualização e reiniciar o MiniPascal Studio?'))return;
      if(state.dirty){await saveFile();if(state.dirty){notify('Salve o código antes de instalar.');return;}}
      await window.studio.installUpdate();return;
    }
    await window.studio.checkForUpdates();
  }catch(error){notify('Atualização: '+String(error?.message||error));}
}
$('#btnUpdate').addEventListener('click',updateAction);
$('#btnUpdatesTop').addEventListener('click',updateAction);
$('#btnReleases').addEventListener('click',async()=>{try{await window.studio?.openReleases();}catch(e){notify(e.message);}});
async function init(){try{if(!window.studio){status('Pré-visualização visual — execute com npm start');return;}
  window.studio.onUpdateState(showUpdate);showUpdate(await window.studio.updateStatus());state.grammar=await window.studio.grammar();state.examples=await window.studio.samples();$('#examples').innerHTML=state.examples.map((f,i)=>`<button class="example-item" data-example="${escapeHTML(f.name)}"><span class="example-dot"></span><span>${escapeHTML(f.title)}</span></button>`).join('');updateStats();renderInspector();
}catch(err){notify(err.message);}}
setDirty(false);refreshEditor();updateTimeline();init();

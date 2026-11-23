'use strict';
/** Controlador de interface. A análise é realizada em Worker Thread pelo núcleo SLR(1). */
const $=selector=>document.querySelector(selector);
const $$=selector=>Array.from(document.querySelectorAll(selector));
const {escapeHTML,offsetAt,sourceLine,actionInfo}=window.MiniPascalUI;
const tree=window.MiniPascalTree;
const sample=`program exemplo;
var contador: integer;
begin
  contador := 10;
  contador := contador + 5;
  while contador > 0 do
    contador := contador - 1;
end.`;
const input=$('#codeInput');
input.value=sample;
const state={
  result:null,grammar:null,step:0,mode:'code',dynamicTab:'simulator',staticTab:'tokens',
  fileName:'exemplo.pas',filePath:null,dirty:false,font:16,scale:1,speed:700,
  playing:false,interval:null,selectedToken:-1,grammarTab:'states',inspectState:0,followState:true,
  selectedError:0,zoom:1,collapsed:new Set(),manualFocus:null,examples:[],sourceVersion:0,analyzing:false,update:null
};
function toast(message){const el=$('#toast');el.textContent=String(message);el.classList.add('visible');clearTimeout(toast.timeout);toast.timeout=setTimeout(()=>el.classList.remove('visible'),3800);}
function status(message){$('#statusText').textContent=message;}
function setDirty(value){state.dirty=value;$('#dirtyFlag').hidden=!value;}
function syntaxColor(code){
  const reg=/\/\*[\s\S]*?(?:\*\/|$)|\{[^}\n]*\}|"[^"\r\n]*"|'[^'\r\n]*'|\b(?:program|var|begin|end|integer|real|char|string|procedure|if|then|else|while|do|div|mod)\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|:=|<=|>=|<>|[+\-*\/=<>]/gi;
  let output='',from=0;
  for(const match of code.matchAll(reg)){
    output+=escapeHTML(code.slice(from,match.index));
    const text=match[0],kind=text.startsWith('/*')||text.startsWith('{')?'cm':/^['"]/.test(text)?'str':/^\d/.test(text)?'num':/^[a-z]/i.test(text)&&!['mod','div'].includes(text.toLowerCase())?'kw':'op';
    output+=`<span class="${kind}">${escapeHTML(text)}</span>`;from=match.index+text.length;
  }
  return output+escapeHTML(code.slice(from));
}
function activeToken(){const step=state.result?.passos[state.step];return state.manualFocus|| (state.selectedToken>=0?state.result?.tokens[state.selectedToken]:step?.detalhes.token);}
function highlightedCode(){
  const content=input.value,t=activeToken();if(!t?.lexema)return syntaxColor(content)+'\n';
  const start=offsetAt(content,t.linha,t.coluna),end=Math.min(content.length,start+t.lexema.length);
  return syntaxColor(content.slice(0,start))+`<span class="hit">${escapeHTML(content.slice(start,end))}</span>`+syntaxColor(content.slice(end))+'\n';
}
function scrollTogether(){const h=$('#codeHighlight'),nums=$('#lineNumbers');h.scrollTop=input.scrollTop;h.scrollLeft=input.scrollLeft;nums.scrollTop=input.scrollTop;}
function cursorInfo(){const text=input.value.slice(0,input.selectionStart),parts=text.split(/\r\n|\r|\n/);$('#editorCaret').textContent=`Linha ${parts.length}, coluna ${parts.at(-1).length+1}`;}
function refreshEditor(){
  $('#codeHighlight').innerHTML=highlightedCode();
  const count=input.value.split(/\r\n|\r|\n/).length;
  $('#editorLines').textContent=`${count} linha${count===1?'':'s'}`;
  const currentLine=activeToken()?.linha??0;
  const errorLines=new Set([...(state.result?.errosLexicos??[]),...(state.result?.errosSintaticos??[])].map(e=>e.linha));
  $('#lineNumbers').innerHTML=Array.from({length:count},(_,i)=>`<span class="${i+1===currentLine?'line-active':''} ${errorLines.has(i+1)?'line-error':''}">${i+1}</span>`).join('');
  cursorInfo();scrollTogether();
}
function pause(){if(state.interval)clearInterval(state.interval);state.interval=null;state.playing=false;$('#btnPlay').textContent='▶';}
function invalidate(){
  pause();state.result=null;state.step=0;state.selectedToken=-1;state.manualFocus=null;state.sourceVersion++;setDirty(true);
  refreshSummary();updateTimeline();renderDynamic();renderStatic();
}
function changeSource(content,name,markDirty=true){
  input.value=content;state.fileName=name||'novo.pas';state.filePath=null;
  $('#selectedExample').textContent=state.fileName;invalidate();setDirty(markDirty);refreshEditor();
}
function applyPreferences(){
  document.documentElement.style.setProperty('--ui-scale',String(state.scale));
  document.documentElement.style.setProperty('--code-font',state.font+'px');
  $('#speed').value=String(state.speed);
  refreshEditor();
}
function savePreferences(){window.studio?.saveSettings({scale:state.scale,font:state.font,speed:state.speed}).catch(()=>{});}
function setMode(mode){
  if(!['code','dynamic','static'].includes(mode))return;
  state.mode=mode;
  $$('.studio-view').forEach(view=>view.hidden=view.id!==`view-${mode}`);
  $$('.nav-item').forEach(b=>{const active=b.dataset.mode===mode;b.classList.toggle('active',active);active?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current');});
  $('#viewTitle').textContent={code:'Código',dynamic:'Análise dinâmica',static:'Dados estáticos'}[mode];
  closeExamples();
  if(mode==='dynamic'){updateTimeline();renderDynamic();}
  if(mode==='static'){if(state.followState)state.inspectState=state.result?.passos[state.step]?.detalhes.estado||state.inspectState;renderStatic();}
}
function closeExamples(){$('#examplesMenu').hidden=true;$('#btnExamples').setAttribute('aria-expanded','false');}
function refreshSummary(){
  const r=state.result,errors=(r?.errosLexicos.length||0)+(r?.errosSintaticos.length||0);
  $('#statResult').textContent=!r?'Aguardando análise':r.aceito?'Aceito pela gramática':'Análise com erros';
  $('#statResult').className=!r?'':r.aceito?'accepted':'rejected';
  $('#statTokens').textContent=r?`${r.tokens.length} tokens`:'— tokens';
  $('#statSteps').textContent=r?`${r.passos.length} passos`:'— passos';
  $('#statErrors').textContent=r?`${errors} erros`:'— erros';
  $('#errorTabCount').textContent=errors?`(${errors})`:'';
  $('#navErrors').hidden=!errors;$('#navErrors').textContent=errors;
  $('#btnExport').disabled=!r;
}
function focusedCode(step){
  if(!step)return {line:'—',html:'<span>Execute uma análise para acompanhar o código.</span>'};
  const t=step.detalhes.token;
  if(!t?.linha)return {line:'—',html:'<span>Fim da entrada</span>'};
  const source=sourceLine(input.value,t.linha),start=Math.max(0,(t.coluna||1)-1),end=Math.min(source.length,start+(t.lexema?.length||0));
  const html=escapeHTML(source.slice(0,start))+(start<end?`<span class="focus-hit">${escapeHTML(source.slice(start,end))}</span>`:'')+escapeHTML(source.slice(end));
  return {line:t.linha,html:html||'<span>(linha em branco)</span>'};
}
function updateTimeline(){
  const steps=state.result?.passos??[],step=steps[state.step];
  const info=actionInfo(step,state.grammar),focus=focusedCode(step);
  $('#timelinePos').textContent=steps.length?`Etapa ${state.step+1} de ${steps.length}`:'Nenhuma etapa';
  $('#timelineState').textContent=step?`Estado q${step.detalhes.estado}`:'—';
  const range=$('#stepRange');range.disabled=!steps.length;range.max=Math.max(0,steps.length-1);range.value=state.step;
  $('#focusLine').textContent=String(focus.line);$('#focusLabel').textContent=step?.detalhes.tipo==='REDUCE'?'Linha do próximo token':'Linha analisada';$('#focusedCode').innerHTML=focus.html;
  $('#actionTitle').textContent=info.title;$('#actionExplanation').textContent=info.description;
  $('#actionTechnical').textContent=info.technical||'';
  $('#actionBadge').className='action-badge '+info.kind;
  $('#actionBadge').textContent={shift:'CONSUMIU',reduce:'REDUZIU',accept:'ACEITOU',error:'ERRO',idle:'AGUARDANDO'}[info.kind];
  [['btnFirst',!steps.length||state.step===0],['btnPrev',!steps.length||state.step===0],['btnNext',!steps.length||state.step===steps.length-1],['btnLast',!steps.length||state.step===steps.length-1],['btnPlay',steps.length<2]].forEach(([id,disabled])=>{$('#'+id).disabled=disabled;});
  $('#btnPlay').textContent=state.playing?'Ⅱ':'▶';
}
function setStep(index){
  const steps=state.result?.passos??[];if(!steps.length)return;
  state.step=Math.max(0,Math.min(steps.length-1,index));state.selectedToken=-1;state.manualFocus=null;
  if(state.followState)state.inspectState=steps[state.step].detalhes.estado;
  updateTimeline();renderDynamic();refreshEditor();if(state.mode==='static')renderStatic();
}
function play(){
  if(state.playing){pause();return;}
  if((state.result?.passos.length??0)<2)return;
  if(state.step===state.result.passos.length-1)setStep(0);
  state.playing=true;updateTimeline();
  state.interval=setInterval(()=>{if(state.step>=state.result.passos.length-1){pause();updateTimeline();return;}setStep(state.step+1);},state.speed);
}
async function runAnalysis(){
  if(!window.studio){toast('A análise só está disponível dentro do aplicativo Electron.');return;}
  pause();const currentSource=input.value,version=state.sourceVersion;
  state.analyzing=true;$('#btnRun').disabled=true;$('#btnRun').textContent='Analisando...';status('Analisando código...');
  try{
    const result=await window.studio.analyze(currentSource);
    if(version!==state.sourceVersion){toast('O código foi editado: o resultado anterior foi descartado.');return;}
    state.result=result;state.step=0;state.selectedToken=-1;state.manualFocus=null;state.selectedError=0;state.collapsed.clear();state.followState=true;
    refreshSummary();updateTimeline();renderDynamic();renderStatic();refreshEditor();
    if(result.errosLexicos.length){state.staticTab='errors';setMode('static');}
    else{state.dynamicTab='simulator';setMode('dynamic');}
    status(result.aceito?'Programa aceito sintaticamente':`Análise terminou com ${result.errosLexicos.length+result.errosSintaticos.length} erros.`);
  }catch(error){toast('Não foi possível analisar: '+String(error?.message||error));status('Análise interrompida');}
  finally{state.analyzing=false;$('#btnRun').disabled=false;$('#btnRun').innerHTML='<span aria-hidden="true">▶</span> Analisar código';}
}
function empty(title,text=''){return `<div class="empty-state"><div><strong>${escapeHTML(title)}</strong><p>${escapeHTML(text)}</p></div></div>`;}
function renderSimulator(){
  const trace=state.result?.passos[state.step];if(!trace)return empty('Sem passos SLR(1)','Faça uma análise para acompanhar a pilha e as decisões do Parser.');
  const d=trace.detalhes,p=state.grammar?.productions[d.producao];
  const operation=d.tipo==='SHIFT'?`SHIFT → q${d.destinoShift}`:d.tipo==='REDUCE'?`REDUCE r${d.producao}`:d.tipo;
  return `<div class="detail-grid">
    <div class="detail-card"><div class="label">Estado consultado</div><div class="value">q${d.estado}</div></div>
    <div class="detail-card"><div class="label">Token de entrada</div><div class="value" title="${escapeHTML(d.token?.lexema||'$')}">${escapeHTML(d.token?.lexema||'$')}</div></div>
    <div class="detail-card"><div class="label">Terminal</div><div class="value">${escapeHTML(d.terminal)}</div></div>
    <div class="detail-card"><div class="label">Decisão da tabela ACTION</div><div class="value">${escapeHTML(operation)}</div></div>
  </div>
  <div class="section-label">Pilha antes da operação</div>
  <div class="stack-chips"><span class="chip state">0</span>${d.simbolos.map((sym,i)=>`<span class="chip">${escapeHTML(sym)}</span><span class="chip state">${d.estados[i+1]}</span>`).join('')}</div>
  ${p?`<div class="section-label">Produção reconhecida</div><div class="code-box">[${p.id}] ${escapeHTML(p.lhs)} → ${escapeHTML(p.rhs.join(' ')||'ε')}</div>`:''}
  <div class="section-label">Próximos símbolos</div><div class="code-box">${escapeHTML(trace.entrada)}</div>
  <p class="hint">A pilha representa o estado imediatamente anterior à ação. A árvore representa as reduções aplicadas até a etapa selecionada.</p>`;
}
function renderTree(){
  const r=state.result,g=state.grammar;if(!r?.passos.length||!g)return empty('Árvore ainda não construída','Execute a análise e avance pelas reduções.');
  const built=tree.build(r.passos,g.productions,state.step),layout=tree.layout(built.roots,state.collapsed,360);
  const nodeW=148,nodeH=48;
  const edges=layout.edges.map(e=>`<path class="tree-edge" d="M${e.x1} ${e.y1} C${e.x1} ${e.y1+25} ${e.x2} ${e.y2-25} ${e.x2} ${e.y2}"/>`).join('');
  const nodes=layout.nodes.map(n=>{
    const label=n.label.length>17?n.label.slice(0,16)+'…':n.label;
    return `<g class="tree-node-svg ${n.terminal?'terminal':''}" data-node="${n.id}" role="button" tabindex="0" aria-label="${escapeHTML(n.label)}" transform="translate(${n.x},${n.y})"><title>${escapeHTML(n.label)}${n.production?' — Produção '+n.production.id:''}</title><rect width="${nodeW}" height="${nodeH}" rx="9"/><text x="${nodeW/2}" y="${nodeH/2+5}" text-anchor="middle">${escapeHTML(label)}</text>${n.hasChildren?`<text x="137" y="15" text-anchor="end" style="font-size:13px">${n.collapsed?'+':'−'}</text>`:''}</g>`;
  }).join('');
  const graphic=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" width="${Math.round(layout.width*state.zoom)}" height="${Math.round(layout.height*state.zoom)}" aria-label="Árvore gráfica de derivação">${edges}${nodes}</svg>`;
  return `<div class="tree-actions"><strong>Derivação até a etapa ${state.step+1}</strong><div><button id="treeZoomOut" title="Diminuir zoom">−</button><button id="treeZoomReset" title="Zoom padrão">${Math.round(state.zoom*100)}%</button><button id="treeZoomIn" title="Aumentar zoom">+</button>${state.collapsed.size?'<button id="treeExpand" title="Expandir todos os nós">Expandir todos</button>':''}<button id="treeExport" title="Exportar árvore em SVG">Exportar SVG</button></div></div>
    ${built.interrupted?`<p class="tree-caption">${escapeHTML(built.reason)}</p>`:''}
    ${layout.truncated?'<p class="tree-caption">Árvore extensa: alguns nós foram omitidos para preservar o desempenho. Recolha ramos para explorar melhor.</p>':''}
    <div class="tree-canvas" id="treeCanvas">${graphic}</div>
    <p class="tree-caption">Clique nos nós para recolher ou expandir ramos. SHIFT cria folhas; REDUCE agrupa os símbolos reconhecidos.</p>`;
}
function renderDynamic(){
  $$('.analysis-tabs button[data-dynamic-tab]').forEach(b=>{const active=b.dataset.dynamicTab===state.dynamicTab;b.classList.toggle('active',active);b.setAttribute('aria-selected',active?'true':'false');});
  $('#dynamicContent').innerHTML=state.dynamicTab==='tree'?renderTree():renderSimulator();
}
function renderTokens(){
  const tokens=state.result?.tokens??[];
  if(!tokens.length)return empty('Ainda não há tokens','Analise um código para ver os tokens reconhecidos pelo Lexer.');
  return `<p class="hint">Clique em um token para abrir a sua localização no editor.</p><div class="table-scroll"><table class="data-table"><thead><tr><th>#</th><th>Lexema</th><th>Tipo</th><th>Terminal</th><th>Posição</th></tr></thead><tbody>${tokens.map((t,i)=>`<tr data-token="${i}" class="${state.selectedToken===i?'selected':''}"><td>${i+1}</td><td class="mono">${escapeHTML(t.lexema)}</td><td>${escapeHTML(t.descricao)}</td><td class="mono">${escapeHTML(t.terminal)}</td><td>${t.linha}:${t.coluna}</td></tr>`).join('')}</tbody></table></div>`;
}
function errorsList(){const r=state.result;return [...(r?.errosLexicos||[]).map(e=>({...e,kind:'Léxico'})),...(r?.errosSintaticos||[]).map(e=>({...e,kind:'Sintático'}))];}
function renderErrors(){
  if(!state.result)return empty('Sem diagnósticos','Execute uma análise primeiro.');
  const errors=errorsList();if(!errors.length)return '<div class="healthy">✓ Nenhum erro encontrado na análise léxica ou sintática.</div>';
  return `<div class="error-nav"><strong>${errors.length} diagnóstico${errors.length===1?'':'s'}</strong><div><button type="button" class="small-button" id="prevError" title="Erro anterior">◀ Anterior</button> <button type="button" class="small-button" id="nextError" title="Próximo erro">Próximo ▶</button></div></div>
    ${errors.map((e,i)=>`<div class="problem" data-error="${i}" role="button" tabindex="0" title="Abrir no editor"><strong>${escapeHTML(e.kind)} · Linha ${e.linha}, coluna ${e.coluna}</strong><p>${escapeHTML(e.mensagem)}</p></div>`).join('')}`;
}
function renderGrammar(){
  const g=state.grammar;if(!g)return empty('Carregando a gramática...');
  const selected=Math.max(0,Math.min(g.states.length-1,state.inspectState)),p=g.productions;
  let content='';
  if(state.grammarTab==='rules')content=`<div class="table-scroll"><table class="data-table"><thead><tr><th>Regra</th><th>Produção</th></tr></thead><tbody>${p.map(a=>`<tr><td>${a.id}</td><td class="mono">${escapeHTML(a.lhs)} → ${escapeHTML(a.rhs.join(' ')||'ε')}</td></tr>`).join('')}</tbody></table></div>`;
  else if(state.grammarTab==='sets')content=`<div class="table-scroll"><table class="data-table"><thead><tr><th>Não terminal</th><th>FIRST</th><th>FOLLOW</th></tr></thead><tbody>${g.nonterminals.map(nt=>`<tr><td class="mono">${escapeHTML(nt)}</td><td>${escapeHTML((g.first[nt]||[]).join(', '))}</td><td>${escapeHTML((g.follow[nt]||[]).join(', '))}</td></tr>`).join('')}</tbody></table></div>`;
  else if(state.grammarTab==='table')content=`<div class="table-scroll"><table class="data-table"><thead><tr><th>Terminal</th><th>ACTION[q${selected}]</th></tr></thead><tbody>${Object.entries(g.actions[selected]||{}).map(([term,a])=>`<tr class="${state.result?.passos[state.step]?.detalhes.terminal===term?'selected':''}"><td>${escapeHTML(term)}</td><td>${escapeHTML(a.kind==='SHIFT'?'SHIFT q'+a.value:a.kind==='REDUCE'?'REDUCE '+a.value:'ACCEPT')}</td></tr>`).join('')}</tbody></table></div><div class="section-label">GOTO</div><div class="stack-chips">${Object.entries(g.gotos[selected]||{}).map(([term,to])=>`<span class="chip">${escapeHTML(term)} → q${to}</span>`).join('')||'Sem transições GOTO'}</div>`;
  else content=`<div class="state-lines">${g.states[selected].map(([pid,dot])=>{const prod=p[pid],parts=[...prod.rhs];parts.splice(dot,0,'•');return escapeHTML(`[${pid}] ${prod.lhs} → ${parts.join(' ')}`);}).join('\n')}</div><div class="section-label">Transições LR(0)</div><div class="transition-list">${Object.entries(g.transitions[selected]||{}).map(([term,to])=>`<button type="button" data-state="${to}">${escapeHTML(term)} → q${to}</button>`).join('')||'Nenhuma transição'}</div>`;
  return `<p class="hint">${g.productions.length} produções · ${g.states.length} estados LR(0) · SLR(1) sem conflitos.</p>
  <div class="tab-buttons">${[['states','Estados LR(0)'],['table','ACTION / GOTO'],['sets','FIRST / FOLLOW'],['rules','Produções']].map(([key,title])=>`<button type="button" data-grammar="${key}" class="${state.grammarTab===key?'active':''}">${title}</button>`).join('')}</div>
  ${['states','table'].includes(state.grammarTab)?`<div class="state-tools"><label for="stateSelect">Estado</label><select id="stateSelect">${g.states.map((_,i)=>`<option value="${i}" ${i===selected?'selected':''}>q${i}</option>`).join('')}</select>${state.followState?'':'<button class="small-button" type="button" id="btnCurrentState">Voltar ao estado atual</button>'}</div>`:''}${content}`;
}
function renderStatic(){
  $$('.analysis-tabs button[data-static-tab]').forEach(b=>{const active=b.dataset.staticTab===state.staticTab;b.classList.toggle('active',active);b.setAttribute('aria-selected',active?'true':'false');});
  $('#staticContent').innerHTML=({tokens:renderTokens,grammar:renderGrammar,errors:renderErrors}[state.staticTab]||renderTokens)();
}
function jumpToCode(line,col=1,length=1){
  setMode('code');const pos=offsetAt(input.value,line,col);
  state.selectedToken=-1;state.manualFocus={linha:Number(line),coluna:Number(col),lexema:sourceLine(input.value,line).slice(Math.max(0,col-1),Math.max(0,col-1)+Math.max(1,length))};
  // Seleção visual na camada de syntax highlight e no próprio editor.
  input.focus();input.setSelectionRange(pos,pos+Math.max(1,length));
  const lineHeight=parseFloat(getComputedStyle(input).lineHeight)||27;
  input.scrollTop=Math.max(0,(Number(line)-3)*lineHeight);refreshEditor();
}
function saveReport(){
  if(!state.result){toast('Analise o código antes de exportar.');return;}
  const r=state.result;
  const lines=[`MiniPascal v5.3.0 — ${state.fileName}`,`ESTADOS=${r.estados}`,`ACEITO=${r.aceito}`];
  r.tokens.forEach(t=>lines.push(`TOK=<${t.lexema}, ${t.descricao}> [linha ${t.linha}, coluna ${t.coluna}]`));
  r.errosLexicos.forEach(e=>lines.push(`LEX=Linha ${e.linha}, coluna ${e.coluna}: ${e.mensagem}`));
  r.errosSintaticos.forEach(e=>lines.push(`SYN=Linha ${e.linha}, coluna ${e.coluna}: ${e.mensagem}`));
  r.passos.forEach(p=>lines.push(`STEP=${p.passo}|${p.pilha}|${p.entrada}|${p.acao}`));
  window.studio?.exportReport(lines.join('\n')+'\n').then(ok=>{if(ok)toast('Relatório exportado com sucesso.');}).catch(e=>toast(e.message));
}
async function saveFile(saveAs=false){
  try{
    const content=input.value;
    const result=await window.studio?.saveFile({content,name:state.fileName,path:state.filePath,saveAs});
    if(!result)return false;
    state.fileName=result.name;state.filePath=result.path;$('#selectedExample').textContent=state.fileName;
    if(input.value===content)setDirty(false);
    status('Arquivo salvo: '+result.name);return !state.dirty;
  }catch(error){toast('Erro ao salvar: '+error.message);return false;}
}
function confirmDiscard(){return !state.dirty||window.confirm('Há alterações não salvas. Descartar essas alterações?');}
function newFile(){if(!confirmDiscard())return;changeSource('program novo;\nbegin\n  \nend.','novo.pas',true);setMode('code');input.focus();}
async function openFile(){
  if(!confirmDiscard())return;
  try{const file=await window.studio?.openFile();if(!file)return;changeSource(file.content,file.name,false);state.filePath=file.path;setMode('code');status('Arquivo aberto: '+file.name);}
  catch(e){toast('Não foi possível abrir: '+e.message);}
}
async function openExample(button){
  if(!confirmDiscard())return;
  try{const content=await window.studio?.loadSample(button.dataset.example);if(content===undefined)return;
    changeSource(content,button.dataset.example,false);$('#selectedExample').textContent=button.textContent.trim();
    $$('#examples [data-example]').forEach(e=>e.classList.toggle('active',e===button));closeExamples();setMode('code');}
  catch(error){toast('Não foi possível abrir o exemplo: '+error.message);}
}
async function closeRequest(){
  if(!window.studio)return;
  if(state.dirty){
    const choice=await window.studio.closeChoice();
    if(choice==='cancel')return;
    if(choice==='save'&&!(await saveFile()))return;
  }
  await window.studio.closeApp();
}
function updatePanel(data){
  if(!data||typeof data!=='object')return;state.update=data;
  $('#updateVersion').textContent='v'+String(data.version||'5.3.0');
  $('#updateMessage').textContent=String(data.message||'');
  const p=Number(data.progress);
  $('#updateProgressWrap').hidden=!(data.status==='downloading'&&Number.isFinite(p));
  $('#updateProgressBar').style.width=(Number.isFinite(p)?Math.min(100,Math.max(0,p)):0)+'%';
  const labels={checking:'Verificando...',preparing:'Nova tentativa agendada',available:'Baixar atualização',downloading:'Baixando...',downloaded:'Instalar e reiniciar',installing:'Instalando...',current:'Verificar novamente',error:'Tentar novamente',idle:'Verificar',manual:'Abrir Releases'};
  $('#btnUpdate').textContent=labels[data.status]||'Verificar';
  $('#btnUpdate').disabled=['checking','preparing','downloading','installing'].includes(data.status);
}
async function handleUpdate(){
  if(!window.studio)return;
  try{
    const data=state.update;
    if(!data?.canAutoUpdate){await window.studio.openReleases();return;}
    if(data.status==='available'){await window.studio.downloadUpdate();return;}
    if(data.status==='downloaded'){
      if(!window.confirm('Instalar a nova versão e reiniciar o MiniPascal Studio?'))return;
      if(state.dirty&&!(await saveFile())){toast('Salve o código antes de instalar.');return;}
      await window.studio.installUpdate();return;
    }
    await window.studio.checkForUpdates();
  }catch(error){toast('Atualização: '+String(error.message||error));}
}
function bindUI(){
  $$('.nav-item').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  $('#btnRun').addEventListener('click',runAnalysis);
  $('#btnExamples').addEventListener('click',()=>{const menu=$('#examplesMenu'),open=menu.hidden;menu.hidden=!open;$('#btnExamples').setAttribute('aria-expanded',String(open));});
  document.addEventListener('click',event=>{if(!event.target.closest('#examplePicker'))closeExamples();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closeExamples();});
  $('#examples').addEventListener('click',event=>{const el=event.target.closest('[data-example]');if(el)openExample(el);});
  $('#btnNew').addEventListener('click',newFile);$('#btnImport').addEventListener('click',openFile);
  $('#btnSave').addEventListener('click',()=>saveFile());$('#btnExport').addEventListener('click',saveReport);
  $('#btnHelp').addEventListener('click',()=>{state.staticTab='grammar';state.grammarTab='rules';setMode('static');});
  $('#btnFontPlus').addEventListener('click',()=>{state.font=Math.min(23,state.font+1);applyPreferences();savePreferences();});
  $('#btnFontMinus').addEventListener('click',()=>{state.font=Math.max(13,state.font-1);applyPreferences();savePreferences();});
  $('#btnScalePlus').addEventListener('click',()=>{state.scale=Math.min(1.5,Math.round((state.scale+.1)*10)/10);applyPreferences();savePreferences();});
  $('#btnScaleMinus').addEventListener('click',()=>{state.scale=Math.max(.9,Math.round((state.scale-.1)*10)/10);applyPreferences();savePreferences();});
  $('#btnFirst').addEventListener('click',()=>{pause();setStep(0);});
  $('#btnLast').addEventListener('click',()=>{pause();setStep((state.result?.passos.length||1)-1);});
  $('#btnPrev').addEventListener('click',()=>{pause();setStep(state.step-1);});
  $('#btnNext').addEventListener('click',()=>{pause();setStep(state.step+1);});
  $('#btnPlay').addEventListener('click',play);
  $('#stepRange').addEventListener('input',e=>{pause();setStep(Number(e.target.value));});
  $('#speed').addEventListener('change',e=>{const playing=state.playing;pause();state.speed=Number(e.target.value);savePreferences();if(playing)play();});
  $$('[data-dynamic-tab]').forEach(b=>b.addEventListener('click',()=>{state.dynamicTab=b.dataset.dynamicTab;renderDynamic();}));
  $$('[data-static-tab]').forEach(b=>b.addEventListener('click',()=>{state.staticTab=b.dataset.staticTab;renderStatic();}));
  $('#staticContent').addEventListener('click',event=>{
    const t=event.target.closest('[data-token]');if(t&&state.result){const token=state.result.tokens[Number(t.dataset.token)];jumpToCode(token.linha,token.coluna,token.lexema.length);return;}
    const e=event.target.closest('[data-error]');if(e){const list=errorsList();state.selectedError=Number(e.dataset.error);const item=list[state.selectedError];if(item)jumpToCode(item.linha,item.coluna,item.lexema?.length||item.encontrado?.length||1);return;}
    if(event.target.closest('#nextError')){const list=errorsList();if(list.length){state.selectedError=(state.selectedError+1)%list.length;const e=list[state.selectedError];jumpToCode(e.linha,e.coluna,e.lexema?.length||1);}return;}
    if(event.target.closest('#prevError')){const list=errorsList();if(list.length){state.selectedError=(state.selectedError-1+list.length)%list.length;const e=list[state.selectedError];jumpToCode(e.linha,e.coluna,e.lexema?.length||1);}return;}
    const g=event.target.closest('[data-grammar]');if(g){state.grammarTab=g.dataset.grammar;renderStatic();return;}
    const q=event.target.closest('[data-state]');if(q){state.inspectState=Number(q.dataset.state);state.followState=false;renderStatic();return;}
    if(event.target.closest('#btnCurrentState')){state.followState=true;state.inspectState=state.result?.passos[state.step]?.detalhes.estado||0;renderStatic();}
  });
  $('#staticContent').addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-error]')){event.preventDefault();event.target.click();}});
  $('#staticContent').addEventListener('change',event=>{if(event.target.id==='stateSelect'){state.inspectState=Number(event.target.value);state.followState=false;renderStatic();}});
  $('#dynamicContent').addEventListener('click',event=>{
    if(event.target.closest('#treeZoomOut')){state.zoom=Math.max(.5,state.zoom-.15);renderDynamic();return;}
    if(event.target.closest('#treeZoomIn')){state.zoom=Math.min(2.25,state.zoom+.15);renderDynamic();return;}
    if(event.target.closest('#treeZoomReset')){state.zoom=1;renderDynamic();return;}
    if(event.target.closest('#treeExpand')){state.collapsed.clear();renderDynamic();return;}
    if(event.target.closest('#treeExport')){const svg=$('#treeCanvas svg');if(svg)window.studio?.exportTree(svg.outerHTML).then(ok=>{if(ok)toast('Árvore SVG exportada.');}).catch(e=>toast(e.message));return;}
    const node=event.target.closest('[data-node]');if(node){const id=Number(node.dataset.node);state.collapsed.has(id)?state.collapsed.delete(id):state.collapsed.add(id);renderDynamic();}
  });
  $('#dynamicContent').addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-node]')){event.preventDefault();event.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
  input.addEventListener('input',()=>{invalidate();refreshEditor();});
  input.addEventListener('scroll',scrollTogether);input.addEventListener('click',cursorInfo);input.addEventListener('keyup',cursorInfo);
  input.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();input.setRangeText('  ',input.selectionStart,input.selectionEnd,'end');input.dispatchEvent(new Event('input'));}});
  document.addEventListener('keydown',event=>{
    if((event.altKey)&&['ArrowRight','ArrowLeft'].includes(event.key)&&state.mode==='dynamic'){event.preventDefault();pause();setStep(state.step+(event.key==='ArrowRight'?1:-1));return;}
    if(!event.ctrlKey&&!event.metaKey)return;
    const k=event.key.toLowerCase();
    if(k==='enter'){event.preventDefault();runAnalysis();}
    if(k==='s'){event.preventDefault();saveFile(event.shiftKey);}
    if(k==='o'){event.preventDefault();openFile();}
    if(k==='n'){event.preventDefault();newFile();}
    if(k==='1'){event.preventDefault();setMode('code');}
    if(k==='2'){event.preventDefault();setMode('dynamic');}
    if(k==='3'){event.preventDefault();setMode('static');}
  });
  $('#btnUpdate').addEventListener('click',handleUpdate);
  $('#btnReleases').addEventListener('click',()=>window.studio?.openReleases().catch(e=>toast(e.message)));
}
async function initialize(){
  bindUI();setDirty(false);refreshEditor();refreshSummary();updateTimeline();renderDynamic();renderStatic();
  if(!window.studio){status('Pré-visualização. Execute no Electron para usar os arquivos e o Parser.');return;}
  try{
    window.studio.onCloseRequest(()=>{void closeRequest();});
    window.studio.onUpdateState(updatePanel);updatePanel(await window.studio.updateStatus());
    state.grammar=await window.studio.grammar();
    state.examples=await window.studio.samples();
    $('#examples').innerHTML=state.examples.map(item=>`<button class="example-item" type="button" data-example="${escapeHTML(item.name)}">${escapeHTML(item.title)}</button>`).join('');
    const settings=await window.studio.getSettings();state.font=settings.font;state.scale=settings.scale;state.speed=settings.speed;applyPreferences();
    renderStatic();
  }catch(error){toast('Não foi possível carregar as configurações: '+error.message);}
}
initialize();

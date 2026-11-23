'use strict';
/**
 * Controlador da interface didática. O Renderer não toma decisões gramaticais:
 * ele apenas exibe a saída estruturada do Lexer/Parser produzida na Worker Thread.
 * A etapa corrente é compartilhada pelo simulador e pela árvore, mesmo em abas distintas.
 */
const $=selector=>document.querySelector(selector);
const $$=selector=>Array.from(document.querySelectorAll(selector));
const {escapeHTML,offsetAt,sourceLine,actionInfo,tokenReport,analysisReport}=window.MiniPascalUI;
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
  result:null,grammar:null,step:0,mode:'code',staticTab:'tokens',
  fileName:'exemplo.pas',filePath:null,dirty:false,speed:700,
  playing:false,interval:null,selectedToken:-1,
  selectedError:0,timelineTouched:false,treeInitiallyOpened:false,zoom:1,treePan:{x:0,y:0},treeGeometry:null,collapsed:new Set(),manualFocus:null,examples:[],sourceVersion:0,analyzing:false,update:null
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
  const content=input.value;
  const current=activeToken();
  const marks=[];
  for(const error of [...(state.result?.errosLexicos??[]),...(state.result?.errosSintaticos??[])]){
    const start=offsetAt(content,error.linha,error.coluna);
    const line=sourceLine(content,error.linha);
    const column=Math.max(0,error.coluna-1);
    const length=Math.max(1,Math.min(line.length-column,(error.lexema||error.encontrado||'').length||1));
    if(start<content.length)marks.push({start,end:Math.min(content.length,start+length),kind:'error-token'});
  }
  if(current?.lexema){
    const start=offsetAt(content,current.linha,current.coluna);
    marks.push({start,end:Math.min(content.length,start+current.lexema.length),kind:'hit'});
  }
  // Os erros prevalecem sobre o destaque do token selecionado.
  const bounds=new Set([0,content.length]);
  marks.forEach(m=>{bounds.add(m.start);bounds.add(m.end);});
  const points=[...bounds].sort((a,b)=>a-b);
  let output='';
  for(let i=0;i<points.length-1;i++){
    const a=points[i],b=points[i+1],section=content.slice(a,b);
    const m=marks.find(x=>x.kind==='error-token'&&x.start<=a&&x.end>=b)
      ||marks.find(x=>x.kind==='hit'&&x.start<=a&&x.end>=b);
    output+=m?`<span class="${m.kind}">${escapeHTML(section)}</span>`:syntaxColor(section);
  }
  return output+'\n';
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
// Persistimos apenas a velocidade; zoom e tamanho de fonte globais foram retirados
// porque deformavam botões, textos da navegação e a área reservada ao código.
function applyPreferences(){ $('#speed').value=String(state.speed); }
function savePreferences(){window.studio?.saveSettings({speed:state.speed}).catch(()=>{});}
function setMode(mode){
  if(!['code','dynamic','tree','static'].includes(mode))return;
  state.mode=mode;
  document.body.classList.toggle('code-mode',mode==='code');
  $$('.studio-view').forEach(view=>view.hidden=view.id!==`view-${mode}`);
  $$('.nav-item').forEach(b=>{const active=b.dataset.mode===mode;b.classList.toggle('active',active);active?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current');});
  $('#viewTitle').textContent={code:'Código',dynamic:'Análise dinâmica',tree:'Árvore de derivação',static:'Dados estáticos'}[mode];
  closeExamples();
  if(mode==='dynamic'){updateTimeline();renderDynamic();}
  if(mode==='tree'){
    // Na primeira abertura após uma análise, começamos pela derivação pronta.
    // Se o estudante já navegou na linha do tempo, respeitamos sua etapa.
    const steps=state.result?.passos;
    if(!state.timelineTouched&&state.result?.aceito&&steps?.length>1)state.step=steps.length-1;
    if(!state.treeInitiallyOpened&&state.result?.passos?.length>30){
      // A árvore completa de um programa pode ocupar milhares de pixels.
      // Exibimos primeiro um resumo hierárquico legível; cada ramo expande por clique.
      const built=tree.build(state.result.passos,state.grammar?.productions??[],state.step);
      function fold(node,depth=0){
        if(depth>=3&&node.children.length){state.collapsed.add(node.id);return;}
        node.children.forEach(child=>fold(child,depth+1));
      }
      built.roots.forEach(root=>fold(root));
      state.treeInitiallyOpened=true;
    }
    renderTreeView();requestAnimationFrame(centerTree);
  }
  if(mode==='static')renderStatic();
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
  state.timelineTouched=true;
  const steps=state.result?.passos??[];if(!steps.length)return;
  state.step=Math.max(0,Math.min(steps.length-1,index));state.selectedToken=-1;state.manualFocus=null;
  updateTimeline();renderDynamic();refreshEditor();
  if(state.mode==='tree')renderTreeView();
  if(state.mode==='static')renderStatic();
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
    state.result=result;state.step=0;state.selectedToken=-1;state.manualFocus=null;state.selectedError=0;state.timelineTouched=false;state.treeInitiallyOpened=false;state.collapsed.clear();state.zoom=1;state.treePan={x:0,y:0};
    refreshSummary();updateTimeline();renderDynamic();renderStatic();renderTreeView();refreshEditor();
    if(result.errosLexicos.length){state.staticTab='errors';setMode('static');}
    else setMode('dynamic');
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
/**
 * Renderização da árvore em sua própria tela. A pilha de nós é reconstruída do
 * histórico SHIFT/REDUCE. A geometria é independente de zoom e movimento.
 * A rolagem do mouse atua sobre o cursor; arrastar move apenas o plano visual.
 */
function renderTreeView(){
  const world=$('#treeWorld'),status=$('#treeStatus'),r=state.result,g=state.grammar;
  if(!r?.passos.length||!g){
    world.innerHTML='<div class="tree-placeholder">Analise um código para construir a árvore.</div>';
    state.treeGeometry=null;status.textContent='Nenhuma derivação disponível.';
    $('#treeCenter').disabled=true;$('#treeExpand').hidden=true;return;
  }
  const built=tree.build(r.passos,g.productions,state.step),layout=tree.layout(built.roots,state.collapsed,420);
  state.treeGeometry={width:layout.width,height:layout.height};
  const edges=layout.edges.map(e=>`<path class="tree-edge" d="M${e.x1} ${e.y1} C${e.x1} ${e.y1+25} ${e.x2} ${e.y2-25} ${e.x2} ${e.y2}"/>`).join('');
  const nodes=layout.nodes.map(n=>{
    const label=n.label.length>17?n.label.slice(0,16)+'…':n.label;
    return `<g class="tree-node-svg ${n.terminal?'terminal':''}" data-node="${n.id}" role="button" tabindex="0" aria-label="${escapeHTML(n.label)}" transform="translate(${n.x},${n.y})"><title>${escapeHTML(n.label)}${n.production?' — Produção '+n.production.id:''}</title><rect width="148" height="48" rx="9"/><text x="74" y="29" text-anchor="middle">${escapeHTML(label)}</text>${n.hasChildren?`<text x="137" y="15" text-anchor="end" style="font-size:13px">${n.collapsed?'+':'−'}</text>`:''}</g>`;
  }).join('');
  world.innerHTML=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${layout.width} ${layout.height}" width="${layout.width}" height="${layout.height}" aria-label="Árvore de derivação">${edges}${nodes}</svg>`;
  world.style.width=layout.width+'px';world.style.height=layout.height+'px';
  status.textContent=`Etapa ${state.step+1} de ${r.passos.length}${built.interrupted?' · Parcial após erro':''}${layout.truncated?' · Parte dos nós ocultada por desempenho':''}`;
  if(built.interrupted&&built.reason)status.title=built.reason;
  $('#treeCenter').disabled=false;$('#treeExpand').hidden=state.collapsed.size===0;
  applyTreeTransform();
}
function applyTreeTransform(){
  const el=$('#treeWorld');
  el.style.transform=`translate(${state.treePan.x}px,${state.treePan.y}px) scale(${state.zoom})`;
  $('#treeZoomLevel').textContent=Math.round(state.zoom*100)+'%';
}
function centerTree(){
  const viewport=$('#treeViewport'),size=state.treeGeometry;if(!size)return;
  const w=viewport.clientWidth,h=viewport.clientHeight;if(!w||!h)return;
  state.zoom=Math.max(.3,Math.min(1.15,(w-85)/size.width,(h-85)/size.height));
  state.treePan={x:Math.round((w-size.width*state.zoom)/2),y:Math.round((h-size.height*state.zoom)/2)};
  applyTreeTransform();
}
function zoomTree(factor,x,y){
  const vp=$('#treeViewport');if(!state.treeGeometry)return;
  const centerX=x??vp.clientWidth/2,centerY=y??vp.clientHeight/2;
  const previous=state.zoom,next=Math.max(.3,Math.min(2.7,previous*factor));const ratio=next/previous;
  state.treePan.x=centerX-(centerX-state.treePan.x)*ratio;
  state.treePan.y=centerY-(centerY-state.treePan.y)*ratio;
  state.zoom=next;applyTreeTransform();
}
function renderDynamic(){
  // Sem subabas: a simulação é o corpo permanente da Análise dinâmica.
  $('#dynamicContent').innerHTML=renderSimulator();
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
/**
 * Exibimos apenas as produções na consulta estática. FIRST/FOLLOW, estados LR(0)
 * e tabelas ACTION/GOTO permanecem calculados no núcleo para preservar SLR(1).
 */
function renderGrammar(){
  const productions=state.grammar?.productions;
  if(!productions)return empty('Carregando as produções...');
  return `<div class="grammar-heading"><strong>${productions.length} produções da gramática Mini_Pascal</strong><span>Regras utilizadas pelo Parser</span></div>
    <div class="table-scroll grammar-table"><table class="data-table"><thead><tr><th scope="col">Nº</th><th scope="col">Produção</th></tr></thead><tbody>${productions.map(p=>`<tr><td class="mono">${p.id}</td><td class="mono">${escapeHTML(p.lhs)} → ${escapeHTML(p.rhs.join(' ')||'ε')}</td></tr>`).join('')}</tbody></table></div>`;
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
function saveReport(kind='analysis'){
  if(!state.result){toast('Analise o código antes de exportar.');return;}
  const report=kind==='tokens'?tokenReport(state.result.tokens):analysisReport(state.result,state.fileName,'5.5.0');
  window.studio?.exportReport({kind,content:report}).then(ok=>{
    if(ok)toast(kind==='tokens'?'Tokens exportados.':'Análise exportada.');
  }).catch(e=>toast(e.message));
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
  $('#updateVersion').textContent='v'+String(data.version||'5.4.0');
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
      if(!window.confirm('Instalar a nova versão e reiniciar o MiniPascal?'))return;
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
  $('#btnSave').addEventListener('click',()=>saveFile());
  $('#btnExport').addEventListener('click',()=>saveReport('analysis'));
  $('#btnExportTokens').addEventListener('click',()=>saveReport('tokens'));
  $('#btnHelp').addEventListener('click',()=>{state.staticTab='grammar';setMode('static');});
  $('#btnFirst').addEventListener('click',()=>{pause();setStep(0);});
  $('#btnLast').addEventListener('click',()=>{pause();setStep((state.result?.passos.length||1)-1);});
  $('#btnPrev').addEventListener('click',()=>{pause();setStep(state.step-1);});
  $('#btnNext').addEventListener('click',()=>{pause();setStep(state.step+1);});
  $('#btnPlay').addEventListener('click',play);
  $('#stepRange').addEventListener('input',e=>{pause();setStep(Number(e.target.value));});
  $('#speed').addEventListener('change',e=>{const playing=state.playing;pause();state.speed=Number(e.target.value);savePreferences();if(playing)play();});
  $$('[data-static-tab]').forEach(b=>b.addEventListener('click',()=>{state.staticTab=b.dataset.staticTab;renderStatic();}));
  $('#staticContent').addEventListener('click',event=>{
    const t=event.target.closest('[data-token]');if(t&&state.result){const token=state.result.tokens[Number(t.dataset.token)];jumpToCode(token.linha,token.coluna,token.lexema.length);return;}
    const e=event.target.closest('[data-error]');if(e){const list=errorsList();state.selectedError=Number(e.dataset.error);const item=list[state.selectedError];if(item)jumpToCode(item.linha,item.coluna,item.lexema?.length||item.encontrado?.length||1);return;}
    if(event.target.closest('#nextError')){const list=errorsList();if(list.length){state.selectedError=(state.selectedError+1)%list.length;const e=list[state.selectedError];jumpToCode(e.linha,e.coluna,e.lexema?.length||1);}return;}
    if(event.target.closest('#prevError')){const list=errorsList();if(list.length){state.selectedError=(state.selectedError-1+list.length)%list.length;const e=list[state.selectedError];jumpToCode(e.linha,e.coluna,e.lexema?.length||1);}return;}
  });
  $('#staticContent').addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-error]')){event.preventDefault();event.target.click();}});
  // A árvore é um mapa manipulável: somente o fundo inicia arraste.
  // Clique no nó preserva o comportamento de recolher/expandir a derivação.
  $('#treeWorld').addEventListener('click',event=>{
    const node=event.target.closest('[data-node]');if(!node)return;
    const id=Number(node.dataset.node);
    state.collapsed.has(id)?state.collapsed.delete(id):state.collapsed.add(id);
    renderTreeView();
  });
  $('#treeWorld').addEventListener('keydown',event=>{
    if((event.key==='Enter'||event.key===' ')&&event.target.matches('[data-node]')){
      event.preventDefault();event.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));
    }
  });
  let dragging=null;
  const viewport=$('#treeViewport');
  viewport.addEventListener('pointerdown',event=>{
    if(event.button!==0||event.target.closest('[data-node]')||!state.treeGeometry)return;
    dragging={id:event.pointerId,x:event.clientX,y:event.clientY,panX:state.treePan.x,panY:state.treePan.y};
    viewport.setPointerCapture(event.pointerId);viewport.classList.add('dragging');
  });
  viewport.addEventListener('pointermove',event=>{
    if(!dragging||dragging.id!==event.pointerId)return;
    state.treePan={x:dragging.panX+event.clientX-dragging.x,y:dragging.panY+event.clientY-dragging.y};
    applyTreeTransform();
  });
  function endDrag(){dragging=null;viewport.classList.remove('dragging');}
  viewport.addEventListener('pointerup',endDrag);viewport.addEventListener('pointercancel',endDrag);
  viewport.addEventListener('lostpointercapture',endDrag);
  // Operação sem mouse: setas movem o mapa, +/- aproximam e Home centraliza.
  viewport.addEventListener('keydown',event=>{
    if(event.target!==viewport||!state.treeGeometry)return;
    const moves={ArrowLeft:[-65,0],ArrowRight:[65,0],ArrowUp:[0,-65],ArrowDown:[0,65]};
    if(moves[event.key]){
      event.preventDefault();state.treePan.x-=moves[event.key][0];state.treePan.y-=moves[event.key][1];applyTreeTransform();
    }else if(event.key==='+'||event.key==='='){event.preventDefault();zoomTree(1.2);}
    else if(event.key==='-'){event.preventDefault();zoomTree(1/1.2);}
    else if(event.key==='Home'){event.preventDefault();centerTree();}
  });
  viewport.addEventListener('wheel',event=>{
    if(!state.treeGeometry)return;
    event.preventDefault();const bounds=viewport.getBoundingClientRect();
    zoomTree(event.deltaY<0?1.12:1/1.12,event.clientX-bounds.left,event.clientY-bounds.top);
  },{passive:false});
  $('#treeCenter').addEventListener('click',centerTree);
  $('#treeZoomIn').addEventListener('click',()=>zoomTree(1.2));
  $('#treeZoomOut').addEventListener('click',()=>zoomTree(1/1.2));
  $('#treeExpand').addEventListener('click',()=>{state.collapsed.clear();renderTreeView();});
  // Centro em resize apenas quando a aba estiver visível. A navegação manual
  // não é zerada em cada etapa, evitando saltos enquanto o aluno explora a árvore.
  window.addEventListener('resize',()=>{if(state.mode==='tree')applyTreeTransform();});
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
    if(k==='3'){event.preventDefault();setMode('tree');}
    if(k==='4'){event.preventDefault();setMode('static');}
  });
  $('#btnUpdate').addEventListener('click',handleUpdate);
  $('#btnReleases').addEventListener('click',()=>window.studio?.openReleases().catch(e=>toast(e.message)));
}
async function initialize(){
  bindUI();document.body.classList.add('code-mode');setDirty(false);refreshEditor();refreshSummary();updateTimeline();renderDynamic();renderStatic();
  if(!window.studio){status('Pré-visualização. Execute no Electron para usar os arquivos e o Parser.');return;}
  try{
    window.studio.onCloseRequest(()=>{void closeRequest();});
    window.studio.onUpdateState(updatePanel);updatePanel(await window.studio.updateStatus());
    state.grammar=await window.studio.grammar();
    state.examples=await window.studio.samples();
    $('#examples').innerHTML=state.examples.map(item=>`<button class="example-item" type="button" data-example="${escapeHTML(item.name)}">${escapeHTML(item.title)}</button>`).join('');
    const settings=await window.studio.getSettings();state.speed=settings.speed;applyPreferences();
    renderStatic();
  }catch(error){toast('Não foi possível carregar as configurações: '+error.message);}
}
initialize();

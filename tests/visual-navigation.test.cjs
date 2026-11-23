
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const base=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(base,'src','index.html'),'utf8');
const renderer=fs.readFileSync(path.join(base,'src','renderer.js'),'utf8');
const css=fs.readFileSync(path.join(base,'src','style.css'),'utf8');
const {symbolLabel,symbolDescription,lineProgress,errorExcerpt,escapeHTML}=require('../src/ui-utils.js');
test('não terminais recebem rótulos sem alterar terminais e produções',()=>{
  assert.equal(symbolLabel('EXPR'),'Expressão');assert.equal(symbolLabel('MATCHED'),'Comando completo');
  for(const sym of ['while','ID','NUM','ε','+','$'])assert.equal(symbolLabel(sym),sym);
  assert.match(symbolDescription('OPEN'),/else/);
  assert.match(renderer,/n\.terminal\?n\.label:symbolLabel\(n\.label\)/);
});
test('progresso por linha conta LF, CRLF e CR corretamente',()=>{
  for(const sep of ['\n','\r\n','\r']){
    const text=['a','b','c','d'].join(sep);
    assert.deepEqual(lineProgress(text,2),{position:2,total:4,percentage:50});
    assert.deepEqual(lineProgress(text,5),{position:4,total:4,percentage:100});
  }
  assert.equal(lineProgress('x',null).percentage,0);
  assert.match(html,/id="focusProgressFill"/);
});
test('diagnósticos marcam somente o trecho na coluna e escapam HTML',()=>{
  const src='if not a then a := 1;\nif x < b then x := 2;';
  assert.deepEqual(errorExcerpt(src,{linha:1,coluna:4,encontrado:'not'}),{line:'if not a then a := 1;',start:3,end:6});
  assert.deepEqual(errorExcerpt(src,{linha:2,coluna:6,encontrado:'<'}),{line:'if x < b then x := 2;',start:5,end:6});
  assert.deepEqual(errorExcerpt(src,{linha:1,coluna:4,encontrado:'else'}),{line:'if not a then a := 1;',start:3,end:3});
  assert.equal(escapeHTML('<x>'),'&lt;x&gt;');
  assert.match(renderer,/diagnostic-hit/);
  assert.match(renderer,/data-open-error/);
});
test('Anterior/Próximo percorre diagnósticos sem trocar de tela',()=>{
  const section=renderer.slice(renderer.indexOf('function selectError('),renderer.indexOf('// A árvore é um mapa manipulável:'));
  assert.match(section,/renderStatic\(\)/);
  assert.doesNotMatch(section,/setMode\('code'\)/);
  assert.match(section,/data-open-error/);
});
test('sem cabeçalho de página duplicado, pilha agrupada',()=>{
  assert.doesNotMatch(html,/id="viewTitle"|class="topbar"/);
  assert.doesNotMatch(html,/<strong>Resultados e referências<\/strong>|<strong>Árvore de derivação<\/strong>/);
  for(const id of ['focusLine','staticContent','treeStatus','btnExportTokens','btnExport'])assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(renderer,/stack-pair/);
  assert.match(css,/\.stack-pair/);
});

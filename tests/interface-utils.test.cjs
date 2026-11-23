'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {offsetAt,sourceLine,actionInfo,escapeHTML,tokenReport,analysisReport}=require('../src/ui-utils.js');
const tree=require('../src/tree-graph.js');
const {invokeJava}=require('../src/java-runner.cjs');
const app={isPackaged:false};
const modeloPromise=invokeJava(app,'grammar');
const analisar=s=>invokeJava(app,'analyze',s);
const fs=require('node:fs'),path=require('node:path');
test('CRLF, LF e CR mantêm posições corretas de lexemas e erros',()=>{
  for(const separator of ['\r\n','\r','\n']){
    const src=['program teste;','begin','  write(42);','end.'].join(separator);
    const pos=offsetAt(src,3,3);
    assert.equal(src.slice(pos,pos+5),'write');
    assert.equal(sourceLine(src,3),'  write(42);');
  }
});
test('offsets não extrapolam os limites e HTML é escapado',()=>{
  assert.equal(offsetAt('abc',50,100),3);
  assert.equal(escapeHTML('<img onerror="x">'),'&lt;img onerror=&quot;x&quot;&gt;');
});
test('explicações didáticas correspondem às ações reais do SLR(1)',async()=>{
  const code=fs.readFileSync(path.join(__dirname,'teste1_basico_valido.txt'),'utf8');
  const analysis=await analisar(code);
  const modelo=await modeloPromise;
  for(const step of analysis.passos){
    const info=actionInfo(step,modelo);
    assert.ok(info.title);assert.ok(info.description);
    if(step.detalhes.tipo==='SHIFT')assert.match(info.description,/consum|leu|passou/i);
    if(step.detalhes.tipo==='REDUCE')assert.match(info.description,/reconheceu/i);
  }
});
test('árvore derivada de SHIFT e REDUCE, com desenho SVG de coordenadas finitas',async()=>{
  const src=fs.readFileSync(path.join(__dirname,'teste1_basico_valido.txt'),'utf8');
  const r=await analisar(src);
  const built=tree.build(r.passos,(await modeloPromise).productions,r.passos.length-1);
  assert.equal(built.interrupted,false);
  assert.equal(built.roots.length,1);
  const model=tree.layout(built.roots,new Set(),350);
  assert.ok(model.nodes.length>0);
  assert.ok(model.edges.length>0);
  assert.ok(model.nodes.every(n=>Number.isFinite(n.x)&&Number.isFinite(n.y)));
  const collapsed=tree.layout(built.roots,new Set([built.roots[0].id]),350);
  assert.ok(collapsed.nodes.length<model.nodes.length);
});
test('erro com recuperação não se apresenta como árvore completa',async()=>{
  const src=fs.readFileSync(path.join(__dirname,'teste5_erros_sintaticos.txt'),'utf8');
  const r=await analisar(src);
  const built=tree.build(r.passos,(await modeloPromise).productions,r.passos.length-1);
  assert.equal(built.interrupted,true);
  assert.match(built.reason,/erro/i);
});
test('processo Java retorna análise completa pelo protocolo JSON',async()=>{
  const code=fs.readFileSync(path.join(__dirname,'teste2_tipos_expressoes_valido.txt'),'utf8');
  const r=await analisar(code);
  assert.equal(r.aceito,true);
  assert.equal(r.passos.length,146);
  assert.equal(r.estados,130);
});

test('arquivo TXT de tokens respeita o par <cadeia, token> por linha',()=>{
  const txt=tokenReport([{lexema:'program',descricao:'Palavra reservada'},{lexema:'x',descricao:'Identificador'}]);
  assert.equal(txt,'<program, Palavra reservada>\n<x, Identificador>\n');
});

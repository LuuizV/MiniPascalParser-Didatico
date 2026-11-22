'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {offsetAt,sourceLine,actionInfo,escapeHTML}=require('../src/ui-utils.js');
const tree=require('../src/tree-graph.js');
const {modelo,analisar}=require('../src/core.cjs');
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
test('explicações didáticas correspondem às ações reais do SLR(1)',()=>{
  const code=fs.readFileSync(path.join(__dirname,'teste1_basico_valido.txt'),'utf8');
  const analysis=analisar(code);
  for(const step of analysis.passos){
    const info=actionInfo(step,modelo);
    assert.ok(info.title);assert.ok(info.description);
    if(step.detalhes.tipo==='SHIFT')assert.match(info.description,/consum|leu|passou/i);
    if(step.detalhes.tipo==='REDUCE')assert.match(info.description,/reconheceu/i);
  }
});
test('árvore derivada de SHIFT e REDUCE, com desenho SVG de coordenadas finitas',()=>{
  const src=fs.readFileSync(path.join(__dirname,'teste1_basico_valido.txt'),'utf8');
  const r=analisar(src);
  const built=tree.build(r.passos,modelo.productions,r.passos.length-1);
  assert.equal(built.interrupted,false);
  assert.equal(built.roots.length,1);
  const model=tree.layout(built.roots,new Set(),350);
  assert.ok(model.nodes.length>0);
  assert.ok(model.edges.length>0);
  assert.ok(model.nodes.every(n=>Number.isFinite(n.x)&&Number.isFinite(n.y)));
  const collapsed=tree.layout(built.roots,new Set([built.roots[0].id]),350);
  assert.ok(collapsed.nodes.length<model.nodes.length);
});
test('erro com recuperação não se apresenta como árvore completa',()=>{
  const src=fs.readFileSync(path.join(__dirname,'teste5_erros_sintaticos.txt'),'utf8');
  const r=analisar(src);
  const built=tree.build(r.passos,modelo.productions,r.passos.length-1);
  assert.equal(built.interrupted,true);
  assert.match(built.reason,/erro/i);
});
test('Worker Thread não altera aceitação e histórico das operações do núcleo',async()=>{
  const {Worker}=require('node:worker_threads');
  const code=fs.readFileSync(path.join(__dirname,'teste2_tipos_expressoes_valido.txt'),'utf8');
  const before=analisar(code);
  const msg=await new Promise((resolve,reject)=>{
    const w=new Worker(path.join(__dirname,'../src/analysis-worker.cjs'),{workerData:code});
    w.once('message',resolve);w.once('error',reject);w.once('exit',status=>{if(status!==0)reject(Error('Worker exit '+status));});
  });
  assert.equal(msg.ok,true);
  assert.equal(msg.result.aceito,before.aceito);
  assert.deepEqual(msg.result.passos,before.passos);
});

'use strict';
/** Contratos visuais estáticos: protegem as intenções de IHC sem precisar do Electron. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(base,'src','index.html'),'utf8');
const css=fs.readFileSync(path.join(base,'src','style.css'),'utf8');
const renderer=fs.readFileSync(path.join(base,'src','renderer.js'),'utf8');
const main=fs.readFileSync(path.join(base,'src','main.cjs'),'utf8');

test('quatro áreas principais sem subaba do simulador',()=>{
  for(const mode of ['code','dynamic','tree','static']){
    assert.match(html,new RegExp('data-mode="'+mode+'"'));
    assert.match(html,new RegExp('id="view-'+mode+'"'));
  }
  assert.match(html,/Simulador SLR\(1\)/);
  assert.doesNotMatch(html,/data-dynamic-tab/);
});

test('fontes e interface deixam de oferecer escala manual A±',()=>{
  for(const id of ['btnScalePlus','btnScaleMinus','btnFontPlus','btnFontMinus']){
    assert.equal(html.includes(id),false,id);
    assert.equal(renderer.includes(id),false,id);
  }
  assert.doesNotMatch(css,/--ui-scale|--code-font/);
  assert.match(css,/font-size:15px/);
  assert.doesNotMatch(main,/settings\.scale|settings\.font/);
});

test('árvore própria permite pan, zoom no cursor e centralização',()=>{
  for(const id of ['treeViewport','treeWorld','treeCenter','treeZoomIn','treeZoomOut','treeExpand','treeExport']){
    assert.match(html,new RegExp('id="'+id+'"'));
  }
  for(const action of ['pointerdown','pointermove','pointerup','wheel','centerTree','zoomTree']){
    assert.ok(renderer.includes(action),action);
  }
  assert.match(renderer,/addEventListener\('wheel',[\s\S]*?passive:false/);
});

test('Gramática contém apenas produções na apresentação, mas o núcleo mantém as tabelas',()=>{
  const grammar=renderer.slice(renderer.indexOf('function renderGrammar()'),renderer.indexOf('function renderStatic()'));
  assert.match(grammar,/productions/);
  for(const name of ['g.states','g.first','g.follow','g.actions','g.gotos','stateSelect']){
    assert.equal(grammar.includes(name),false,name);
  }
  const {modelo}=require('../src/core.cjs');
  assert.equal(modelo.productions.length,71);
  assert.equal(modelo.states.length,130);
  assert.ok(modelo.actions.length>0);
});


test('o ícone permanece incluído na distribuição Windows',()=>{
  const pkg=require('../package.json');
  assert.ok(pkg.build.files.includes('assets/minipascal.png'));
  assert.equal(pkg.build.productName,'MiniPascal');
});

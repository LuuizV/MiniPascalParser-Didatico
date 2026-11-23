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
  for(const id of ['treeViewport','treeWorld','treeCenter','treeZoomIn','treeZoomOut','treeExpand']){
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
  const java=require('node:fs').readFileSync(path.join(base,'java','src','minipascal','SLRTable.java'),'utf8');
  assert.match(java,/class SLRTable/);
  assert.match(java,/getFollow/);
});


test('o ícone permanece incluído na distribuição Windows',()=>{
  const pkg=require('../package.json');
  assert.ok(pkg.build.files.includes('assets/minipascal.png'));
  assert.equal(pkg.build.productName,'MiniPascal');
});

test('editor mantém números na mesma altura de linha do código',()=>{
  assert.match(css,/font:16px\/27px Consolas/);
  assert.match(css,/line-height:27px/);
  assert.match(css,/\.line-numbers span\{display:block;min-height:27px;height:27px\}/);
  assert.match(css,/\.error-token\{/);
  assert.match(css,/\.line-error\{/);
  assert.match(html,/class="code-label"/);
  assert.equal((html.match(/id="btnRun"/g)||[]).length,1);
});
test('somente duas exportações TXT, sem serviço de exportar SVG',()=>{
  assert.match(html,/id="btnExportTokens"/);
  assert.match(html,/id="btnExport"/);
  assert.doesNotMatch(html,/id="treeExport"/);
  assert.doesNotMatch(main,/export-tree/);
  assert.doesNotMatch(renderer,/exportTree/);
});

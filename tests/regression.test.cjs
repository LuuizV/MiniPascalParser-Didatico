'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
function callJava(op,source=''){
  const binary=process.env.JAVA_HOME?path.join(process.env.JAVA_HOME,'bin',process.platform==='win32'?'java.exe':'java'):'java';
  const r=spawnSync(binary,['-jar',path.join(__dirname,'..','java','build','minipascal-engine.jar')],{
    input:JSON.stringify({op,source})+'\n',encoding:'utf8',maxBuffer:70*1024*1024,timeout:30000});
  if(r.error)throw r.error;
  const msg=JSON.parse(r.stdout);
  if(!msg.ok)throw Error(msg.error);
  return msg.result;
}
const modelo=callJava('grammar');
const analisar=s=>callJava('analyze',s);
const root=__dirname;
const files=['teste1_basico_valido.txt','teste2_tipos_expressoes_valido.txt','teste3_procedure_valido.txt','teste4_if_while_valido.txt','teste5_erros_sintaticos.txt','teste6_erro_lexico.txt'];
const results=files.map(name=>({name,...analisar(fs.readFileSync(path.join(root,name),'utf8'))}));
test('gramática SLR(1) produz exatamente 130 estados e 71 regras',()=>{assert.equal(modelo.statesCount,130);assert.equal(modelo.productions.length,71);});
test('seis programas preservam aceitação, erros e 611 operações',()=>{
  assert.deepEqual(results.map(x=>x.aceito),[true,true,true,true,false,false]);
  assert.deepEqual(results.map(x=>x.passos.length),[65,146,199,145,56,0]);
  assert.equal(results.reduce((v,x)=>v+x.passos.length,0),611);
  assert.equal(results[4].errosSintaticos.length,5);assert.equal(results[5].errosLexicos.length,1);
});
function snapshot(){const output=[];for(const r of results){output.push(`FILE=${r.name}`,`ESTADOS=${r.estados}`,`ACEITO=${r.aceito}`);for(const t of r.tokens)output.push(`TOK=<${t.lexema}, ${t.descricao}> [linha ${t.linha}, coluna ${t.coluna}]`);for(const e of r.errosLexicos)output.push(`LEX=Linha ${e.linha}, coluna ${e.coluna}: ${e.mensagem}${e.lexema?' ['+e.lexema+']':''}`);for(const e of r.errosSintaticos)output.push(`SYN=Linha ${e.linha}, coluna ${e.coluna}: ${e.mensagem}`);for(const t of r.passos)output.push(`STEP=${t.passo}|${t.pilha}|${t.entrada}|${t.acao}`);}return output.join('\n')+'\n';}
const EXPECTED_SNAPSHOT_SHA256='d87688fd9f215029da4e33b9fba4ab2b820fd559216d773712fd49707c5f9749';
test('histórico textual é idêntico ao Parser Java em ambiente ASCII',()=>{
  const ascii=snapshot().replace(/[^\x00-\x7F]/g,'?');
  const hash=crypto.createHash('sha256').update(ascii).digest('hex');
  assert.equal(hash,EXPECTED_SNAPSHOT_SHA256);
});
test('cinco arquivos léxicos da primeira etapa mantêm as posições e os erros',()=>{
  const examples=['teste1_basico.txt','teste2_strings_repeticao.txt','teste3_operadores_numeros.txt','teste4_char_comentarios.txt','teste5_erros.txt'];
  for(let i=0;i<examples.length;i++){
    const r=analisar(fs.readFileSync(path.join(root,examples[i]),'utf8'));
    if(i<4)assert.equal(r.errosLexicos.length,0,examples[i]);
    else assert.ok(r.errosLexicos.length>0);
    assert.equal(r.tokens.every(t=>t.terminal!=='$'),true);
  }
});
test('recuperação conserva fotografia da pilha antes de ERROR',()=>{
  const r=results[4],step=r.passos.find(t=>t.detalhes.tipo==='ERROR');
  assert.ok(step);assert.equal(step.detalhes.estado,step.detalhes.estados.at(-1));
  assert.equal(step.pilha,'0'+step.detalhes.simbolos.map((s,i)=>` ${s} ${step.detalhes.estados[i+1]}`).join(''));
});
test('erro léxico bloqueia SLR(1)',()=>assert.equal(results[5].passos.length,0));

test('núcleo Java responde em JSON sem truncar Unicode e preserva todos os campos',()=>{
  const r=analisar('program teste; begin write("áéíóú"); end.');
  assert.equal(r.aceito,true);
  assert.ok(r.tokens.some(t=>t.lexema.includes('áéíóú')));
  assert.ok(r.passos.every(p=>p.detalhes&&p.detalhes.token&&Array.isArray(p.detalhes.estados)));
});

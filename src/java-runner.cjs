'use strict';
const {spawn}=require('node:child_process');
const path=require('node:path');
const fs=require('node:fs');
const MAX_SOURCE=500000;
const MAX_OUTPUT=70*1024*1024;
let current=null;
function paths(app){
  const packaged=app.isPackaged;
  const folder=packaged?path.join(process.resourcesPath,'engine'):path.join(__dirname,'..','java','build');
  const runtime=path.join(folder,'runtime','bin',process.platform==='win32'?'java.exe':'java');
  const systemJava=process.env.JAVA_HOME?path.join(process.env.JAVA_HOME,'bin',process.platform==='win32'?'java.exe':'java'):'java';
  return {binary:packaged?runtime:(fs.existsSync(runtime)?runtime:systemJava),jar:path.join(folder,'minipascal-engine.jar')};
}
function invokeJava(app,op,source=''){
  if(op!=='grammar'&&op!=='analyze')return Promise.reject(Error('Operação inválida.'));
  if(typeof source!=='string'||source.length>MAX_SOURCE)return Promise.reject(Error('O arquivo não pode ultrapassar 500.000 caracteres.'));
  if(op==='analyze'&&current)current.kill();
  const {binary,jar}=paths(app);
  return new Promise((resolve,reject)=>{
    const proc=spawn(binary,['-jar',jar],{stdio:['pipe','pipe','pipe'],windowsHide:true,shell:false,env:{...process.env,JAVA_TOOL_OPTIONS:''}});
    if(op==='analyze')current=proc;
    let result='',errors='',settled=false;
    const timer=setTimeout(()=>{proc.kill();finish(Error('Análise excedeu o limite de 30 segundos.'));},30000);
    function finish(error,value){if(settled)return;settled=true;clearTimeout(timer);if(current===proc)current=null;error?reject(error):resolve(value);}
    proc.once('error',err=>finish(Error('Não foi possível iniciar o analisador Java: '+err.message)));
    proc.stderr.setEncoding('utf8');proc.stderr.on('data',s=>{errors=(errors+s).slice(-4000);});
    proc.stdout.setEncoding('utf8');proc.stdout.on('data',s=>{result+=s;if(result.length>MAX_OUTPUT){proc.kill();finish(Error('Saída do analisador muito grande.'));}});
    proc.once('close',code=>{
      if(settled)return;
      try{
        const line=result.trim();const message=JSON.parse(line);
        if(message.ok)finish(null,message.result);
        else finish(Error(message.error||'Falha no analisador Java.'));
      }catch(e){finish(Error('Resposta inválida do analisador Java: '+(errors||String(e))));}
    });
    proc.stdin.once('error',()=>{});
    proc.stdin.end(JSON.stringify({op,source})+'\n','utf8');
  });
}
module.exports={invokeJava};

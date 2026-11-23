'use strict';
// Compila o núcleo sem ferramentas de build adicionais; o JDK é necessário apenas no desenvolvimento.
const {spawnSync}=require('node:child_process');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const src=path.join(root,'java','src','minipascal');
const output=path.join(root,'java','build');
const classes=path.join(output,'classes');
fs.mkdirSync(classes,{recursive:true});
const extension=process.platform==='win32'?'.exe':'';
const bin=name=>path.join(process.env.JAVA_HOME||'', 'bin', name+extension);
function command(tool,args){
  const binary=process.env.JAVA_HOME?bin(tool):tool;
  const r=spawnSync(binary,args,{stdio:'inherit'});
  if(r.error)throw r.error;
  if(r.status!==0)throw Error(tool+' falhou ('+r.status+').');
}
command('javac',['-encoding','UTF-8','-d',classes,...fs.readdirSync(src).filter(x=>x.endsWith('.java')).map(x=>path.join(src,x))]);
command('jar',['--create','--file',path.join(output,'minipascal-engine.jar'),'--main-class','minipascal.Bridge','-C',classes,'.']);
if(process.argv.includes('--runtime')){
  const runtime=path.join(output,'runtime');
  fs.rmSync(runtime,{recursive:true,force:true});
  command('jlink',['--add-modules','java.base','--strip-debug','--no-header-files','--no-man-pages','--output',runtime]);
}
console.log('Java compilado com sucesso.');

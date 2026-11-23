'use strict';
/** Processo principal: janelas seguras, arquivos e análise isolada em Worker Thread. */
const {app,BrowserWindow,ipcMain,dialog,shell}=require('electron');
const fs=require('node:fs/promises');
const path=require('node:path');
const {Worker}=require('node:worker_threads');
const {modelo}=require('./core.cjs');
const {createUpdateManager}=require('./update-manager.cjs');
const MAX_SOURCE=500000;
const base=path.join(__dirname,'..');
let win=null,allowClose=false,currentWorker=null,workerSeq=0;
const approvedPaths=new Set();
function createWindow(){
  allowClose=false;
  win=new BrowserWindow({width:1500,height:950,minWidth:850,minHeight:640,backgroundColor:'#0d1423',title:'MiniPascal',icon:path.join(base,'assets','minipascal.png'),autoHideMenuBar:true,show:false,
    webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
  win.loadFile(path.join(__dirname,'index.html'));
  win.once('ready-to-show',()=>win.show());
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',event=>event.preventDefault());
  win.on('close',event=>{if(!allowClose){event.preventDefault();win.webContents.send('request-close');}});
  win.on('closed',()=>{win=null;});
}
function workerAnalyze(source){
  if(typeof source!=='string'||source.length>MAX_SOURCE)throw Error('O arquivo não pode ultrapassar 500.000 caracteres.');
  // A segunda análise substitui a anterior. Uma resposta antiga não pode sobrescrever a atual.
  if(currentWorker)currentWorker.terminate().catch(()=>{});
  const job=++workerSeq;
  return new Promise((resolve,reject)=>{
    const worker=new Worker(path.join(__dirname,'analysis-worker.cjs'),{workerData:source});
    currentWorker=worker;let settled=false;
    const finish=(err,result)=>{if(settled)return;settled=true;clearTimeout(timeout);if(currentWorker===worker)currentWorker=null;worker.terminate().catch(()=>{});if(err)reject(err);else resolve(result);};
    const timeout=setTimeout(()=>finish(Error('Análise excedeu o limite de 30 segundos. Tente um programa menor.')),30000);
    worker.on('message',message=>{if(job!==workerSeq)return finish(Error('A análise anterior foi substituída.'));if(message.ok)finish(null,message.result);else finish(Error(message.error||'Falha na análise.'));});
    worker.once('error',error=>finish(error));
    worker.once('exit',code=>{if(!settled)finish(Error('Analisador interrompido ('+code+').'));});
  });
}
async function safeSettingsRead(){
  try {const settings=JSON.parse(await fs.readFile(path.join(app.getPath('userData'),'preferences.json'),'utf8'));return {scale:Math.max(0.9,Math.min(1.5,Number(settings.scale)||1)),font:Math.max(13,Math.min(23,Number(settings.font)||16)),speed:[350,700,1200,2000].includes(settings.speed)?settings.speed:700};}
  catch {return {scale:1,font:16,speed:700};}
}
async function safeSettingsWrite(data){
  const pref={scale:Math.max(0.9,Math.min(1.5,Number(data?.scale)||1)),font:Math.max(13,Math.min(23,Number(data?.font)||16)),speed:[350,700,1200,2000].includes(Number(data?.speed))?Number(data.speed):700};
  const dir=app.getPath('userData');await fs.mkdir(dir,{recursive:true});await fs.writeFile(path.join(dir,'preferences.json'),JSON.stringify(pref,null,2),'utf8');return pref;
}
app.whenReady().then(()=>{
  const updater=app.isPackaged&&process.platform==='win32'&&!process.env.PORTABLE_EXECUTABLE_FILE&&!process.env.PORTABLE_EXECUTABLE_DIR?require('electron-updater').autoUpdater:null;
  const updates=createUpdateManager({app,updater,send:state=>{if(win&&!win.isDestroyed())win.webContents.send('update-state',state);}});
  ipcMain.handle('update-status',()=>updates.snapshot());
  ipcMain.handle('update-check',()=>updates.check());
  ipcMain.handle('update-download',()=>updates.download());
  ipcMain.handle('update-install',()=>{allowClose=true;const result=updates.install();if(!result)allowClose=false;return result;});
  ipcMain.handle('update-open-releases',()=>shell.openExternal(updates.releaseUrl));
  ipcMain.handle('analyze',(_event,source)=>workerAnalyze(source));
  ipcMain.handle('grammar',()=>modelo);
  ipcMain.handle('settings-read',safeSettingsRead);
  ipcMain.handle('settings-save',(_event,data)=>safeSettingsWrite(data));
  ipcMain.handle('confirm-close',async()=>{
    const res=await dialog.showMessageBox(win,{type:'warning',title:'Alterações não salvas',message:'Você quer salvar o código antes de sair?',detail:'Se você sair sem salvar, as últimas alterações serão perdidas.',buttons:['Salvar','Não salvar','Cancelar'],defaultId:0,cancelId:2,noLink:true});
    return ['save','discard','cancel'][res.response];
  });
  ipcMain.handle('close-confirmed',()=>{allowClose=true;if(win&&!win.isDestroyed())win.close();});
  ipcMain.handle('open-file',async()=>{
    const {canceled,filePaths}=await dialog.showOpenDialog(win,{title:'Importar código MiniPascal',properties:['openFile'],filters:[{name:'MiniPascal e texto',extensions:['pas','p','txt']},{name:'Todos os arquivos',extensions:['*']} ]});
    if(canceled||!filePaths.length)return null;
    const stat=await fs.stat(filePaths[0]);if(stat.size>MAX_SOURCE*4)throw Error('Arquivo muito grande para o editor.');
    const content=await fs.readFile(filePaths[0],'utf8');if(content.length>MAX_SOURCE)throw Error('Arquivo ultrapassa 500.000 caracteres.');
    approvedPaths.add(filePaths[0]);return {name:path.basename(filePaths[0]),path:filePaths[0],content};
  });
  ipcMain.handle('save-file',async(_event,data)=>{
    if(!data||typeof data.content!=='string'||data.content.length>MAX_SOURCE)throw Error('Conteúdo inválido.');
    let filename=data.path;
    if(!filename||data.saveAs){const d=await dialog.showSaveDialog(win,{title:'Salvar código',defaultPath:path.basename(data.name||'programa.pas'),filters:[{name:'Código MiniPascal',extensions:['pas','txt']}]});if(d.canceled)return null;filename=d.filePath;}
    if(typeof filename!=='string'||!approvedPaths.has(filename)&&!data.saveAs&&filename===data.path&&filename!==null){
      // Um caminho informado pelo renderer deve ter sido aberto ou escolhido no diálogo nativo.
      throw Error('Caminho não autorizado. Utilize Salvar como.');
    }
    await fs.writeFile(filename,data.content,'utf8');approvedPaths.add(filename);
    return {name:path.basename(filename),path:filename};
  });
  ipcMain.handle('export-report',async(_event,report)=>{
    if(typeof report!=='string'||report.length>5_000_000)throw Error('Relatório inválido.');
    const d=await dialog.showSaveDialog(win,{title:'Exportar análise',defaultPath:'analise-minipascal.txt',filters:[{name:'Texto',extensions:['txt']}]});
    if(d.canceled)return false;await fs.writeFile(d.filePath,report,'utf8');return true;
  });
  ipcMain.handle('export-tree',async(_event,svg)=>{
    if(typeof svg!=='string'||svg.length>5_000_000||!svg.startsWith('<svg')||/<script|onload=|onerror=/i.test(svg))throw Error('SVG inválido.');
    const result=await dialog.showSaveDialog(win,{title:'Exportar árvore de derivação',defaultPath:'arvore-minipascal.svg',filters:[{name:'Imagem vetorial SVG',extensions:['svg']}]});
    if(result.canceled)return false;
    await fs.writeFile(result.filePath,svg,'utf8');return true;
  });
  ipcMain.handle('samples',async()=>{
    const files=(await fs.readdir(path.join(base,'tests'))).filter(f=>/^teste[1-6]_.*\.txt$/.test(f)).sort();
    return files.map(f=>({name:f,title:f.replace(/^teste\d+_/,'').replace(/\.txt$/,'').replace(/_/g,' ')}));
  });
  ipcMain.handle('load-sample',async(_event,name)=>{
    if(typeof name!=='string'||!/^teste[1-6]_[\w-]+\.txt$/.test(name))throw Error('Exemplo inválido.');
    return fs.readFile(path.join(base,'tests',name),'utf8');
  });
  app.on('activate',()=>{if(!BrowserWindow.getAllWindows().length){createWindow();updates.start();}});
  createWindow();updates.start();
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});

'use strict';
/** Processo principal: arquivos nativos e análise. Não expõe Node ao navegador. */
const {app,BrowserWindow,ipcMain,dialog,shell} = require('electron');
const fs=require('node:fs/promises'),path=require('node:path');
const {analisar,modelo}=require('./core.cjs');
const {createUpdateManager}=require('./update-manager.cjs');
let win;
const base=path.join(__dirname,'..');
function init(){
  win=new BrowserWindow({width:1500,height:930,minWidth:980,minHeight:680,backgroundColor:'#0a0e18',
    title:'MiniPascal Studio',autoHideMenuBar:true,show:false,
    webPreferences:{preload:path.join(__dirname,'preload.cjs'),nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true}});
  win.loadFile(path.join(__dirname,'index.html'));
  win.once('ready-to-show',()=>win.show());
  win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
  win.webContents.on('will-navigate',e=>e.preventDefault());
}
app.whenReady().then(()=>{
  const updater=app.isPackaged&&process.platform==='win32'&&!process.env.PORTABLE_EXECUTABLE_FILE&&!process.env.PORTABLE_EXECUTABLE_DIR
    ? require('electron-updater').autoUpdater : null;
  const updates=createUpdateManager({app,updater,send:s=>{if(win&&!win.isDestroyed())win.webContents.send('update-state',s);}});
  ipcMain.handle('update-status',()=>updates.snapshot());
  ipcMain.handle('update-check',()=>updates.check());
  ipcMain.handle('update-download',()=>updates.download());
  ipcMain.handle('update-install',()=>updates.install());
  ipcMain.handle('update-open-releases',()=>shell.openExternal(updates.releaseUrl));
  ipcMain.handle('analyze',(_e,src)=>{if(typeof src!=='string'||src.length>500000)throw Error('Arquivo deve ter no máximo 500.000 caracteres.');return analisar(src);});
  ipcMain.handle('grammar',()=>modelo);
  ipcMain.handle('open-file',async()=>{
    const {canceled,filePaths}=await dialog.showOpenDialog(win,{title:'Abrir código MiniPascal',properties:['openFile'],filters:[{name:'MiniPascal e texto',extensions:['pas','p','txt']},{name:'Todos',extensions:['*']} ]});
    if(canceled||!filePaths.length)return null;
    const data=await fs.readFile(filePaths[0],'utf8');if(data.length>500000)throw Error('Arquivo maior que o limite de 500.000 caracteres.');
    return {name:path.basename(filePaths[0]),path:filePaths[0],content:data};
  });
  ipcMain.handle('save-file',async(_e,data)=>{
    if(!data||typeof data.content!=='string'||data.content.length>500000)throw Error('Conteúdo inválido');
    let filename=data.path;
    if(!filename||data.saveAs){const d=await dialog.showSaveDialog(win,{title:'Salvar código-fonte',defaultPath:data.name||'programa.pas',filters:[{name:'MiniPascal',extensions:['pas','txt']}]});if(d.canceled)return null;filename=d.filePath;}
    await fs.writeFile(filename,data.content,'utf8');return {path:filename,name:path.basename(filename)};
  });
  ipcMain.handle('export-report',async(_e,report)=>{
    if(typeof report!=='string'||report.length>5000000)throw Error('Relatório inválido');
    const d=await dialog.showSaveDialog(win,{title:'Exportar análise',defaultPath:'analise-minipascal.txt',filters:[{name:'Texto',extensions:['txt']}]});
    if(d.canceled)return false;await fs.writeFile(d.filePath,report,'utf8');return true;
  });
  ipcMain.handle('samples',async()=>{
    const files=(await fs.readdir(path.join(base,'tests'))).filter(f=>/^teste[1-6]_.*\.txt$/.test(f)&&!f.includes('snapshot')).sort();
    return files.map(f=>({name:f,title:f.replace(/^teste\d+_/,'').replace(/\.txt$/,'').replace(/_/g,' ')}));
  });
  ipcMain.handle('load-sample',async(_e,name)=>{
    if(typeof name!=='string'||!/^teste[1-6]_[\w-]+\.txt$/.test(name))throw Error('Exemplo inválido');
    return fs.readFile(path.join(base,'tests',name),'utf8');
  });
  app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)init();});
  init();
  updates.start();
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit();});

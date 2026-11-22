'use strict';
/** Fluxo de atualização do instalador NSIS. Nunca instala sem confirmação. */
const RELEASE_URL='https://github.com/LuuizV/MiniPascalParser-Didatico/releases/latest';
function createUpdateManager({app,updater=null,platform=process.platform,env=process.env,send=()=>{},delayMs=7500,timer=setTimeout}){
  const portable=Boolean(env.PORTABLE_EXECUTABLE_FILE||env.PORTABLE_EXECUTABLE_DIR);
  const supported=Boolean(app.isPackaged&&platform==='win32'&&!portable&&updater);
  let working=false,waiting=false,downloaded=false,started=false;
  const state={status:supported?'idle':'manual',message:supported?'Verifique se há uma nova versão.':'Para atualizar, abra a Release oficial no GitHub.',version:app.getVersion(),availableVersion:null,progress:null,canAutoUpdate:supported,releaseUrl:RELEASE_URL};
  function snapshot(){return {...state};}
  function set(status,message,extra={}){Object.assign(state,{status,message,...extra});send(snapshot());}
  function fail(error){working=false;waiting=false;set('error','Falha de atualização: '+String(error?.message||error).slice(0,240));}
  async function check(){
    if(!supported){set('manual',state.message);return snapshot();}
    if(working||waiting||downloaded)return snapshot();
    working=true;set('checking','Consultando as Releases...', {progress:null});
    try{await updater.checkForUpdates();}catch(err){fail(err);}
    return snapshot();
  }
  async function download(){
    if(!supported||!waiting||working||downloaded)return snapshot();
    working=true;set('downloading','Iniciando download...', {progress:0});
    try{await updater.downloadUpdate();}catch(err){fail(err);}
    return snapshot();
  }
  function install(){
    if(!supported||!downloaded||working)return false;
    working=true;set('installing','Instalando atualização...');
    updater.quitAndInstall(false,true);return true;
  }
  function start(){
    if(!supported||started){send(snapshot());return;}
    started=true;updater.autoDownload=false;updater.autoInstallOnAppQuit=false;updater.allowPrerelease=false;
    updater.on('checking-for-update',()=>set('checking','Procurando atualizações...'));
    updater.on('update-available',r=>{working=false;waiting=true;set('available','Versão '+r.version+' disponível.',{availableVersion:r.version,progress:null});});
    updater.on('update-not-available',()=>{working=false;set('current','Você está usando a versão mais recente.',{availableVersion:null,progress:null});});
    updater.on('download-progress',e=>set('downloading','Baixando atualização...', {progress:Math.min(100,Math.max(0,Number(e.percent)||0))}));
    updater.on('update-downloaded',r=>{working=false;waiting=false;downloaded=true;set('downloaded','Versão '+r.version+' pronta para instalação.',{availableVersion:r.version,progress:100});});
    updater.on('error',fail);send(snapshot());timer(()=>{void check();},delayMs);
  }
  return {start,check,download,install,snapshot,releaseUrl:RELEASE_URL};
}
module.exports={createUpdateManager,RELEASE_URL};

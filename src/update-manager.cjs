'use strict';
/** Fluxo de atualização do instalador NSIS. Nunca instala sem confirmação. */
const RELEASE_URL='https://github.com/LuuizV/MiniPascalParser-Didatico/releases/latest';
/** Identifica falha transitória do manifesto que acompanha o instalador NSIS. */
function isMissingManifest(error) {
  const message = String(error?.message || error || '');
  return /ERR_UPDATER_CHANNEL_FILE_NOT_FOUND|Cannot find latest(?:-[\w-]+)?\.yml|latest(?:-[\w-]+)?\.yml[^\n]*404/i.test(message);
}
function createUpdateManager({app,updater=null,platform=process.platform,env=process.env,send=()=>{},delayMs=7500,timer=setTimeout,retryDelayMs=20000,maxManifestRetries=2}){
  const portable=Boolean(env.PORTABLE_EXECUTABLE_FILE||env.PORTABLE_EXECUTABLE_DIR);
  const supported=Boolean(app.isPackaged&&platform==='win32'&&!portable&&updater);
  let working=false,waiting=false,downloaded=false,started=false,manifestRetries=0,retryScheduled=false;
  const state={status:supported?'idle':'manual',message:supported?'Verifique se há uma nova versão.':'Para atualizar, abra a Release oficial no GitHub.',version:app.getVersion(),availableVersion:null,progress:null,canAutoUpdate:supported,releaseUrl:RELEASE_URL};
  function snapshot(){return {...state};}
  function set(status,message,extra={}){Object.assign(state,{status,message,...extra});send(snapshot());}
  function fail(error){
    // O updater pode emitir 'error' e rejeitar a mesma Promise: agendar só uma vez.
    if(retryScheduled)return;
    working=false;waiting=false;
    if(isMissingManifest(error)&&manifestRetries<maxManifestRetries){
      manifestRetries++;
      retryScheduled=true;
      set('preparing','A Release ainda não disponibilizou todos os arquivos. Nova tentativa automática ('+manifestRetries+'/'+maxManifestRetries+')...', {progress:null});
      timer(()=>{
        retryScheduled=false;
        if(!downloaded&&!working&&!waiting)void check();
      },retryDelayMs*manifestRetries);
      return;
    }
    const msg=isMissingManifest(error)
      ? 'O manifesto de atualização ainda não está acessível. Tente novamente mais tarde ou abra as Releases oficiais.'
      : 'Não foi possível verificar a atualização: '+String(error?.message||error).slice(0,120)+'. Tente novamente.';
    set('error',msg,{progress:null});
  }
  async function check(){
    if(!supported){set('manual',state.message);return snapshot();}
    if(working||waiting||downloaded||retryScheduled)return snapshot();
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
    updater.on('update-available',r=>{working=false;waiting=true;manifestRetries=0;set('available','Versão '+r.version+' disponível.',{availableVersion:r.version,progress:null});});
    updater.on('update-not-available',()=>{working=false;manifestRetries=0;set('current','Você está usando a versão mais recente.',{availableVersion:null,progress:null});});
    updater.on('download-progress',e=>set('downloading','Baixando atualização...', {progress:Math.min(100,Math.max(0,Number(e.percent)||0))}));
    updater.on('update-downloaded',r=>{working=false;waiting=false;downloaded=true;set('downloaded','Versão '+r.version+' pronta para instalação.',{availableVersion:r.version,progress:100});});
    updater.on('error',fail);send(snapshot());timer(()=>{void check();},delayMs);
  }
  return {start,check,download,install,snapshot,releaseUrl:RELEASE_URL};
}
module.exports={createUpdateManager,RELEASE_URL,isMissingManifest};

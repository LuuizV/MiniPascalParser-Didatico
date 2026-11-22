'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{EventEmitter}=require('node:events');
const {createUpdateManager}=require('../src/update-manager.cjs');
function make(options={}){
  const updater=new EventEmitter(),calls={check:0,download:0,install:0};
  updater.checkForUpdates=async()=>{calls.check++;updater.emit('update-available',{version:'5.2.0'});};
  updater.downloadUpdate=async()=>{calls.download++;updater.emit('download-progress',{percent:50});updater.emit('update-downloaded',{version:'5.2.0'});};
  updater.quitAndInstall=()=>{calls.install++;};
  const app={isPackaged:options.isPackaged??true,getVersion:()=> '5.1.0'};
  const manager=createUpdateManager({app,updater,platform:options.platform||'win32',env:options.env||{},timer:()=>{}});
  return {manager,updater,calls};
}
test('instalação NSIS exige download e consentimento',async()=>{
  const {manager,updater,calls}=make();manager.start();
  assert.equal(updater.autoDownload,false);assert.equal(updater.autoInstallOnAppQuit,false);
  assert.equal(manager.install(),false);await manager.check();assert.equal(manager.snapshot().status,'available');
  assert.equal(calls.download,0);await manager.download();assert.equal(manager.snapshot().status,'downloaded');
  assert.equal(calls.install,0);assert.equal(manager.install(),true);assert.equal(calls.install,1);
});
test('portable e modo dev apenas indicam Release oficial',async()=>{
  for(const opts of [{env:{PORTABLE_EXECUTABLE_FILE:'portable.exe'}},{platform:'linux'},{isPackaged:false}]){
    const {manager,calls}=make(opts);manager.start();await manager.check();await manager.download();
    assert.equal(manager.snapshot().status,'manual');assert.equal(manager.install(),false);
    assert.deepEqual(calls,{check:0,download:0,install:0});
  }
});
test('erro de rede não instala e permite nova consulta',async()=>{
  const {manager,updater}=make();manager.start();
  updater.checkForUpdates=async()=>{throw Error('Sem conexão');};
  await manager.check();assert.equal(manager.snapshot().status,'error');assert.match(manager.snapshot().message,/Sem conexão/);
  assert.equal(manager.install(),false);
});


test('latest.yml 404: até duas novas tentativas, sem baixar nem instalar',async()=>{
  const {EventEmitter}=require('node:events');
  const events=[];const updater=new EventEmitter();let tries=0;
  updater.checkForUpdates=async()=>{
    tries++;
    const error=new Error('Cannot find latest.yml in the latest release artifacts: HttpError: 404');
    updater.emit('error',error);
    throw error;
  };
  updater.downloadUpdate=async()=>{throw Error('Download inesperado');};
  updater.quitAndInstall=()=>{throw Error('Instalação inesperada');};
  const manager=createUpdateManager({
    app:{isPackaged:true,getVersion:()=> '5.1.1'},updater,platform:'win32',env:{},
    retryDelayMs:50,maxManifestRetries:2,timer:(fn,ms)=>events.push({fn,ms})
  });
  manager.start();await manager.check();
  assert.equal(manager.snapshot().status,'preparing');
  assert.equal(events.length,2);assert.equal(events[1].ms,50);
  events[1].fn();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(manager.snapshot().status,'preparing');
  assert.equal(events.length,3);assert.equal(events[2].ms,100);
  events[2].fn();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(tries,3);assert.equal(manager.snapshot().status,'error');
  assert.match(manager.snapshot().message,/manifesto de atualização/i);
  assert.equal(manager.install(),false);
});

test('latest.yml 404 transitório: reconhece sucesso depois do retry',async()=>{
  const {EventEmitter}=require('node:events');
  const jobs=[];const updater=new EventEmitter();let count=0;
  updater.checkForUpdates=async()=>{
    count++;
    if(count===1)throw Error('Cannot find latest.yml: HttpError 404');
    updater.emit('update-not-available');
  };
  const manager=createUpdateManager({
    app:{isPackaged:true,getVersion:()=> '5.1.1'},updater,platform:'win32',env:{},
    timer:(fn,ms)=>jobs.push(fn)
  });
  manager.start();await manager.check();
  assert.equal(manager.snapshot().status,'preparing');
  jobs[1]();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(manager.snapshot().status,'current');
});

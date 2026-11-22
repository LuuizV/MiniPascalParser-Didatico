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

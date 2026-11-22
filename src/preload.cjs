'use strict';
const {contextBridge,ipcRenderer}=require('electron');
const invoke=(channel,...args)=>ipcRenderer.invoke(channel,...args);
function subscribe(channel,callback){if(typeof callback!=='function')return ()=>{};const listener=(_event,data)=>callback(data);ipcRenderer.on(channel,listener);return ()=>ipcRenderer.removeListener(channel,listener);}
contextBridge.exposeInMainWorld('studio',Object.freeze({
  analyze:src=>invoke('analyze',src),grammar:()=>invoke('grammar'),
  openFile:()=>invoke('open-file'),saveFile:data=>invoke('save-file',data),exportReport:text=>invoke('export-report',text),exportTree:svg=>invoke('export-tree',svg),
  samples:()=>invoke('samples'),loadSample:name=>invoke('load-sample',name),
  getSettings:()=>invoke('settings-read'),saveSettings:prefs=>invoke('settings-save',prefs),
  closeChoice:()=>invoke('confirm-close'),closeApp:()=>invoke('close-confirmed'),
  onCloseRequest:callback=>subscribe('request-close',callback),
  updateStatus:()=>invoke('update-status'),checkForUpdates:()=>invoke('update-check'),
  downloadUpdate:()=>invoke('update-download'),installUpdate:()=>invoke('update-install'),openReleases:()=>invoke('update-open-releases'),
  onUpdateState:callback=>subscribe('update-state',callback)
}));

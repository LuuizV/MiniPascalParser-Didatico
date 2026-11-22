'use strict';
const {contextBridge,ipcRenderer}=require('electron');
const call=(channel,...args)=>ipcRenderer.invoke(channel,...args);
contextBridge.exposeInMainWorld('studio',Object.freeze({
  analyze:src=>call('analyze',src),grammar:()=>call('grammar'),
  openFile:()=>call('open-file'),saveFile:data=>call('save-file',data),
  exportReport:txt=>call('export-report',txt),
  samples:()=>call('samples'),loadSample:name=>call('load-sample',name),
  updateStatus:()=>call('update-status'),checkForUpdates:()=>call('update-check'),
  downloadUpdate:()=>call('update-download'),installUpdate:()=>call('update-install'),
  openReleases:()=>call('update-open-releases'),
  onUpdateState:callback=>{
    if(typeof callback!=='function')return ()=>{};
    const listener=(_event,data)=>callback(data);
    ipcRenderer.on('update-state',listener);
    return ()=>ipcRenderer.removeListener('update-state',listener);
  }
}));

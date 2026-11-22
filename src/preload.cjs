'use strict';
const {contextBridge,ipcRenderer}=require('electron');
const call=(channel,...args)=>ipcRenderer.invoke(channel,...args);
contextBridge.exposeInMainWorld('studio',Object.freeze({
  analyze:src=>call('analyze',src),grammar:()=>call('grammar'),
  openFile:()=>call('open-file'),saveFile:data=>call('save-file',data),
  exportReport:txt=>call('export-report',txt),
  samples:()=>call('samples'),loadSample:name=>call('load-sample',name)
}));

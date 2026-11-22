'use strict';
/** A análise pesada não deve bloquear as janelas e diálogos do Electron. */
const {parentPort,workerData}=require('node:worker_threads');
const {analisar}=require('./core.cjs');
try {parentPort.postMessage({ok:true,result:analisar(workerData)});}
catch(error){parentPort.postMessage({ok:false,error:String(error?.message||error)});}

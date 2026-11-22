'use strict';
/** Constrói e desenha a árvore concreta a partir das operações reais SHIFT/REDUCE. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.MiniPascalTree=api;
})(typeof globalThis!=='undefined'?globalThis:this,()=>{
  function build(steps,productions,index){
    const stack=[];let interrupted=false,reason='',id=0;
    for(let i=0;i<=index&&i<steps.length;i++){
      const d=steps[i].detalhes;
      if(d.tipo==='ERROR'){interrupted=true;reason='O Parser encontrou um erro. Esta árvore mostra apenas a derivação anterior à recuperação.';break;}
      if(d.tipo==='SHIFT')stack.push({id:++id,label:d.token?.lexema||d.terminal,terminal:true,children:[],production:null});
      else if(d.tipo==='REDUCE'){
        const p=productions[d.producao];if(!p){interrupted=true;reason='Produção não encontrada.';break;}
        const n=p.rhs.length;
        if(n>stack.length){interrupted=true;reason='Histórico insuficiente para construir a derivação.';break;}
        const children=n?stack.splice(stack.length-n,n):[{id:++id,label:'ε',terminal:true,children:[],production:null}];
        stack.push({id:++id,label:p.lhs,terminal:false,children,production:p});
      }
    }
    return {roots:stack,interrupted,reason};
  }
  function layout(roots,collapsed=new Set(),maxVisible=360){
    const NODE_W=148,NODE_H=48,GAP_X=24,GAP_Y=75,PADDING=28;
    let count=0,maxDepth=0,truncated=false;
    function measure(node,depth){
      node._width=NODE_W;node._shownChildren=[];
      if(count>=maxVisible){truncated=true;return NODE_W;}
      count++;maxDepth=Math.max(maxDepth,depth);
      if(collapsed.has(node.id))return NODE_W;
      const widths=[];
      for(const child of node.children){
        if(count>=maxVisible){truncated=true;break;}
        widths.push(measure(child,depth+1));node._shownChildren.push(child);
      }
      if(widths.length)node._width=Math.max(NODE_W,widths.reduce((a,b)=>a+b,0)+GAP_X*(widths.length-1));
      return node._width;
    }
    roots.forEach(n=>measure(n,0));
    const nodes=[],edges=[];
    function place(node,x,depth){
      if(nodes.length>=maxVisible)return;
      const center=x+node._width/2,y=PADDING+depth*GAP_Y;
      nodes.push({id:node.id,label:node.label,terminal:node.terminal,collapsed:collapsed.has(node.id),hasChildren:node.children.length>0,x:center-NODE_W/2,y,production:node.production});
      let left=x;
      for(const child of node._shownChildren){
        const toX=left+child._width/2;
        edges.push({x1:center,y1:y+NODE_H,x2:toX,y2:y+GAP_Y});
        place(child,left,depth+1);left+=child._width+GAP_X;
      }
    }
    let x=PADDING;for(const root of roots){if(nodes.length>=maxVisible){truncated=true;break;}place(root,x,0);x+=root._width+GAP_X;}
    return {nodes,edges,width:Math.max(420,x+PADDING),height:Math.max(200,PADDING*2+(maxDepth*GAP_Y)+NODE_H),truncated};
  }
  return {build,layout};
});

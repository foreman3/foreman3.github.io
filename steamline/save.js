/* Local-only campaign persistence. Reconstruct fixed machinery from rules;
   never trust imported tile metadata, object keys, rotations or counters. */
(function(root){
  'use strict';
  const KEY='steamline-puzzle-campaign-v2',VERSION=2;
  const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
  const fresh=()=>({version:VERSION,current:1,unlocked:1,wins:{},drafts:{},undo:[],tools:{shape:'I',rotation:1,cursor:17},settings:{muted:false,fast:false}});
  function tiles(value) {
    if(!Array.isArray(value)||value.length!==48)return null;
    const out=[];
    for(const t of value) {
      if(t===null){out.push(null);continue;}
      if(!t||!['I','L'].includes(t.kind)||!integer(t.r,0,3))return null;
      out.push({kind:t.kind,r:t.r});
    }
    return out;
  }
  function validate(raw) {
    if(!raw||raw.version!==VERSION||!integer(raw.current,1,50)||!integer(raw.unlocked,1,50))return null;
    const c=fresh();c.unlocked=raw.unlocked;c.current=Math.min(raw.current,c.unlocked);
    for(let n=1;n<=50;n++) {
      const win=raw.wins?.[n];
      if(win&&integer(win.stars,1,3)&&integer(win.best,0,48))c.wins[n]={stars:win.stars,best:win.best};
      const board=tiles(raw.drafts?.[n]);if(board)c.drafts[n]=board;
    }
    if(Array.isArray(raw.undo))c.undo=raw.undo.slice(-20).map(tiles).filter(Boolean);
    c.settings={muted:raw.settings?.muted===true,fast:raw.settings?.fast===true};
    c.tools={shape:raw.tools?.shape==='L'?'L':'I',rotation:integer(raw.tools?.rotation,0,3)?raw.tools.rotation:1,cursor:integer(raw.tools?.cursor,0,47)?raw.tools.cursor:17};
    return c;
  }
  function read(storage) {
    let text=null;
    try{
      text=storage?.getItem(KEY);if(!text)return{campaign:fresh(),warning:storage?'':'Local storage is unavailable.'};
      const c=validate(JSON.parse(text));
      if(c)return{campaign:c,warning:''};
      try{storage.setItem(KEY+'-recovery',text);}catch(_){}
      return{campaign:fresh(),warning:'An unreadable save was backed up when possible. A fresh workbench is open.'};
    }catch(_){if(text)try{storage.setItem(KEY+'-recovery',text);}catch(_){}return{campaign:fresh(),warning:'The save could not be read. A recovery copy was attempted; download a backup before closing.'};}
  }
  function write(storage,campaign) {try{if(!storage)return false;storage.setItem(KEY,JSON.stringify(campaign));return true;}catch(_){return false;}}
  function encode(board){return board.map(t=>t&&!t.fixed&&!t.block?{kind:t.kind,r:t.r}:null);}
  function hydrate(R,c,draft) {
    const board=R.initial(c),safe=tiles(draft);if(!safe)return board;
    for(let k=0;k<48;k++)if(!board[k]?.fixed&&safe[k])board[k]={...safe[k]};
    if(c.budget){const count={I:0,L:0};for(const t of board)if(t&&!t.fixed&&!t.block)count[t.kind]++;if(count.I>c.budget.I||count.L>c.budget.L)return R.initial(c);}
    return board;
  }
  const api={KEY,VERSION,fresh,tiles,validate,read,write,encode,hydrate};root.SteamlineSave=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);

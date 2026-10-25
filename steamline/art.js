(function(root){
  'use strict';
  const ends=[[40,0],[80,40],[40,80],[0,40]];
  function path(a,b,kind) {return kind==='I'?'M'+ends[a]+' L'+ends[b]:'M'+ends[a]+' Q40,40 '+ends[b];}
  function pipe(t,wet=0,entry=3) {
    if(!t)return '';
    if(t.block)return '<svg viewBox="0 0 80 80" aria-hidden="true"><rect x="12" y="12" width="56" height="56" rx="5" fill="#3c3940" stroke="#a18b68"/><path d="M25 25L55 55M55 25L25 55" stroke="#1b222b" stroke-width="8"/><g fill="#d0ae76"><circle cx="19" cy="19" r="3"/><circle cx="61" cy="61" r="3"/></g></svg>';
    if(t.kind==='A'||t.kind==='T') {
      const d=t.kind==='A'?t.entry:t.exit,point=ends[d];
      return '<svg viewBox="0 0 80 80" aria-hidden="true"><path d="M'+point+'L40 40" stroke="#b88a54" stroke-width="24"/><circle cx="40" cy="40" r="24" fill="#1e2b41" stroke="#c3a168" stroke-width="4"/><circle cx="40" cy="40" r="17" fill="'+(wet?'#477b82':'#293c5b')+'" stroke="#83b8cf" stroke-dasharray="3 3"/><text x="40" y="47" text-anchor="middle" fill="#e4f4ed" font-size="23" font-family="Georgia">'+(t.kind==='A'?'A':'A′')+'</text></svg>';
    }
    const R=root.SteamlineRules,paths=[];
    if(t.kind==='B'){paths.push({d:'M0 40L80 40',wet:wet&2,axis:1});paths.push({d:'M40 0L40 80',wet:wet&1,bridge:true,axis:0});}
    else {const con=R.connections(t.kind,t.r);let a=con.includes(entry)?entry:con[0],b=con.find(d=>d!==a);paths.push({d:path(a,b,t.kind),wet:wet});}
    let svg='<svg viewBox="0 0 80 80" aria-hidden="true">';
    for(const p of paths) {
      if(p.bridge)svg+='<path d="'+p.d+'" stroke="#252e38" stroke-width="35"/>';
      for(const [color,width]of [['#5f402e',25],['#efc884',21],['#b98244',16],['#e0ac61',12],['#f7dba1',3]])svg+='<path d="'+p.d+'" fill="none" stroke="'+color+'" stroke-width="'+width+'"/>';
      if(p.wet)svg+='<path d="'+p.d+'" fill="none" stroke="#235c58" stroke-width="13"/><path class="steam" data-axis="'+(p.axis??'')+'" d="'+p.d+'" pathLength="100" fill="none" stroke="#adf3d8" stroke-width="5"/>';
    }
    let con=t.kind==='B'?[0,1,2,3]:R.connections(t.kind,t.r);
    for(const d of con){const[x,y]=ends[d];svg+='<g transform="translate('+x+','+y+') rotate('+d*90+')"><rect x="-15" y="-5" width="30" height="10" rx="2" fill="#705133"/><rect x="-13" y="-4" width="26" height="7" rx="2" fill="#d6b279"/><circle cx="-9" r="2" fill="#f8dca5"/><circle cx="9" r="2" fill="#f8dca5"/></g>';}
    if(t.valve!==undefined)svg+='<g transform="translate(40,40) rotate('+t.valve*90+')"><circle r="17" fill="#3c2f33" stroke="#e8c481" stroke-width="2"/><path d="M0-11L8 1H3V11H-3V1H-8Z" fill="#ffdda0"/></g>';
    if(t.gate)svg+='<rect x="21" y="22" width="38" height="36" rx="5" fill="#39414a" stroke="#e6bf78" stroke-width="2"/><text x="40" y="49" text-anchor="middle" fill="#f5dbaa" font-size="25" font-family="Georgia">G</text>';
    if(t.anchor)svg+='<rect x="5" y="5" width="8" height="8" rx="2" fill="#cbb58b"/>';
    if(t.source||t.drain)svg+='<circle cx="40" cy="40" r="17" fill="#b68b51" stroke="#f3d392" stroke-width="2"/><path d="M29 40H51M40 29V51" stroke="#5f4933" stroke-width="3"/>';
    return svg+'</svg>';
  }
  root.SteamlineArt={pipe};
})(typeof window==='undefined'?globalThis:window);

window.MarbleArt=(()=>{
  'use strict';
  const R=MarbleRules,P=MarblePhysics,W=960,H=600;
  const assetStatus={ready:false,failed:false,sprites:0};let sheet,frames,assetPromise;
  function load(){
    return assetPromise??=(async()=>{
      try{
        const image=new Image();image.src='assets/blender/miniatures.webp';
        const[meta]=await Promise.all([fetch('assets/blender/atlas.json').then(r=>{if(!r.ok)throw Error('Sprite metadata unavailable');return r.json();}),image.decode()]);
        sheet=image;frames=meta.sprites;assetStatus.sprites=Object.keys(frames).length;assetStatus.ready=true;
      }catch(_){assetStatus.failed=true;}
      return assetStatus;
    })();
  }
  function sprite(g,name,x,y,width){
    const s=frames?.[name];if(!s)return null;const w=width??s.width,h=w*s.rect[3]/s.rect[2],left=x-s.anchor[0]*w,top=y-s.anchor[1]*h;
    g.drawImage(sheet,...s.rect,left,top,w,h);return s.label?{x:left+s.label[0]*w,y:top+s.label[1]*h}:true;
  }
  const palettes={sun:['#eee4ce','#b98767','#6e7c89','#a3b7c2'],mint:['#deeee4','#7eaa9e','#486e75','#a5c9c2'],blue:['#e1eaf0','#7c9bb3','#455e7a','#b2c7dc'],honey:['#f5e6c4','#c6995b','#7a6b68','#c5d1db'],rose:['#eee1db','#bb8b86','#646c88','#bdc5da'],teal:['#dbe7e6','#83a6a7','#3c626f','#9fbcca'],violet:['#e5e1ef','#a396b9','#5a607d','#bbc1d5']};
  function poly(g,pts,fill,stroke,width=1){g.beginPath();g.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)g.lineTo(pts[i].x,pts[i].y);g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}}
  function line(g,a,b,color,width=1){g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.stroke();}
  function circle(g,x,y,r,fill,stroke,width=1){g.beginPath();g.arc(x,y,r,0,Math.PI*2);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}}
  function ring(g,x,y,z,r,fill,stroke,width=1){const p=R.project(x,y,z);g.beginPath();g.ellipse(p.x,p.y,r*1.15,r*.65,0,0,Math.PI*2);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}}
  const octagon=(n,r=n.r)=>Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return{x:n.x+Math.cos(a)*r,y:n.y+Math.sin(a)*r,z:n.z};});
  function prism(g,world,top,side,edge,depth=34,mask=null){
    const pts=world.map(p=>R.project(p.x,p.y,p.z)),low=world.map(p=>R.project(p.x,p.y,p.z-depth));
    for(let i=0;i<pts.length;i++){const j=(i+1)%pts.length;if(mask&&!mask[i]||pts[j].x>=pts[i].x)continue;poly(g,[pts[i],pts[j],low[j],low[i]],i%2?side:edge,'#33485c55',.65);line(g,low[i],low[j],'#243d5144',1);}
    poly(g,pts,top,'#566f7f',1.1);
    for(let i=0;i<pts.length;i++)if(pts[(i+1)%pts.length].y<pts[i].y)line(g,pts[i],pts[(i+1)%pts.length],'#fffaf2',1.7);
  }
  function paintArrow(g,e,t,color){const p={x:R.mix(e.a.x,e.b.x,t),y:R.mix(e.a.y,e.b.y,t),z:R.mix(e.a.z,e.b.z,t)+1},a=R.project(p.x-e.ux*8-e.uy*7,p.y-e.uy*8+e.ux*7,p.z),b=R.project(p.x+e.ux*5,p.y+e.uy*5,p.z),d=R.project(p.x-e.ux*8+e.uy*7,p.y-e.uy*8-e.ux*7,p.z);line(g,a,b,color,2);line(g,b,d,color,2);}
  function prepare(c,mobile){
    const colors=palettes[c.theme],items=[];
    for(const e of c.edges){const count=Math.ceil(e.length/100);for(let i=0;i<count;i++){
      const t=i/count,u=(i+1)/count,w=e.width/2,ax=R.mix(e.a.x,e.b.x,t),ay=R.mix(e.a.y,e.b.y,t),az=R.mix(e.a.z,e.b.z,t),bx=R.mix(e.a.x,e.b.x,u),by=R.mix(e.a.y,e.b.y,u),bz=R.mix(e.a.z,e.b.z,u);
      const pts=[{x:ax-e.uy*w,y:ay+e.ux*w,z:az},{x:ax+e.uy*w,y:ay-e.ux*w,z:az},{x:bx+e.uy*w,y:by-e.ux*w,z:bz},{x:bx-e.uy*w,y:by+e.ux*w,z:bz}];
      items.push({pts,depth:(ax+ay+bx+by)/2+(az+bz)*.045,type:e.type,edge:e,mask:[i===0,true,i===count-1,true]});
    }}
    for(const n of c.nodeList)items.push({pts:octagon(n),depth:n.x+n.y+n.z*.09+.1,type:'pad',node:n});
    const all=items.flatMap(i=>i.pts.map(p=>R.project(p.x,p.y,p.z))),minX=Math.floor(Math.min(...all.map(p=>p.x))-130),minY=Math.floor(Math.min(...all.map(p=>p.y))-170),maxX=Math.ceil(Math.max(...all.map(p=>p.x))+140),maxY=Math.ceil(Math.max(...all.map(p=>p.y))+200);
    const scale=mobile?1:1.35,atlas=document.createElement('canvas');atlas.width=Math.ceil((maxX-minX)*scale);atlas.height=Math.ceil((maxY-minY)*scale);const g=atlas.getContext('2d');g.scale(scale,scale);g.translate(-minX,-minY);
    items.sort((a,b)=>a.depth-b.depth);
    for(const item of items){
      const n=item.node;
      if(n&&n.r>60){const p=R.project(n.x,n.y,n.z-125);poly(g,[{x:p.x-18,y:p.y-70},{x:p.x+18,y:p.y-70},{x:p.x+18,y:p.y+20},{x:p.x-18,y:p.y+20}],colors[1],colors[2]);line(g,{x:p.x,y:p.y-70},{x:p.x,y:p.y+20},'#f3f6eb77',1);}
      prism(g,item.pts,item.type==='rail'?'#aa8764':colors[0],colors[1],colors[2],item.type==='rail'?18:n?56:32,item.mask);
      if(item.type!=='rail'){
        // Cast terrazzo aggregate is deterministic and rasterized only once per course.
        const pts=item.pts.map(p=>R.project(p.x,p.y,p.z));g.save();poly(g,pts);g.clip();const loX=Math.min(...pts.map(p=>p.x)),hiX=Math.max(...pts.map(p=>p.x)),loY=Math.min(...pts.map(p=>p.y)),hiY=Math.max(...pts.map(p=>p.y));
        g.fillStyle='#536c7620';for(let k=0;k<28;k++){const x=loX+((k*53.17+item.depth*1.37)%1+1)%1*(hiX-loX),y=loY+((k*37.71+item.depth*.13)%1+1)%1*(hiY-loY);g.fillRect(x,y,k%3+1,1);}g.restore();
      }
    }
    // Rails lie above the deck: dark gutter, sleepers, two polished runners.
    for(const e of c.edges){
      if(e.type==='rail'){
        for(let d=8;d<e.length;d+=23){const t=d/e.length,x=R.mix(e.a.x,e.b.x,t),y=R.mix(e.a.y,e.b.y,t),z=R.mix(e.a.z,e.b.z,t)+2;line(g,R.project(x-e.uy*e.width*.5,y+e.ux*e.width*.5,z),R.project(x+e.uy*e.width*.5,y-e.ux*e.width*.5,z),'#71523c',4);}
        for(const side of[-1,1]){const offset=e.width*.32*side,a=R.project(e.a.x-e.uy*offset,e.a.y+e.ux*offset,e.a.z+7),b=R.project(e.b.x-e.uy*offset,e.b.y+e.ux*offset,e.b.z+7);line(g,a,b,'#344c5c',7);line(g,{x:a.x,y:a.y-1},{x:b.x,y:b.y-1},'#d3e7eb',3);}
      }else{for(let d=75;d<e.length;d+=150)paintArrow(g,e,d/e.length,e.family==='scenic'?'#477f9c77':'#a8792777');}
    }
    // In-world route signs at every checkpoint fork make choice explicit.
    for(const id of['S','A','B']){const n=c.nodes[id],p=R.project(n.x-n.r*.65,n.y+n.r*.65,n.z),bearing=family=>{const e=c.edges.find(e=>e.a===n&&e.family===family);if(!e)return'→';const a=R.project(e.a.x,e.a.y,e.a.z),b=R.project(e.b.x,e.b.y,e.b.z);return['→','↘','↓','↙','←','↖','↑','↗'][(Math.round(Math.atan2(b.y-a.y,b.x-a.x)/(Math.PI/4))+8)%8];};line(g,p,{x:p.x,y:p.y-58},'#506678',4);g.font='bold 8px Trebuchet MS';g.textAlign='center';g.fillStyle='#32627e';g.fillRect(p.x-36,p.y-59,72,15);g.fillStyle='#fff8e6';g.fillText(`${bearing('scenic')} SCENIC`,p.x,p.y-48);g.fillStyle='#b58a3d';g.fillRect(p.x-36,p.y-41,72,15);g.fillStyle='#fff8e6';g.fillText(`${bearing('express')} EXPRESS`,p.x,p.y-30);}
    for(const a of c.acid){const p=R.project(a.x,a.y,a.z+3);if(!sprite(g,'acid',p.x,p.y,a.r*2.622)){ring(g,a.x,a.y,a.z+1,a.r+7,'#436b4e','#344b42',2);ring(g,a.x,a.y,a.z+2,a.r,'#8acb62','#d5ec8b',1.8);}g.fillStyle='#28462e';g.font='bold 16px Trebuchet MS';g.textAlign='center';g.fillText('!',p.x,p.y+6);for(let j=-1;j<=1;j++)line(g,{x:p.x-18+j*9,y:p.y+13},{x:p.x-6+j*9,y:p.y+20},'#243d2c99',2);}
    for(const b of c.belts){const dx=b.b[0]-b.a[0],dy=b.b[1]-b.a[1],len=Math.hypot(dx,dy),e={a:{x:b.a[0],y:b.a[1],z:b.a[2]},b:{x:b.b[0],y:b.b[1],z:b.b[2]},ux:dx/len,uy:dy/len};for(let d=0;d<len;d+=30)paintArrow(g,e,b.force>0?d/len:1-d/len,'#976920');}
    for(const n of c.nodeList){if(!['start','finish','checkpoint'].includes(n.kind))continue;const p=R.project(n.x,n.y,n.z+1);ring(g,n.x,n.y,n.z+1,n.kind==='finish'?40:37,'#e2d6be','#667e8a',2);if(n.kind==='finish'){g.save();g.beginPath();g.ellipse(p.x,p.y,43,24,0,0,Math.PI*2);g.clip();for(let x=-4;x<=4;x++)for(let y=-3;y<=3;y++){g.fillStyle=(x+y)%2?'#33495d':'#fff8e7';g.fillRect(p.x+x*11,p.y+y*10,11,10);}g.restore();}else if(n.kind==='start'){g.fillStyle='#49667b';g.font='bold 10px Trebuchet MS';g.textAlign='center';g.fillText('START',p.x,p.y+4);}}
    const map=document.createElement('canvas');map.width=180;map.height=80;const m=map.getContext('2d'),mapScale=Math.min(166/(maxX-minX),68/(maxY-minY)),mapPoint=p=>({x:7+(p.x-minX)*mapScale,y:6+(p.y-minY)*mapScale});m.fillStyle='#223f54';m.fillRect(0,0,180,80);
    for(const e of c.edges){const a=mapPoint(R.project(e.a.x,e.a.y,e.a.z)),b=mapPoint(R.project(e.b.x,e.b.y,e.b.z));line(m,a,b,e.family==='scenic'?'#9ec6d1':'#e1b55f',e.family==='scenic'?2:1);}
    for(const l of c.launchers){const a=mapPoint(R.project(l.from.x,l.from.y,l.from.z)),b=mapPoint(R.project(l.to.x,l.to.y,l.to.z));m.setLineDash([2,2]);line(m,a,b,'#edac7e',1);m.setLineDash([]);}
    return{atlas,minX,minY,scale,colors,map,mapPoint};
  }
  function ball(g,p,enemy=false,heat=0,shadowZ=p.z){const q=R.project(p.x,p.y,p.z),r=enemy?16:13;
    if(shadowZ!==null)ring(g,p.x+4,p.y+4,shadowZ,r,'#253d5650');
    const frame=((Math.round((p.roll||0)*8/(Math.PI*2))%8)+8)%8;
    if(sprite(g,enemy?'rival':`marble-${frame}`,q.x,q.y-r))return;
    const grd=g.createRadialGradient(q.x-5,q.y-r-5,1,q.x,q.y-r,r);grd.addColorStop(0,enemy?'#a4b0be':'#e8fcff');grd.addColorStop(.35,enemy?'#4b5665':heat>.1?'#b6d873':'#79cadc');grd.addColorStop(1,enemy?'#172738':'#1d6286');circle(g,q.x,q.y-r,r,grd,'#f8ffff',.8);
    if(enemy){g.fillStyle='#f8e9bf';g.beginPath();g.arc(q.x+4,q.y-r+2,5,.15,Math.PI-.15);g.fill();circle(g,q.x+7,q.y-r-5,2,'#fff1ce');}
    else{g.save();g.beginPath();g.arc(q.x,q.y-r,r-1,0,Math.PI*2);g.clip();g.translate(q.x,q.y-r);g.rotate(p.roll);g.strokeStyle='#f8fbdf';g.lineWidth=3;g.beginPath();g.ellipse(0,0,5,17,.2,0,Math.PI*2);g.stroke();g.restore();circle(g,q.x-4,q.y-r-5,3.2,'#fff');}
  }
  function cannon(g,l,s){const a=R.project(l.from.x,l.from.y,l.from.z),b=R.project(l.to.x,l.to.y,l.to.z),angle=Math.atan2(b.y-a.y,b.x-a.x),heading=((Math.round(Math.atan2(l.to.y-l.from.y,l.to.x-l.from.x)/(Math.PI/4))%8)+8)%8;
    ring(g,l.to.x,l.to.y,l.to.z+2,51,null,'#a07c3c',2);for(const side of[-1,1]){const p={x:b.x+side*47,y:b.y};line(g,p,{x:p.x,y:p.y-34},'#496575',2);poly(g,[{x:p.x,y:p.y-34},{x:p.x+side*16,y:p.y-28},{x:p.x,y:p.y-22}],'#df9a4a');}
    if(!sprite(g,`cannon-${heading}`,a.x,a.y)){ring(g,l.from.x,l.from.y,l.from.z+2,33,'#7a6f5b','#d9b46f',2);g.save();g.translate(a.x,a.y-10);g.rotate(angle);g.fillStyle='#b06e42';g.strokeStyle='#563d31';g.lineWidth=2;g.beginPath();g.roundRect(-12,-13,46,26,5);g.fill();g.stroke();g.fillStyle='#d7a875';g.fillRect(1,-13,7,26);g.fillStyle='#2a3c46';g.beginPath();g.ellipse(33,0,6,12,0,0,Math.PI*2);g.fill();g.restore();}
    if(s.loading?.launcher.id===l.id){circle(g,a.x,a.y-37,7,'#f5c87e');}
  }
  function render(g,s,art,camera,mobile,reduced){
    const colors=art.colors;g.fillStyle=colors[3];g.fillRect(0,0,W,H);
    // Quiet parallax cloud bands retain scale while the terrain scrolls.
    g.fillStyle='#fff9';for(let i=0;i<7;i++){const x=((i*233-camera.x*.1)%1200+1200)%1200-120,y=((i*137-camera.y*.08)%760+760)%760-80;g.beginPath();g.ellipse(x,y,140,23,-.18,0,Math.PI*2);g.fill();}
    const zoom=camera.zoom;g.save();g.translate(W/2-camera.x*zoom,H*.46-camera.y*zoom);g.scale(zoom,zoom);
    g.drawImage(art.atlas,art.minX,art.minY,art.atlas.width/art.scale,art.atlas.height/art.scale);
    const visible=(x,y,z,margin=100)=>{const p=R.project(x,y,z);return Math.abs(p.x-camera.x)<W/zoom/2+margin&&Math.abs(p.y-camera.y)<H/zoom/2+margin;};
    if(!reduced)for(const a of s.course.acid)if(visible(a.x,a.y,a.z)){const p=R.project(a.x,a.y,a.z);for(let i=0;i<3;i++){const phase=(s.elapsed*.7+i*.3)%1;circle(g,p.x+Math.sin(i*3.1)*a.r*.6,p.y-phase*18,1.5+phase*2,'#dbef9eaa');}}
    for(let i=0;i<3;i++){const n=s.course.checkpoints[i];if(!visible(n.x,n.y,n.z))continue;const p=R.project(n.x,n.y,n.z),lit=i<s.collected,next=i===s.collected,label=sprite(g,`beacon-${lit?'lit':next?'next':'waiting'}`,p.x,p.y);if(!label){ring(g,n.x,n.y,n.z+3,38,lit?'#3f8a9bcc':next?'#ba583dcc':'#a4adb9cc','#fff0ce',1.5);line(g,{x:p.x,y:p.y-10},{x:p.x,y:p.y-55},'#4c6575',4);circle(g,p.x,p.y-57,14,lit?'#397e8b':next?'#b64e34':'#798c9b','#fff6e4',1.5);}g.fillStyle='#fff8e9';g.font='bold 13px Trebuchet MS';g.textAlign='center';g.fillText(lit?'✓':String(i+1),label?.x??p.x,(label?.y??p.y-57)+4);}
    for(const n of s.course.gems)if(!s.gems.has(n.id)&&visible(n.x,n.y,n.z)){const p=R.project(n.x,n.y,n.z+17+(reduced?0:Math.sin(s.elapsed*3)*3));if(!sprite(g,'gem',p.x,p.y))poly(g,[{x:p.x,y:p.y-8},{x:p.x+6,y:p.y},{x:p.x,y:p.y+8},{x:p.x-6,y:p.y}],'#e6b54a','#fff2af',1);}
    for(const l of s.course.launchers)if(visible(l.from.x,l.from.y,l.from.z,500))cannon(g,l,s);
    for(const gate of s.course.gates)if(visible(gate.x,gate.y,gate.z)){
      const phase=P.gateState(gate,s.elapsed),h=phase==='closed'?8:phase==='warning'?48:105;
      for(const side of[-1,1])line(g,R.project(gate.x,gate.y+side*(gate.r+19),gate.z),R.project(gate.x,gate.y+side*(gate.r+19),gate.z+120),'#657988',6);
      const n={x:gate.x,y:gate.y,z:gate.z+h,r:gate.r};prism(g,octagon(n),phase==='warning'?'#e8b95c':'#7c8996','#425568','#304454',24);
      const q=R.project(gate.x,gate.y,gate.z);g.fillStyle=phase==='warning'?'#a84f2a':'#52697d';g.font='bold 10px Trebuchet MS';g.textAlign='center';g.fillText(phase==='warning'?'! CLOSING':phase==='closed'?'STOP':'OPEN',q.x,q.y+8);
    }
    for(const e of s.enemies)if(visible(e.x,e.y,e.z))ball(g,e,true);
    const p=s.player,q=R.project(p.x,p.y,p.z);
    let shadowZ=p.grounded?p.z:null;if(!p.grounded)R.surfaces(s.course,p.x,p.y,deck=>{if(deck.z<=p.z&&(shadowZ===null||deck.z>shadowZ))shadowZ=deck.z;});
    if(s.respawn){g.globalAlpha=Math.max(0,s.respawn/.72);}ball(g,p,false,s.heat,shadowZ);g.globalAlpha=1;
    if(p.shield>0&&!s.respawn)ring(g,p.x,p.y,p.z+2,19,null,'#f2fbffbb',1.5);
    if(s.braking&&p.grounded)ring(g,p.x,p.y,p.z+2,22,null,'#b84230',2);
    if(s.heat>.05){g.fillStyle='#f4edb8';g.fillRect(q.x-17,q.y-39,34,5);g.fillStyle='#657932';g.fillRect(q.x-17,q.y-39,34*s.heat/.7,5);}
    g.restore();
    // A screen-edge bearing points toward the next checkpoint, never a forced route.
    const target=s.collected<3?s.course.checkpoints[s.collected]:s.course.nodes.F,tp=R.project(target.x,target.y,target.z),sx=(tp.x-camera.x)*zoom+W/2,sy=(tp.y-camera.y)*zoom+H*.46;
    if(sx<45||sx>915||sy<45||sy>555){const dx=sx-W/2,dy=sy-H/2,t=Math.min(420/Math.abs(dx||1),235/Math.abs(dy||1)),x=W/2+dx*t,y=H/2+dy*t;circle(g,x,y,18,'#23445be6','#f2e6cb',1);g.save();g.translate(x,y);g.rotate(Math.atan2(dy,dx));poly(g,[{x:8,y:0},{x:-5,y:-5},{x:-5,y:5}],'#fff0c9');g.restore();g.fillStyle='#1d4056';g.font='bold 12px Trebuchet MS';g.textAlign='center';g.fillText(s.collected<3?`BEACON ${s.collected+1}`:'FINISH',x,R.clamp(y+34,30,580));}
    g.fillStyle='#f8f4e9df';g.fillRect(17,17,232,49);g.fillStyle='#304f65';g.textAlign='left';g.font='bold 15px Trebuchet MS';g.fillText(s.course.name.toUpperCase(),29,38);g.font='11px Trebuchet MS';g.fillText(s.loading?'CANNON WINDING':s.flight?'AIRBORNE':s.ride?'EXPRESS RAIL':s.braking?'BRAKING':`ALT ${Math.round(p.z)} · ${Math.round(Math.hypot(p.vx,p.vy))} SPEED`,29,55);
    if(s.mode==='paused'){g.fillStyle='#234158b8';g.fillRect(0,0,W,H);g.fillStyle='#fff5df';g.textAlign='center';g.font='36px Georgia';g.fillText('Take a breath.',W/2,H/2);g.font='14px Trebuchet MS';g.fillText('Press P or tap RESUME',W/2,H/2+30);}
  }
  function minimap(g,s,art){g.clearRect(0,0,180,80);g.drawImage(art.map,0,0);for(let i=0;i<3;i++){const n=s.course.checkpoints[i],p=art.mapPoint(R.project(n.x,n.y,n.z));circle(g,p.x,p.y,3,i<s.collected?'#b2e7da':'#e5b558');}const p=art.mapPoint(R.project(s.player.x,s.player.y,s.player.z));circle(g,p.x,p.y,3,'#fff','#163447',1);}
  return{prepare,render,minimap,load,assetStatus};
})();

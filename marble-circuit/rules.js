/* Shared 3D course geometry. Ground coordinates stay independent of the camera. */
(function(root) {
  'use strict';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
  const project=(x,y,z=0)=>({x:(x-y)*.82,y:(x+y)*.46-z*.82});
  function screenVector(x,y) {
    const strength=Math.min(1,Math.hypot(x,y)),wx=x/.82+y/.46,wy=y/.46-x/.82,d=Math.hypot(wx,wy)||1;
    return{x:wx/d*strength,y:wy/d*strength};
  }
  function screenInput(x,y) {
    const d=Math.hypot(x,y)||1,sx=(x-y)*.82,sy=(x+y)*.46,l=Math.hypot(sx,sy)||1;
    return{x:sx/l*Math.min(1,d),y:sy/l*Math.min(1,d)};
  }
  function onEdge(e,x,y) {
    const t=clamp(((x-e.a.x)*e.dx+(y-e.a.y)*e.dy)/(e.length*e.length),0,1),cx=e.a.x+e.dx*t,cy=e.a.y+e.dy*t;
    return{t,x:cx,y:cy,z:mix(e.a.z,e.b.z,t),d:Math.hypot(x-cx,y-cy),gx:e.dz/e.length*e.ux,gy:e.dz/e.length*e.uy,edge:e};
  }
  function surfaces(c,x,y,visit) {
    for(const n of c.nodeList)if(Math.hypot(x-n.x,y-n.y)<n.r-2)visit({x,y,z:n.z,d:Math.hypot(x-n.x,y-n.y),gx:0,gy:0,node:n});
    for(const e of c.edges){if(x<e.minX||x>e.maxX||y<e.minY||y>e.maxY)continue;const p=onEdge(e,x,y);if(p.d<=e.width/2-2)visit(p);}
  }
  function ground(c,x,y,z,tolerance=24) {
    let result=null,score=Infinity;
    surfaces(c,x,y,p=>{const delta=Math.abs(p.z-z),rank=delta+(p.edge?p.d*.002:.015);if(delta<=tolerance&&rank<score){result=p;score=rank;}});
    return result;
  }
  function landing(c,x,y,before,after) {
    let result=null;surfaces(c,x,y,p=>{if(p.z<=before+3&&p.z>=after-2&&(!result||p.z>result.z))result=p;});return result;
  }
  function pointAlong(path,distance) {
    const d=clamp(distance,0,path.length);let at=0;
    for(let i=0;i<path.edges.length;i++){const e=path.edges[i];if(d<=at+e.length||i===path.edges.length-1){const t=clamp((d-at)/e.length,0,1);return{x:mix(e.a.x,e.b.x,t),y:mix(e.a.y,e.b.y,t),z:mix(e.a.z,e.b.z,t),ux:e.ux,uy:e.uy,slope:e.dz/e.length,edge:e};}at+=e.length;}
  }
  function compile(data) {
    const c={...data,nodes:{},edges:[],rails:[],nodeList:[]},checkpoints=['A','B','C'];
    for(const[id,p]of Object.entries(data.nodes)){c.nodes[id]={id,x:p[0],y:p[1],z:p[2],r:p[3]||54,kind:id==='S'?'start':id==='F'?'finish':checkpoints.includes(id)?'checkpoint':'pad'};if(checkpoints.includes(id)||['S','F'].includes(id))c.nodes[id].r=p[3]||88;}
    for(const path of data.paths){const rail=path.type==='rail'?{id:path.id,edges:[],length:0}:null;
      for(let i=0;i<path.nodes.length-1;i++){const a=c.nodes[path.nodes[i]],b=c.nodes[path.nodes[i+1]],dx=b.x-a.x,dy=b.y-a.y,length=Math.hypot(dx,dy);
        const e={id:`${path.id}-${i}`,a,b,dx,dy,dz:b.z-a.z,length,ux:dx/length,uy:dy/length,width:path.width,type:path.type||'road',family:path.id==='scenic'?'scenic':'express',rail,
          minX:Math.min(a.x,b.x)-path.width/2,maxX:Math.max(a.x,b.x)+path.width/2,minY:Math.min(a.y,b.y)-path.width/2,maxY:Math.max(a.y,b.y)+path.width/2};
        if(rail){e.railStart=rail.length;rail.length+=length;rail.edges.push(e);}c.edges.push(e);
      }if(rail)c.rails.push(rail);
    }
    c.nodeList=Object.values(c.nodes);c.checkpoints=checkpoints.map(id=>c.nodes[id]);
    c.enemies=(data.enemies||[]).map((h,i)=>({...h,id:i,r:h.r||16}));c.acid=data.acid||[];c.gates=data.gates||[];c.belts=data.belts||[];
    c.launchers=(data.launchers||[]).map((h,i)=>({...h,id:i,from:c.nodes[h.from],to:c.nodes[h.to],duration:h.duration||1.45}));c.gems=(data.gems||[]).map(id=>c.nodes[id]);
    c.safeRoute=data.safeRoute.split(' ');c.fastRoute=data.fastRoute.split(' ');
    return c;
  }
  const scenic=(nodes,width=148)=>({id:'scenic',nodes:nodes.split(' '),width});
  const way=(id,nodes,width,type)=>({id,nodes:nodes.split(' '),width,type});
  const levels=[
    compile({name:'Sunlit Steps',subtitle:'Pick your first line',theme:'sun',time:100,lives:5,
      tip:'Blue signs take the wide scenic route. Gold signs mark shorter, narrower bridges.',
      nodes:{S:[0,0,240],a:[0,280,240,74],b:[570,280,180,74],A:[570,0,180],c:[900,-220,180,74],d:[1180,-220,100,74],B:[1180,140,100],e:[1180,580,100,74],f:[1700,580,20,74],C:[1700,280,20],F:[1940,280,20],x:[280,0,210,44],y:[900,140,140,40],z:[1440,280,60,38]},
      paths:[scenic('S a b A c d B e f C F',160),way('bridge-one','S x A',94),way('bridge-two','A y B',86),way('bridge-three','B z C',80)],
      safeRoute:'S a b A c d B e f C F',fastRoute:'S x A y B z C F',gems:['x','y','z']}),
    compile({name:'Verdigris Foundry',subtitle:'Stay above the green',theme:'mint',time:100,lives:5,
      tip:'Acid hisses before it dissolves a marble. Get clear to cool down; rivals can knock you off line.',
      nodes:{S:[-80,0,330],a:[100,330,330,72],b:[590,330,260,72],A:[590,0,240],c:[590,-420,240,72],d:[1170,-420,180,72],B:[1170,-40,160],e:[1470,300,160,72],f:[1980,300,80,72],C:[1980,-80,60],F:[2220,-80,60],x:[240,-40,290,38],y:[880,-40,200,35],z:[1580,-80,110,35]},
      paths:[scenic('S a b A c d B e f C F',146),way('ridge-one','S x A',76),way('ridge-two','A y B',66),way('ridge-three','B z C',62)],
      acid:[{x:300,y:330,z:302,r:25},{x:1170,y:-235,z:170,r:26},{x:1725,y:300,z:120,r:25},{x:880,y:-40,z:200,r:15}],
      enemies:[{a:[590,250,255],b:[590,75,245],speed:62},{a:[1500,300,158],b:[1830,300,105],speed:78}],
      safeRoute:'S a b A c d B e f C F',fastRoute:'S x A y B z C F',gems:['x','z']}),
    compile({name:'Ribbon Railway',subtitle:'Ride the spiral',theme:'blue',time:105,lives:5,
      tip:'Enter a silver rail to ride it. Hold BRAKE to slow; steer again after the exit island.',
      nodes:{S:[0,0,400],a:[0,350,400,74],b:[600,350,300,74],A:[600,0,280],c:[700,-420,280,74],d:[1250,-420,180,74],B:[1250,120,150],e:[1250,650,150,74],f:[1840,650,70,74],C:[1840,240,50],F:[2100,240,50],
        r1:[180,-90,440,23],r2:[400,-100,360,23],r3:[780,-90,315,23],r4:[1000,-100,320,23],r5:[1100,80,275,23],r6:[1020,250,230,23],r7:[850,280,195,23],r8:[810,130,180,23],r9:[1480,260,190,23],r10:[1640,300,120,23]},
      paths:[scenic('S a b A c d B e f C F',144),way('first-rail','S r1 r2 A',42,'rail'),way('spiral','A r3 r4 r5 r6 r7 r8 B',40,'rail'),way('last-rail','B r9 r10 C',38,'rail')],
      acid:[{x:320,y:350,z:347,r:25},{x:1250,y:405,z:150,r:24},{x:1600,y:650,z:103,r:26}],
      enemies:[{a:[600,240,294],b:[600,70,284],speed:78},{a:[1250,-260,175],b:[1250,-40,160],speed:88}],
      safeRoute:'S a b A c d B e f C F',fastRoute:'S r1 r2 A r3 r4 r5 r6 r7 r8 B r9 r10 C F',gems:['r2','r6','r10']}),
    compile({name:'Sky Cannon',subtitle:'Trust the landing flags',theme:'honey',time:110,lives:5,
      tip:'Roll into a copper cannon socket. Its marked island is the landing; the long ramps are always available.',
      nodes:{S:[0,0,400],a:[-80,420,400,72],b:[700,420,310,72],A:[700,0,300,100],c:[700,-430,300,72],d:[1400,-430,210,72],B:[1400,220,180,100],e:[1400,750,180,72],f:[2140,750,90,72],C:[2140,0,80,100],F:[2400,0,80],gun1:[180,0,400,65],land1:[610,0,300,96],gun2:[860,-70,300,65],land2:[1310,220,180,96],gun3:[1570,220,180,65],land3:[2050,0,80,96]},
      paths:[scenic('S a b A c d B e f C F',142),way('load-one','S gun1',112),way('land-one','land1 A',144),way('load-two','A gun2',100),way('land-two','land2 B',144),way('load-three','B gun3',100),way('land-three','land3 C',144)],
      launchers:[{from:'gun1',to:'land1'},{from:'gun2',to:'land2'},{from:'gun3',to:'land3'}],
      acid:[{x:350,y:420,z:350,r:27},{x:1400,y:-100,z:195,r:27},{x:1790,y:750,z:132,r:26}],enemies:[{a:[2140,200,83],b:[2140,560,102],speed:90},{a:[700,95,302],b:[700,300,307],speed:78}],
      safeRoute:'S a b A c d B e f C F',fastRoute:'S gun1 land1 A gun2 land2 B gun3 land3 C F'}),
    compile({name:'Clockwork Cascades',subtitle:'Roll with the machinery',theme:'rose',time:100,lives:5,
      tip:'Chevron belts change your speed. Striped crusher lanes flash before closing; wait on the wide approach.',
      nodes:{S:[0,0,520],a:[-180,330,520,72],b:[540,330,425,72],A:[540,-20,400,98],c:[790,-460,400,72],d:[1230,-460,290,72],B:[1230,100,270,98],e:[1380,620,270,72],f:[2000,620,145,72],C:[2000,80,120,98],F:[2250,80,120],r1:[180,-80,530,23],r2:[390,-95,440,23],x:[870,100,345,34],gun:[1420,100,270,64],land:[1810,-180,220,98],h1:[1980,-180,180,52],h2:[1980,80,120,52]},
      paths:[scenic('S a b A c d B e f C F',142),way('cascade-rail','S r1 r2 A',40,'rail'),way('inner-ridge','A x B',62),way('cannon-approach','B gun',92),way('cannon-landing','land h1 h2 C',100)],
      launchers:[{from:'gun',to:'land',duration:1.6}],belts:[{a:[-50,330,500],b:[310,330,453],width:100,force:230},{a:[1230,-330,285],b:[1230,-110,277],width:110,force:-170}],
      gates:[{x:1230,y:-200,z:280,r:32,period:4.4,phase:.5},{x:870,y:100,z:345,r:27,period:4.4,phase:1.7}],
      acid:[{x:365,y:330,z:450,r:25},{x:1600,y:620,z:225,r:27},{x:2000,y:330,z:132,r:24},{x:1980,y:-40,z:148,r:18}],enemies:[{a:[540,260,420],b:[540,65,405],speed:95},{a:[1630,620,215],b:[1900,620,165],speed:105},{a:[2000,220,126],b:[2000,440,136],speed:90}],
      safeRoute:'S a b A c d B e f C F',fastRoute:'S r1 r2 A x B gun land h1 h2 C F',gems:['r2','x']}),
    compile({name:'The Undercut',subtitle:'A lower road can save you',theme:'teal',time:68,lives:4,
      tip:'High roads are faster. Lower terraces beneath some upper bends can catch a fall—keep rolling.',
      nodes:{S:[0,0,620],a:[-140,350,620,66],b:[560,350,485,66],A:[560,0,460,92],c:[900,-360,460,66],d:[1300,-360,330,66],B:[1300,160,300,92],e:[1300,700,300,66],f:[2020,700,160,66],C:[2020,200,130,92],F:[2290,200,130],high1:[180,0,650,26],high2:[400,0,530,26],r1:[760,-90,510,22],r2:[1000,90,435,22],r3:[1130,330,360,22],low1:[700,0,350,82],low2:[1130,330,260,82],gun:[1480,160,300,60],land:[1860,-180,250,94],h1:[2080,-180,220,40],h2:[2200,80,160,40]},
      paths:[scenic('S a b A c d B e f C F',132),way('high-bridge','S high1 high2 A',58),way('undercut-rail','A r1 r2 r3 B',36,'rail'),way('recovery-deck','A low1 low2 B',146),way('load','B gun',78),way('land','land h1 h2 C',76)],
      launchers:[{from:'gun',to:'land',duration:1.45}],acid:[{x:200,y:350,z:555,r:28},{x:1300,y:470,z:300,r:28},{x:1790,y:700,z:205,r:27},{x:2080,y:-180,z:220,r:16}],enemies:[{a:[560,80,465],b:[560,260,478],speed:120},{a:[1510,700,255],b:[1880,700,185],speed:130},{a:[2118,-50,190],b:[2162,-50,190],speed:63,r:14}],
      gates:[{x:1300,y:-100,z:315,r:33,period:3.7,phase:1},{x:300,y:0,z:585,r:25,period:3.5,phase:.3}],belts:[{a:[1430,700,275],b:[1770,700,208],width:95,force:260}],
      safeRoute:'S a b A c d B e f C F',fastRoute:'S high1 high2 A r1 r2 r3 B gun land h1 h2 C F',gems:['high2','r2']}),
    compile({name:'Marble Citadel',subtitle:'One last beautiful line',theme:'violet',time:56,lives:3,
      tip:'Outer balconies offer room. Inner rails and cannon hops save time, but demand a clean entry and exit.',
      nodes:{S:[0,0,760],a:[-210,360,760,63],b:[580,360,600,63],A:[580,0,560,94],c:[780,-520,560,63],d:[1430,-520,410,63],B:[1430,160,350,94],e:[1430,780,350,63],f:[2200,780,160,63],C:[2200,160,100,94],F:[2490,160,100],r1:[180,-90,790,21],r2:[420,-80,650,21],ridge1:[810,50,530,28],ridge2:[1110,80,430,28],gun1:[750,-130,560,58],land1:[1120,-260,460,94],h1:[1280,-260,460,34],h2:[1280,160,380,34],gun2:[1605,160,350,58],land2:[1860,460,250,94],h3:[2120,460,220,32],h4:[2120,160,130,32],low1:[840,50,390,78],low2:[1160,80,330,78]},
      paths:[scenic('S a b A c d B e f C F',126),way('citadel-rail','S r1 r2 A',34,'rail'),way('inner-spine','A ridge1 ridge2 B',52),way('lower-gallery','A low1 low2 B',132),way('load-one','A gun1',72),way('landing-one','land1 h1 h2 B',60),way('load-two','B gun2',72),way('landing-two','land2 h3 h4 C',54)],
      launchers:[{from:'gun1',to:'land1',duration:1.6},{from:'gun2',to:'land2',duration:1.65}],acid:[{x:100,y:360,z:697,r:30},{x:1430,y:-220,z:383,r:29},{x:1840,y:780,z:249,r:28},{x:1110,y:80,z:430,r:16}],
      enemies:[{a:[580,85,570],b:[580,275,595],speed:145},{a:[1430,290,350],b:[1430,610,350],speed:150},{a:[2200,260,110],b:[2200,590,141],speed:155},{a:[2095,300,172],b:[2145,300,172],speed:60,r:14}],gates:[{x:1430,y:-70,z:370,r:34,period:3.2,phase:.6},{x:930,y:65,z:490,r:24,period:3.1,phase:1.2},{x:1280,y:-80,z:425,r:25,period:3.1,phase:.3},{x:2000,y:460,z:234,r:24,period:3.2,phase:1.4}],
      belts:[{a:[0,360,717],b:[350,360,646],width:88,force:260},{a:[1550,780,320],b:[1920,780,229],width:88,force:-200}],
      safeRoute:'S a b A c d B e f C F',fastRoute:'S r1 r2 A gun1 land1 h1 h2 B gun2 land2 h3 h4 C F',gems:['r2','ridge1','ridge2']})
  ];
  const api={levels,clamp,mix,project,screenVector,screenInput,onEdge,ground,landing,pointAlong,surfaces};root.MarbleRules=api;
  if(typeof module!=='undefined')module.exports=api;
})(globalThis);

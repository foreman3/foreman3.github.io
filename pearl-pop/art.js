(() => {
  'use strict';
  const E=PearlEngine,colors=['#f6a77f','#89d4d1','#c6a5df','#f3d989','#95c393'],symbols=['✦','≋','☾','◆','✿'];
  const launcher=new Image(),barrel=new Image();let launcherReady=false,barrelReady=false;launcher.onload=()=>{launcherReady=true;window.dispatchEvent(new Event('pearl:art-ready'));};barrel.onload=()=>{barrelReady=true;window.dispatchEvent(new Event('pearl:art-ready'));};launcher.src='assets/launcher.png';barrel.src='assets/barrel.png';
  const background=document.createElement('canvas');background.width=E.W;background.height=E.H;const b=background.getContext('2d');
  const water=b.createLinearGradient(0,0,0,680);water.addColorStop(0,'#164352');water.addColorStop(.55,'#0c3043');water.addColorStop(1,'#072837');b.fillStyle=water;b.fillRect(0,0,540,680);
  b.save();b.globalAlpha=.05;b.fillStyle='#c6f4e8';for(let i=0;i<6;i++){b.beginPath();b.moveTo(130+i*50,0);b.lineTo(10+i*100,590);b.lineTo(80+i*110,590);b.lineTo(160+i*50,0);b.fill();}b.restore();
  for(let i=0;i<55;i++){const x=(i*127+13)%540,y=(i*83+23)%620;b.fillStyle=i%3?'#a1d1ce20':'#cfebd83d';b.beginPath();b.arc(x,y,i%3?1:1.6,0,Math.PI*2);b.fill();}
  // Hand-drawn reef silhouettes stay outside the clear aiming channel.
  function branch(x,y,length,angle,depth){if(!depth)return;b.beginPath();b.moveTo(x,y);const nx=x+Math.sin(angle)*length,ny=y-Math.cos(angle)*length;b.quadraticCurveTo(x+Math.sin(angle)*length*.25,ny,nx,ny);b.lineWidth=depth*1.8;b.lineCap='round';b.stroke();branch(nx,ny,length*.68,angle-.46,depth-1);branch(nx,ny,length*.63,angle+.5,depth-1);}
  b.strokeStyle='#a1708d55';branch(25,665,56,-.15,5);branch(514,670,52,.2,5);b.strokeStyle='#6e9c9755';branch(50,690,47,.3,4);branch(476,695,54,-.3,4);
  b.fillStyle='#345765';for(let i=0;i<12;i++){b.beginPath();b.ellipse(i*52,680,40,21+(i%3)*7,0,Math.PI,Math.PI*2);b.fill();}
  b.strokeStyle='#6f9ba5';b.lineWidth=2;b.beginPath();b.moveTo(44,18);b.lineTo(44,548);b.moveTo(496,18);b.lineTo(496,548);b.stroke();
  for(let side of[28,512])for(let y=45;y<540;y+=42){b.strokeStyle='#83b6bc55';b.beginPath();b.moveTo(side-4,y);b.lineTo(side+4,y);b.stroke();}
  b.fillStyle='#b6dad5';b.textAlign='center';b.font='9px system-ui';b.fillText('M I D N I G H T   M A R I N E   S A N C T U A R Y',270,24);
  const sprites=colors.map((color,i)=>{const c=document.createElement('canvas');c.width=c.height=100;const g=c.getContext('2d');
    g.fillStyle='#0005';g.beginPath();g.ellipse(51,58,40,38,0,0,Math.PI*2);g.fill();const shine=g.createRadialGradient(33,26,3,52,51,45);shine.addColorStop(0,'#fff6ee');shine.addColorStop(.3,color);shine.addColorStop(.75,color);shine.addColorStop(1,'#234d5b');g.fillStyle=shine;g.beginPath();g.arc(50,48,41,0,Math.PI*2);g.fill();g.strokeStyle=color;g.lineWidth=2;g.stroke();
    g.strokeStyle='#ffffff60';g.lineWidth=2;g.beginPath();g.arc(50,48,35,3.5,5.1);g.stroke();g.fillStyle='#ffffffbb';g.beginPath();g.ellipse(34,25,9,4,-.6,0,7);g.fill();g.fillStyle='#163545';g.textAlign='center';g.textBaseline='middle';g.font='bold 31px Georgia';g.fillText(symbols[i],50,51);return c;});
  function pearl(ctx,x,y,type,r=E.R,alpha=1){ctx.globalAlpha=alpha;ctx.drawImage(sprites[type],x-r*1.2,y-r*1.2,r*2.4,r*2.4);ctx.globalAlpha=1;}
  function draw(ctx,s,angle,projectile,effects,clock){ctx.drawImage(background,0,0);const path=E.trace(s,angle);
    ctx.fillStyle='#356274';ctx.fillRect(45,35,450,Math.max(5,s.drop+6));ctx.strokeStyle='#a4ccca';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(45,41+s.drop);ctx.lineTo(495,41+s.drop);ctx.stroke();
    ctx.strokeStyle='#d5a89488';ctx.lineWidth=1;ctx.setLineDash([4,7]);ctx.beginPath();ctx.moveTo(45,551);ctx.lineTo(495,551);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#e1bda6';ctx.font='9px system-ui';ctx.textAlign='left';ctx.fillText('DANGER LINE',54,568);
    for(const id in s.board){const[r,c]=id.split(',').map(Number),p=E.xy(r,c,s.drop);pearl(ctx,p.x,p.y,s.board[id]);}
    if(!projectile&&s.status==='playing'){
      ctx.strokeStyle=colors[s.current]+'aa';ctx.lineWidth=2;ctx.setLineDash([2,9]);ctx.beginPath();ctx.moveTo(path.points[0].x,path.points[0].y);let remaining=s.level<4?Infinity:s.level===4?200:110;for(let i=1;i<path.points.length&&remaining>0;i++){const a=path.points[i-1],p=path.points[i],d=Math.hypot(p.x-a.x,p.y-a.y),t=Math.min(1,remaining/d);ctx.lineTo(a.x+(p.x-a.x)*t,a.y+(p.y-a.y)*t);remaining-=d;}ctx.stroke();ctx.setLineDash([]);
      if(s.level<3&&path.slot){ctx.strokeStyle=colors[s.current];ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(path.slot.x,path.slot.y,20,0,Math.PI*2);ctx.stroke();ctx.fillStyle=colors[s.current];ctx.font='17px Georgia';ctx.textAlign='center';ctx.fillText(symbols[s.current],path.slot.x,path.slot.y+6);}
    }
    for(const p of effects){if(p.kind==='drop')pearl(ctx,p.x,p.y,p.type,21,Math.max(0,p.life));else if(p.kind==='text'){ctx.globalAlpha=Math.min(1,p.life*3);ctx.font='bold 19px system-ui';ctx.textAlign='center';ctx.lineWidth=5;ctx.strokeStyle='#092433';ctx.strokeText(p.text,p.x,p.y);ctx.fillStyle='#fce2c7';ctx.fillText(p.text,p.x,p.y);ctx.globalAlpha=1;}else{ctx.globalAlpha=Math.max(0,p.life);ctx.strokeStyle=colors[p.type];ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,22+(1-p.life)*27,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;}}
    // Shell launcher with a rotating, fluted barrel.
    ctx.save();ctx.translate(270,615);ctx.rotate(angle);if(barrelReady)ctx.drawImage(barrel,-60,-32,120,65);else{ctx.fillStyle='#48788a';ctx.strokeStyle='#98b9bf';ctx.lineWidth=2;ctx.beginPath();ctx.roundRect(-15,-49,30,50,9);ctx.fill();ctx.stroke();}ctx.restore();
    if(launcherReady)ctx.drawImage(launcher,210,589,120,65);else{ctx.fillStyle='#806c8e';ctx.strokeStyle='#d5b6c9';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(223,646);ctx.bezierCurveTo(201,620,224,589,270,600);ctx.bezierCurveTo(316,589,339,620,317,646);ctx.closePath();ctx.fill();ctx.stroke();}
    pearl(ctx,270,610,s.current,22);pearl(ctx,383,627,s.next,17);ctx.fillStyle='#a9cdd0';ctx.font='10px system-ui';ctx.textAlign='center';ctx.fillText('NEXT / SWAP',383,662);ctx.fillText('AIM · MATCH · RELEASE',270,669);
    if(projectile)pearl(ctx,projectile.x,projectile.y,projectile.type);
    const tide=E.levels[s.level-1].tide;ctx.font='10px system-ui';ctx.textAlign='left';ctx.fillStyle='#bbd8d6';ctx.fillText('TIDE',64,630);for(let i=0;i<tide;i++){ctx.fillStyle=i<s.misses?'#efad8f':'#305969';ctx.beginPath();ctx.arc(70+i*13,643,4,0,7);ctx.fill();}
  }
  window.PearlArt={draw,pearl,colors,symbols};
})();

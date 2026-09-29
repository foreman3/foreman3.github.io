/* Cached architectural illustration and animated actors. All coordinates are visual only. */
(()=>{
  'use strict';
  window.LiftHeistArt={create(canvas){
    const scale=matchMedia('(max-width:900px)').matches?1:2;
    canvas.width=960*scale;canvas.height=600*scale;
    const main=canvas.getContext('2d');let c=main;
    const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
    const floors=[125,218,311,404,497],shafts=[108,852];
    const backdrop=document.createElement('canvas');backdrop.width=960*scale;backdrop.height=600*scale;
    const palettes=[['#374b54','#1c303d'],['#4c4540','#302b2d'],['#304c49','#1e3234'],['#43434e','#292d3b'],['#4c493c','#2e3430']];
    function box(x,y,w,h,color,r=0){c.fillStyle=color;c.beginPath();c.roundRect(x,y,w,h,r);c.fill()}
    function line(x1,y1,x2,y2,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke()}
    function oval(x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()}
    function shape(points,fill,stroke=null,width=1){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
    function text(str,x,y,size=10,color='#d8c49a',align='left',font='sans-serif'){c.fillStyle=color;c.font=`600 ${size}px ${font}`;c.textAlign=align;c.fillText(str,x,y)}
    function gradient(x,y,w,h,a,b){const g=c.createLinearGradient(x,y,x+w,y+h);g.addColorStop(0,a);g.addColorStop(1,b);return g}
    function desk(x,y,flip=1){
      c.save();c.translate(x,y);c.scale(flip,1);
      oval(0,1,40,4,'#06141860');box(-34,-16,66,5,'#152429',2);box(-30,-12,5,13,'#142328');box(24,-12,5,13,'#142328');
      box(-32,-19,64,4,'#a48661',1);box(12,-15,17,12,'#465153');line(15,-9,26,-9,'#b4a27b');
      box(-18,-33,23,15,'#102025',2);box(-16,-31,19,10,'#608681',1);box(-14,-29,15,2,'#b3c8a380');box(-9,-18,6,2,'#8b9c92');
      box(8,-23,14,3,'#c6c0a2');line(22,-19,25,-40,'#bea97a',2);shape([[14,-36],[33,-36],[29,-44],[20,-44]],'#c4a365');
      c.restore();
    }
    function plant(x,y){
      line(x,y-9,x,y-34,'#889975',2);
      for(let k=0;k<4;k++){const d=k%2?1:-1;oval(x+d*6,y-16-k*6,8,3,'#6e8b71');line(x,y-14-k*6,x+d*10,y-18-k*6,'#365a4d')}
      shape([[x-8,y-12],[x+8,y-12],[x+5,y],[x-5,y]],'#b08b66');line(x-9,y-12,x+9,y-12,'#d0b28a',2)
    }
    function bookcase(x,y){box(x,y-57,57,54,'#172a2c');box(x+3,y-54,51,49,'#3e463c');
      for(let row=0;row<3;row++){for(let j=0;j<8;j++){const colors=['#b18c61','#708c82','#935f52','#b0a488','#4d6c70'];const h=11+(j*3+row)%4;box(x+6+j*6,y-40+row*16-h,4,h,colors[(j+row)%5]);line(x+7+j*6,y-43+row*16,x+9+j*6,y-43+row*16,'#ddcfac66')}
        box(x+2,y-39+row*16,53,3,'#a08460')}
    }
    function windowPane(x,y,i){
      box(x-3,y-3,65,50,'#14242d',2);box(x,y,59,44,gradient(x,y,0,44,'#63818a','#293c52'));
      for(let k=0;k<5;k++){const h=12+((k*17+i*11)%22),bx=x+k*13;box(bx,y+44-h,11,h,k%2?'#243747':'#34485a');for(let row=0;row<4;row++)if((k+row+i)%3)box(bx+3,y+46-h+row*6,2,2,'#dec39366')}
      shape([[x,y],[x+13,y],[x+42,y+44],[x+30,y+44]],'#a9cad212');line(x+29,y,x+29,y+44,'#a4916a',2);line(x,y+22,x+59,y+22,'#a4916a');box(x-3,y+44,65,4,'#ad9b76');
    }
    function build(){
      c=backdrop.getContext('2d');c.scale(scale,scale);
      box(0,0,960,600,gradient(0,0,960,600,'#091922','#17262b'));
      // Exterior silhouettes and rain-streaked glass at the edges of the cutaway.
      for(let k=0;k<24;k++){const x=k*44-20,h=90+(k*73)%300;box(x,545-h,33,h,'#1e333b');for(let j=0;j<9;j++)if((k+j)%3)box(x+7,552-h+j*24,4,7,'#bb9a5728')}
      box(26,26,908,518,'#060f18',8);box(30,24,900,514,gradient(30,24,900,514,'#7b7b6b','#263a3f'),5);box(35,29,890,504,'#14262c',3);
      for(let i=0;i<5;i++){
        const y=floors[i],p=palettes[i];box(45,y-80,870,89,gradient(0,y-80,0,85,p[0],p[1]));
        for(let x=157;x<815;x+=32){line(x,y-77,x,y-17,'#c7b48309');line(x+1,y-77,x+1,y-17,'#09171b20')}
        box(151,y-19,664,26,'#152a2d');box(151,y-20,664,2,'#9c997459');
        for(let x=161;x<807;x+=49){box(x,y-15,41,20,'#29403f');line(x,y-15,x+41,y-15,'#7b8d741c')}
        // Offices have distinct furnishing, with dimmer detail behind the actors.
        windowPane(235,y-68,i);windowPane(464,y-68,i+3);windowPane(688,y-68,i+5);
        if(i===0){desk(358,y-4);desk(599,y-4,-1);plant(780,y+1);bookcase(167,y)}
        if(i===1){bookcase(164,y);bookcase(350,y);desk(584,y-4);plant(774,y+1)}
        if(i===2){desk(342,y-4);desk(607,y-4,-1);for(let k=0;k<3;k++){box(171+k*15,y-47,12,44,'#48605b',1);for(let j=0;j<4;j++){line(173+k*15,y-38+j*10,181+k*15,y-38+j*10,'#9eab86');box(176+k*15,y-35+j*10,3,1,'#c5b489')}}plant(780,y+1)}
        if(i===3){bookcase(169,y);desk(360,y-4);bookcase(581,y);plant(785,y+1)}
        if(i===4){desk(358,y-4);plant(190,y+1);plant(780,y+1);box(563,y-29,84,25,'#705b4a',3);box(568,y-24,74,4,'#b08f63');text('CONCIERGE',605,y-10,7,'#dcc496','center')}
        // Overhead fixtures cast broad pools of light, cached with the room.
        for(const x of [338,601]){const glow=c.createRadialGradient(x,y-67,1,x,y-35,86);glow.addColorStop(0,'#efd59620');glow.addColorStop(1,'#efd59600');box(x-88,y-78,176,86,glow);box(x-20,y-77,40,3,'#090f17');box(x-15,y-73,30,2,'#dfc68e')}
        box(44,y+5,872,8,gradient(0,y+5,0,8,'#b4a27f','#566263'));box(44,y+13,872,12,'#13292f');line(44,y+6,916,y+6,'#ecd8a1',1);line(44,y+23,916,y+23,'#778476',1);
        for(let x=48;x<915;x+=44)line(x,y+14,x+17,y+22,'#263f42');
      }
      for(const x of shafts){
        box(x-40,35,80,493,'#0a1c25');box(x-36,35,72,493,gradient(x-36,0,72,0,'#253b42','#101f2b'));line(x-32,35,x-32,523,'#a59063',2);line(x+32,35,x+32,523,'#a59063',2);
        for(const y of floors){box(x-31,y-65,62,72,'#c4ac75',2);box(x-28,y-62,56,68,'#14232b');box(x-23,y-56,46,61,gradient(x-23,0,46,0,'#778e8a','#394e53'));line(x,y-56,x,y+4,'#c9c4a6');
          for(const dx of [-18,18])line(x+dx,y-53,x+dx,y+1,'#b8bd9a44');box(x-29,y+3,58,3,'#c9be99');box(x-14,y-77,28,9,'#101e26',2);text(String(5-floors.indexOf(y)).padStart(2,'0'),x,y-70,7,'#c9b886','center');
          box(x+34,y-31,6,15,'#9b916e',1);oval(x+37,y-26,1.3,1.3,'#f4d197');oval(x+37,y-20,1.3,1.3,'#716f58');}
      }
      // Floor plaques sit clear of the lifts and active corridor.
      const names=['EXECUTIVE','ARCHIVES','OPERATIONS','INTELLIGENCE','LOBBY'];
      floors.forEach((y,i)=>{box(151,y-79,96,10,'#101f27');text(`${String(5-i).padStart(2,'0')}  /  ${names[i]}`,155,y-72,6.5,'#c0b18b')});
      box(44,549,872,30,'#0a1922',3);line(44,549,916,549,'#917e57');text('ASTER HOUSE',62,568,11,'#dfcba0','left','Georgia');text('MIDNIGHT OPERATIONS',62,581,5.5,'#6f9494');
      for(let x=270;x<690;x+=12)box(x,563,3,2,'#446166');
      c=main;
    }
    function actor(x,y,face,kind,walk,crouch=false,stunned=0){
      const player=kind==='agent',armor=kind==='armor';
      oval(x,y+2,19,4,'#050f1888');c.save();c.translate(x,y);c.scale(face,1);c.lineCap='round';c.lineJoin='round';
      if(stunned){
        oval(0,-8,18,7,armor?'#526f7a':'#824d52');box(-14,-10,11,8,'#172b35',3);oval(13,-13,7,7,'#cda789');box(7,-21,15,6,'#292d3b',2);
        for(let k=0;k<3;k++){const a=(reduced?0:stunned*3)+k*2.1; text('✦',Math.cos(a)*16,-31+Math.sin(a)*4,10,'#f9d778','center')}c.restore();return;
      }
      const bob=crouch?0:Math.abs(Math.sin(walk))*1.3;
      c.translate(0,-bob);
      const coat=player?'#b9c9ad':armor?'#627d89':'#a65b59',shade=player?'#668d7b':armor?'#344f60':'#673943';
      // Separate articulated legs and boots make patrol direction and motion visible.
      const stride=crouch?0:Math.sin(walk)*7;
      line(-6,-19,-7-stride,-3,'#112431',7);line(5,-19,6+stride,-3,'#223b47',7);
      box(-12-stride,-4,13,5,'#071722',2);box(3+stride,-4,14,5,'#0a1b26',2);
      if(crouch){c.translate(0,16);c.scale(1,.64)}
      shape([[-9,-44],[7,-44],[12,-23],[15,-13],[-14,-13],[-10,-29]],coat,'#142832',1.6);
      shape([[-9,-41],[-3,-35],[-6,-15],[-14,-14]],shade);shape([[3,-43],[8,-41],[7,-19],[2,-22]],player?'#e2e2c1':'#be8370');
      line(-7,-27,10,-27,'#3b4d48',3);box(0,-29,4,4,'#d6b779',1);
      if(armor){box(-12,-41,23,16,'#8ba1a1',4);line(-8,-37,6,-37,'#d3d6bd');line(-5,-34,-5,-28,'#476473',2);line(3,-34,3,-28,'#476473',2);box(-15,-43,8,7,'#bdc9b7',2)}
      else {shape([[-4,-42],[0,-35],[4,-43]],'#e9dbb9');line(0,-36,1,-30,player?'#aa5a44':'#273c46',2);box(-7,-25,4,5,'#d2c59a66',1)}
      // Forward arm and small pulse pistol have an outlined, readable silhouette.
      line(-6,-37,3,-31,shade,7);line(3,-31,17,-32,coat,6);oval(18,-32,3,3,'#dfb893');box(17,-35,15,5,'#172c36',1);box(21,-32,4,6,'#233d48',1);box(29,-35,3,3,player?'#d4f0cc':'#d5aa79');
      oval(0,-49,8,10,'#dfb893');shape([[5,-52],[11,-48],[7,-46],[6,-42],[-3,-41],[-5,-49]],'#dfb893');line(6,-49,9,-49,'#152f38',2);line(4,-43,7,-43,'#9d6b59');
      if(player){shape([[-10,-53],[-7,-61],[5,-60],[9,-53]],'#34565a','#162f3a');box(-14,-54,27,4,'#638277',2);box(-7,-56,14,2,'#d3c08c');shape([[-8,-49],[-5,-50],[-4,-44],[-7,-43]],'#4d493e')}
      else if(armor){box(-9,-60,19,13,'#607e8b',5);box(-1,-54,13,5,'#d4b87c',2);line(0,-52,10,-52,'#f2d894');box(-9,-51,5,7,'#344c60',1)}
      else {box(-10,-59,19,8,'#453440',3);box(-3,-53,18,3,'#222c37',1);box(-2,-57,4,3,'#e0c28d',1)}
      c.restore();
    }
    const aura=document.createElement('canvas');aura.width=96;aura.height=96;
    const ac=aura.getContext('2d'),ag=ac.createRadialGradient(48,48,2,48,48,46);ag.addColorStop(0,'#ffcc7840');ag.addColorStop(1,'#ffcc7800');ac.fillStyle=ag;ac.fillRect(0,0,96,96);
    build();
    function render(s){
      c=main;c.setTransform(scale,0,0,scale,0,0);c.clearRect(0,0,960,600);
      const t=reduced?0:Math.max(0,120-s.time),p=s.player; c.save();
      if(!reduced&&s.shake>0)c.translate(Math.sin(t*90)*s.shake*5,0);
      c.drawImage(backdrop,0,0,960,600);
      c.save();c.beginPath();c.rect(39,34,886,501);c.clip();
      for(const x of shafts)for(let i=0;i<5;i++){
        const y=floors[i],active=i===p.floor&&Math.abs(p.x-x)<46;
        const open=active?Math.max(.12,1-Math.max(0,p.lift-.2)*2):0;
        if(active){box(x-23,y-56,46,61,'#142932');box(x-20,y-51,40,3,'#ffe4a2');box(x-16,y-45,32,47,'#5d766a');line(x-12,y-42,x-12,y-1,'#bfb78666');box(x-22,y-56,23*(1-open),61,'#8b9c8e');box(x+23*open,y-56,23*(1-open),61,'#627f7b');box(x-24,y+4,48,2,'#ffe3a2');box(x-11,y-75,22,5,'#ddc47e');text('↕',x,y-67,10,'#fff0bf','center')}
      }
      for(const f of s.files)if(!f.taken){const y=floors[f.floor],bob=reduced?0:Math.sin(t*2.7+f.x)*1.6;c.drawImage(aura,f.x-40,y-77,80,80);c.save();c.translate(f.x,y-27+bob);c.rotate(-.07);box(-17,-21,34,35,'#192b3280',2);box(-16,-25,30,34,'#b44342',3);box(-12,-30,14,8,'#cd6760',2);box(-11,-22,24,26,'#f0ddb1',1);line(-6,-15,8,-15,'#99483f',2);line(-6,-10,5,-10,'#a38d6c');line(-6,-6,8,-6,'#a38d6c');box(-8,0,18,5,'#b45042');text('FILE',1,4,5,'#ffe9b7','center');c.restore();shape([[f.x-4,y-63],[f.x+4,y-63],[f.x,y-59]],'#ffe5a1')}
      for(const cam of s.cameras){const y=floors[cam.floor],bx=cam.x+Math.sin(cam.phase)*85;c.fillStyle='#ffd99118';c.beginPath();c.moveTo(cam.x,y-68);c.lineTo(bx-22,y+4);c.lineTo(bx+22,y+4);c.closePath();c.fill();line(cam.x,y-68,bx-22,y+4,'#e9c67f27');line(cam.x,y-68,bx+22,y+4,'#e9c67f27');oval(bx,y+3,21,3,'#f2c66c55');box(cam.x-3,y-79,6,10,'#101d28',1);c.save();c.translate(cam.x,y-68);c.rotate(Math.sin(cam.phase)*.45);box(-12,-5,24,10,'#aab4a4',3);box(-15,-3,5,7,'#243b46',1);oval(-13,0,2,2,'#ef8568');line(-8,-3,6,-3,'#e8e5c4');c.restore()}
      for(const g of s.guards)actor(g.x,floors[g.floor],g.dir,g.armor?'armor':'guard',reduced?0:g.x*.095,false,g.stun);
      for(const b of s.bullets){const dir=Math.sign(b.vx);line(b.x-dir*16,b.y,b.x,b.y,'#f0bb6d66',3);box(b.x-4,b.y-2,9,4,'#ffe9b5',2)}
      if(s.beam>0){const y=floors[p.floor]-32;line(p.x+p.face*21,y,p.x+p.face*220,y,'#c5efcf38',9);line(p.x+p.face*21,y,p.x+p.face*220,y,'#e7f6c8',2);for(let k=0;k<3;k++){const d=31+k*6;line(p.x+p.face*d,y-6+k*2,p.x+p.face*(d+5),y+5-k*2,'#fff1b9',1)}}
      c.globalAlpha=p.inv>0&&Math.floor(p.inv*9)%2? .48:1;
      actor(p.x,floors[p.floor],p.face,'agent',reduced?0:p.x*.1,p.crouch);c.globalAlpha=1;
      // The objective exit is quiet until every file has been collected.
      const unlocked=s.files.length>0&&s.files.every(f=>f.taken);box(892,440,33,62,'#121f28',2);box(896,444,25,55,unlocked?'#498b7b':'#354d51',1);box(900,448,17,34,unlocked?'#90baa2':'#466061');line(909,449,909,481,'#bdd7b033');oval(918,486,1.6,1.6,'#e5c88c');box(889,429,38,10,unlocked?'#b6dbab':'#49675f',2);text('EXIT →',908,437,7,unlocked?'#183c34':'#c2caa8','center');
      c.restore();
      text(`SHIFT ${String(s.stage).padStart(2,'0')}  /  07`,898,567,10,'#d6c6a1','right');text(unlocked?'FILES SECURED · GROUND EXIT →':'RECOVER THE RED DOSSIERS',898,579,6.5,unlocked?'#b2d7ac':'#7e9b98','right');
      if(s.flash>0)box(39,34,886,501,`rgba(255,232,171,${s.flash*.22})`);c.restore();
    }
    return {draw:render};
  }};
})();

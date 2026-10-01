(() => {
  'use strict';
  const W=960,H=720,background=document.createElement('canvas');background.width=W;background.height=H;const b=background.getContext('2d');
  const poly=(c,points,color)=>{c.fillStyle=color;c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fill();};
  function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
  function line(c,points,color,width){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.lineJoin='round';c.beginPath();points.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.stroke();}
  function tree(c,x,y,size=1){c.save();c.translate(x,y);c.scale(size,size);ellipse(c,12,8,30,9,'#779caf30');c.fillStyle='#765b43';c.fillRect(-4,-13,8,21);poly(c,[[-28,-13],[0,-59],[28,-13]],'#174e60');poly(c,[[-23,-30],[0,-74],[23,-30]],'#256475');poly(c,[[-17,-47],[0,-89],[17,-47]],'#367b87');poly(c,[[-17,-47],[0,-89],[2,-57]],'#f6fbfc');poly(c,[[-23,-30],[-14,-47],[3,-38],[12,-30]],'#dceff3');poly(c,[[-28,-13],[-19,-29],[-3,-21],[12,-13]],'#e5f4f7');line(c,[[0,-79],[0,-20]],'#accbd333',2);c.restore();}
  const grad=b.createLinearGradient(0,0,960,720);grad.addColorStop(0,'#d0e4ee');grad.addColorStop(.5,'#f7fcff');grad.addColorStop(1,'#e5f2f7');b.fillStyle=grad;b.fillRect(0,0,W,H);
  poly(b,[[0,70],[190,155],[480,67],[790,134],[960,70],[960,0],[0,0]],'#91b3c5');
  poly(b,[[0,77],[143,128],[302,66],[449,143],[649,69],[852,135],[960,99],[960,0],[0,0]],'#f5fcfe');
  poly(b,[[40,720],[128,480],[130,300],[169,140],[214,74],[0,74],[0,720]],'#b9d6e2');poly(b,[[916,720],[831,430],[817,265],[785,100],[747,74],[960,74],[960,720]],'#c6deea');
  line(b,[[129,710],[158,475],[153,275],[206,118]],'#fff9',5);line(b,[[826,710],[798,475],[800,275],[754,118]],'#ffffffa0',5);
  for(let i=0;i<18;i++){const y=100+i*37;tree(b,48+(i%3)*28,y,.65+(i%4)*.08);tree(b,908-(i%3)*22,y,.66+(i%3)*.1);}
  for(let i=0;i<100;i++){const x=150+(i*173%660),y=100+(i*97%600);line(b,[[x,y],[x+10,y-2]],'#91b2c318',1);}
  // Lift cable, chairs and timber boundary markers anchor the resort setting.
  line(b,[[12,120],[110,685]],'#294e6380',2);for(let y=166;y<690;y+=128){const x=12+(y-120)*.17;line(b,[[x,y],[x,y+18]],'#294e63',2);line(b,[[x-10,y+19],[x+10,y+19],[x+10,y+31],[x-10,y+31]],'#e6ab45',4);}
  function gate(c,g,y,motion,time,mobile){const left=g.x-g.width/2,right=g.x+g.width/2,color=g.done?(g.hit?'#368a76':'#788c9b'):(g.num%2?'#c55253':'#327eaf');
    ellipse(c,left+5,y+4,10,4,'#577f9440');ellipse(c,right+5,y+4,10,4,'#577f9440');
    for(const[x,side]of[[left,1],[right,-1]]){line(c,[[x,y],[x,y-49]],'#244d66',3);const flutter=motion?0:Math.sin(time*4+g.num)*2;poly(c,[[x,y-48],[x+side*33,y-45+flutter],[x+side*33,y-24+flutter],[x,y-27]],color);line(c,[[x,y-47],[x+side*30,y-44]],'#fff8',2);}
    if(!g.done){c.setLineDash([8,9]);line(c,[[left+8,y],[right-8,y]],color+'55',2);c.setLineDash([]);ellipse(c,g.x,y-12,mobile?25:20,mobile?21:17,'#ffffffed');c.fillStyle='#214f6c';c.font=`bold ${mobile?27:21}px Trebuchet MS`;c.textAlign='center';c.fillText(g.num,g.x,y-5);if(g.linked){line(c,[[g.x-14,y-48],[g.x-5,y-40],[g.x+4,y-48]],'#b16c15',3);line(c,[[g.x-3,y-48],[g.x+6,y-40],[g.x+15,y-48]],'#b16c15',3);}}
    else{c.fillStyle=color;c.font='bold 21px Trebuchet MS';c.textAlign='center';c.fillText(g.hit?'✓':'×',g.x,y-8);}
  }
  function skier(c,x,y,lean,coat='#e9af36',braking=false){c.save();c.translate(x,y);c.rotate(lean);ellipse(c,9,12,22,11,'#517b9740');line(c,[[-12,-9],[-13,26]],'#24465d',5);line(c,[[12,-9],[13,26]],'#24465d',5);line(c,[[-13,-13],[-12,15]],'#ffc65b',2);line(c,[[13,-13],[12,15]],'#ffc65b',2);line(c,[[-7,4],[-9,17]],'#285674',6);line(c,[[7,4],[9,17]],'#285674',6);ellipse(c,0,-4,13,15,coat);line(c,[[-5,-11],[-19,0],[-23,12]],coat,7);line(c,[[5,-11],[18,-1],[22,10]],coat,7);line(c,[[-22,8],[-32,29]],'#647f8b',2);line(c,[[22,8],[31,28]],'#647f8b',2);ellipse(c,0,-20,10,11,'#fff5d6');ellipse(c,0,-23,10,8,'#faf9f4');line(c,[[-7,-18],[7,-18]],'#20435b',5);line(c,[[-3,-4],[3,-4]],'#fff9',2);if(braking){line(c,[[-18,32],[-8,22],[0,35],[8,22],[18,32]],'#ffffffce',3);}c.restore();}
  function draw(c,s,motion){const mobile=matchMedia('(max-width:900px)').matches||matchMedia('(pointer:coarse)').matches,scale=mobile?1:2;if(c.canvas.width!==W*scale){c.canvas.width=W*scale;c.canvas.height=H*scale;}c.setTransform(scale,0,0,scale,0,0);c.drawImage(background,0,0);c.save();c.beginPath();c.rect(125,75,710,610);c.clip();
    // Faint repeating snow contours and continuous carved ski tracks.
    const offset=s.distance%180;for(let y=offset-180;y<740;y+=180){line(c,[[150,y],[390,y+18],[640,y-12],[815,y+5]],'#90bbcf25',2);}
    if(s.tracks.length>1){for(const shift of[-9,9]){const points=s.tracks.map(t=>[t.x+shift,580+s.distance-t.d]);line(c,points,'#7ea9bd6e',2);}}
    const visible=[];for(const g of s.gates){const y=580+s.distance-g.y;if(y>60&&y<770)visible.push({item:g,y});}for(const v of visible)gate(c,v.item,v.y,motion,s.time,mobile);
    const finishY=580+s.distance-s.finish;if(finishY>-40&&finishY<780){for(let i=0;i<16;i++)for(let j=0;j<2;j++){c.fillStyle=(i+j)%2?'#fafcfd':'#315f7b';c.fillRect(155+i*40,finishY+j*20,40,20);}c.fillStyle='#194663';c.font='bold 24px Trebuchet MS';c.textAlign='center';c.fillText('FINISH',480,finishY-14);}
    skier(c,s.x,580,s.heading,'#f3bd47',s.speedControl==='brake');
    for(const p of s.particles){c.globalAlpha=Math.max(0,p.life/.55);ellipse(c,p.x,p.y,3,3,p.color);}c.globalAlpha=1;c.restore();
    if(s.flash>0){c.fillStyle=`rgba(241,183,57,${s.flash*.3})`;c.fillRect(0,75,W,H-75);}if(s.mode==='paused'){c.fillStyle='#123d5c88';c.fillRect(0,0,W,H);c.fillStyle='white';c.font='bold 44px Georgia';c.textAlign='center';c.fillText('Race paused.',480,345);}
  }
  window.AlpineArt={draw};
})();

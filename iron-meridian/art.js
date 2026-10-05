/* Illustrated Canvas artwork. Visual geometry is independent of collision geometry. */
window.createIronArtwork = function(ctx, scale) {
  'use strict';
  const outline = '#102333', paths = new Map(), brushes = new Map(), scenes = new Map();
  const palettes = [
    ['#30475a','#b6a68b','#648da2','#ffd3a2'],
    ['#253e60','#a0bbd0','#5e819f','#e7e6ac'],
    ['#244e48','#a5cfab','#568d77','#d6eaba'],
    ['#2c4f70','#d9f3fa','#78a9c4','#c4edf6'],
    ['#44304e','#e3b6b0','#94758e','#ffca9d']
  ];
  function path(d, fill, stroke=outline, width=1.2) {
    let p=paths.get(d); if(!p){p=new Path2D(d);if(paths.size>700)paths.clear();paths.set(d,p);}
    ctx.fillStyle=fill;ctx.fill(p);if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke(p);}
  }
  function ellipse(x,y,rx,ry,fill,stroke=null,width=1) {
    ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
  }
  function rounded(x,y,w,h,r,fill,stroke=null,width=1) {
    ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();
    if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
  }
  function line(x,y,xx,yy,color,width=1) {ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(xx,yy);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.stroke();}
  function metal(color) {
    if(!brushes.has(color)) {const g=ctx.createLinearGradient(-20,-55,35,65);g.addColorStop(0,'#f0faf8');g.addColorStop(.2,color);g.addColorStop(.5,color);g.addColorStop(1,'#20374b');brushes.set(color,g);}
    return brushes.get(color);
  }
  function joint(x,y,r,color) {ellipse(x,y,r,r,metal(color),outline,1.2);ellipse(x-r*.2,y-r*.3,r*.35,r*.2,'#efffff88');}
  function limb(x,y,xx,yy,width,color) {line(x,y,xx,yy,outline,width+2.5);line(x,y,xx,yy,metal(color),width);line(x-1,y-1,xx-1,yy-1,'#e4fbff55',Math.max(1,width*.16));}
  function glow(x,y,r,color) {ellipse(x,y,r*1.8,r*1.8,color+'12');ellipse(x,y,r*1.25,r*1.25,color+'33');ellipse(x,y,r,r,color);ellipse(x-r*.18,y-r*.2,r*.55,r*.42,'#f7ffff');}
  function label(s,x,y,color,size=10) {ctx.font=`600 ${size}px "Segoe UI",sans-serif`;ctx.textAlign='center';ctx.fillStyle=color;ctx.fillText(s,x,y);ctx.textAlign='left';}

  function makeScene(stage,s) {
    const p=palettes[stage],width=1536;
    function surface(w,h){const c=document.createElement('canvas');c.width=w*scale;c.height=h*scale;const g=c.getContext('2d');g.scale(scale,scale);return [c,g];}
    const [sky,g]=surface(960,540),gradient=g.createLinearGradient(0,0,0,540);
    gradient.addColorStop(0,s.sky[0]);gradient.addColorStop(.58,s.sky[1]);gradient.addColorStop(1,p[0]);g.fillStyle=gradient;g.fillRect(0,0,960,540);
    if(stage===0){const sun=g.createRadialGradient(741,207,20,741,207,120);sun.addColorStop(0,'#ffefcc');sun.addColorStop(.58,'#ffd1a4');sun.addColorStop(.61,'#ffd0a340');sun.addColorStop(1,'#ffc69200');g.fillStyle=sun;g.fillRect(615,80,250,250);}
    if(stage===4){g.strokeStyle='#e5ba9680';g.lineWidth=12;g.beginPath();g.arc(750,235,151,Math.PI,Math.PI*2);g.stroke();g.lineWidth=2;for(let n=0;n<3;n++){g.beginPath();g.arc(750,235,176+n*11,Math.PI,Math.PI*2);g.stroke();}}
    // Wispy cloud banks have irregular contours rather than repeated ovals.
    for(let n=0;n<6;n++) {
      const x=(n*239)%1130-80,y=110+(n%3)*48,w=135+n%3*51;
      g.beginPath();g.moveTo(x,y);g.bezierCurveTo(x+w*.1,y-7,x+w*.2,y-3,x+w*.28,y-13);g.bezierCurveTo(x+w*.4,y-25,x+w*.5,y-6,x+w*.58,y-9);g.bezierCurveTo(x+w*.7,y-14,x+w*.89,y-6,x+w,y);g.bezierCurveTo(x+w*.76,y+8,x+w*.2,y+9,x,y);g.closePath();g.fillStyle=stage===1?'#c2d3e821':'#ffead91a';g.fill();
    }
    const layers=[];
    for(let layer=0;layer<3;layer++) {
      const [c,q]=surface(width,540);const dark=layer===0?s.dark:layer===1?p[0]:p[2];
      const fill=q.createLinearGradient(0,160,0,455);fill.addColorStop(0,dark);fill.addColorStop(1,layer===2?s.dark:dark);q.fillStyle=fill;
      const rr=(x,y,w,h,r,color)=>{q.beginPath();q.roundRect(x,y,w,h,r);q.fillStyle=color;q.fill();};
      const el=(x,y,rx,ry,color)=>{q.beginPath();q.ellipse(x,y,rx,ry,0,0,Math.PI*2);q.fillStyle=color;q.fill();};
      const ln=(x,y,xx,yy,color,w=1)=>{q.beginPath();q.moveTo(x,y);q.lineTo(xx,yy);q.strokeStyle=color;q.lineWidth=w;q.stroke();};
      if(stage===3&&layer<2){q.beginPath();q.moveTo(0,460);for(let n=0;n<=16;n++){const x=n*width/16;q.lineTo(x,245+Math.sin(n*2.1+layer)*90);}q.lineTo(width,540);q.lineTo(0,540);q.closePath();q.fillStyle=layer===0?'#456982':'#6e97ad';q.fill();for(let n=0;n<8;n++){const x=n*200+35;q.beginPath();q.moveTo(x,240);q.lineTo(x+35,189);q.lineTo(x+100,288);q.lineTo(x+36,265);q.closePath();q.fillStyle='#d4e9ef55';q.fill();}}
      for(let n=0;n<8;n++) {
        const x=n*211+11,y=layer===2?305+(n%3)*17:260+Math.sin(n*7+layer)*75,h=445-y;
        if(stage===2){
          // Irregular broadleaf crowns, roots and a glass research dome.
          const tx=x+88;q.beginPath();q.moveTo(tx-14,452);q.bezierCurveTo(tx+1,395,tx-2,300,tx-21,225);q.lineTo(tx-8,214);q.bezierCurveTo(tx+32,303,tx+14,390,tx+32,452);q.closePath();q.fillStyle=layer===2?'#436b60':dark;q.fill();
          for(let k=0;k<8;k++){const a=k*2.35,xx=tx+Math.cos(a)*62,yy=190+Math.sin(a)*48+layer*25;el(xx,yy,42+k%3*6,27+k%2*9,layer===2?['#608e70','#72a57a','#497967'][k%3]:dark);if(layer===2){el(xx-9,yy-7,25,12,'#b4d19a19');ln(tx,290,xx,yy,'#264e4988',3);}}
          if(layer===2&&n%2===0){q.beginPath();q.ellipse(x+81,421,85,93,0,Math.PI,Math.PI*2);q.lineTo(x+166,445);q.lineTo(x-4,445);q.closePath();q.fillStyle='#7cae9e44';q.fill();q.strokeStyle='#b3d5b299';q.lineWidth=2;q.stroke();for(let k=1;k<4;k++){q.beginPath();q.ellipse(x+81,421,18+k*16,93,0,Math.PI,Math.PI*2);q.stroke();}ln(x-2,397,x+164,397,'#b3d5b288',2);}
        }else{
          const bw=104+n%3*21;rr(x,y,bw,h+35,layer===2?12:6,fill);if(layer===2){const face=q.createLinearGradient(x,0,x+bw,0);face.addColorStop(0,'#e7f1e51a');face.addColorStop(.4,'#ffffff00');face.addColorStop(1,'#071f3255');rr(x,y+8,bw,h+20,9,face);}q.fillStyle=dark;q.beginPath();q.ellipse(x+bw/2,y+3,bw/2,12,0,Math.PI,Math.PI*2);q.fill();
          if(layer===2){ln(x+7,y+10,x+7,440,'#d3e8e233',2);rr(x+10,y+12,bw-20,7,3,'#b0cbd344');for(let k=0;k<3;k++)ln(x+10,y+20+k*7,x+bw-10,y+20+k*7,'#dfede622',1);}
          for(let yy=y+27;yy<433;yy+=24)for(let xx=x+16;xx<x+bw-15;xx+=21)rr(xx,yy,7,11,3,layer===2?s.color+'44':'#d5bfc22a');
          if(stage===0&&layer===1){ln(x+bw+27,440,x+bw+27,210,dark,7);ln(x+bw+27,210,x-45,252,dark,4);ln(x-45,252,x+bw+27,267,dark,4);ln(x-40,255,x-40,343,dark,1.5);}
          if(stage===1&&layer===2){rr(x+bw-30,y-40,17,55,8,'#526f8a');el(x+bw-22,y-40,13,5,'#b5ccdd');ln(x+bw-22,y-44,x+bw-22,y-75,'#9aafc5',2);}
          if(stage===3&&layer===2){q.beginPath();q.moveTo(x+4,y+8);for(let k=0;k<6;k++){q.lineTo(x+k*bw/6+9,y+6);q.lineTo(x+k*bw/6+18,y+25+k%3*11);}q.lineTo(x+bw-4,y+8);q.closePath();q.fillStyle='#c1e2ed';q.fill();}
          if(stage===4&&layer===2){el(x+bw/2,y+63,37,37,'#261e36');el(x+bw/2,y+63,28,28,'#ad828088');el(x+bw/2,y+63,22,22,'#48344d');q.strokeStyle='#e8b59a66';q.lineWidth=2;for(let k=0;k<6;k++){const a=k*Math.PI/3;ln(x+bw/2+Math.cos(a)*22,y+63+Math.sin(a)*22,x+bw/2+Math.cos(a+.25)*34,y+63+Math.sin(a+.25)*34,'#e8b59a66',3);}}
        }
      }
      if(layer===2){
        // Rounded tanks, conduits, suspended cables and layered foreground plants.
        for(let n=0;n<5;n++){const x=n*321+46;
          if(stage===2){for(let k=0;k<7;k++){const xx=x+k*12;ln(xx,443,xx+Math.sin(k)*16,404-k%3*12,'#78a379',2);el(xx+Math.sin(k)*16,404-k%3*12,9,4,k%2?'#a9c69b':'#679c7a');}continue;}
          rr(x,367,63,75,14,s.dark);el(x+31,367,31,10,p[1]);rr(x+7,373,10,57,5,'#d8ede633');rr(x+20,390,37,22,8,'#142d3e');rr(x+24,394,29,5,2,s.color+'99');
          q.beginPath();q.moveTo(x+63,399);q.bezierCurveTo(x+112,398,x+114,417,x+164,417);q.strokeStyle=p[0];q.lineWidth=10;q.stroke();q.strokeStyle=p[1]+'66';q.lineWidth=2;q.stroke();
          if(stage===0){rr(x+160,386,98,58,5,'#52666c');for(let k=0;k<7;k++)ln(x+170+k*12,390,x+170+k*12,437,'#a6a58c66',2);}
          if(stage===1){ln(x+148,390,x+148,325,p[0],4);ln(x+120,337,x+177,337,p[1],3);}
          if(stage===3){el(x+43,444,65,9,'#c5dfe4');el(x+191,444,47,7,'#c5dfe4');}
          if(stage===4){rr(x+149,389,100,53,9,'#594053');rr(x+164,400,70,26,12,'#231c35');for(let k=0;k<6;k++)rr(x+172+k*10,405,4,16,2,'#f4bc9377');}
        }
      }
      layers.push(c);
    }
    return {sky,layers,width};
  }
  function backdrop(v) {
    const {stage,s,camera,t,reduced}=v;if(!scenes.has(stage))scenes.set(stage,makeScene(stage,s));const scene=scenes.get(stage);
    ctx.drawImage(scene.sky,0,0,960,540);
    scene.layers.forEach((image,n)=>{const offset=((camera*[.12,.28,.62][n])%scene.width+scene.width)%scene.width;ctx.drawImage(image,-offset,0,scene.width,540);ctx.drawImage(image,scene.width-offset,0,scene.width,540);});
    if(stage===0){ctx.fillStyle='#46687955';ctx.fillRect(0,432,960,16);for(let n=0;n<20;n++)line((n*81-camera*.2+t*9)%1030,435+n%3*4,(n*81-camera*.2+t*9)%1030+30,435+n%3*4,'#ffd0a344');}
    if(!reduced)for(let n=0;n<(stage===1?35:18);n++){const x=((n*137-camera*.3+t*(stage===1?150:9))%1000+1000)%1000,y=100+((n*79+t*(stage===1?280:stage===3?22:-8))%340+340)%340;if(stage===1)line(x,y,x-8,y+19,'#d4e9ff44');else if(stage===3)ellipse(x,y,1.4,1.4,'#e8faff99');else if(stage===2)ellipse(x,y,1.5,1,'#efffa566');else if(stage===4)ellipse(x,y,1,2,'#ffca9e88');}
  }
  function platform(a,v){const x=a.x-v.camera,y=a.y,s=v.s;if(x>980||x+a.w<0)return;
    const visibleX=Math.max(x,-20),width=Math.min(x+a.w,980)-visibleX;
    rounded(visibleX,y,width,a.h,a.oneway?5:2,'#1a3041');rounded(visibleX,y,width,11,4,metal(s.light));line(visibleX,y+1,visibleX+width,y+1,v.stage===3?'#efffff':s.color,2);line(visibleX,y+10,visibleX+width,y+10,'#0f2534',2);
    if(a.ground){for(let n=Math.floor((visibleX-x)/72);x+n*72<x+a.w&&x+n*72<980;n++){const xx=x+n*72;rounded(xx+5,y+21,62,55,6,s.dark,'#718f9b44');line(xx+10,y+25,xx+59,y+25,'#bdd5d533');for(let k=0;k<5;k++)line(xx+14,y+35+k*6,xx+49,y+35+k*6,'#0d2638',2);ellipse(xx+57,y+65,2,2,s.color+'88');}line(visibleX,y+83,visibleX+width,y+83,'#65879844',2);}
    if(a.oneway){rounded(visibleX,y+12,width,10,4,'#263d4d');for(let xx=x+15;xx<x+a.w-10;xx+=45){if(xx<0||xx>980)continue;glow(xx,y+16,2,'#ffdba0');line(xx,y+23,xx+18,y+42,'#233e4d',3);} }
    if(a.wall){rounded(x+4,y+13,a.w-8,a.h-15,7,s.light);for(let n=0;n<6;n++)rounded(x+9,y+24+n*14,a.w-18,3,1,'#163546');label('↑',x+a.w/2,y-10,s.color,18);}
  }
  function cannon(p,c,dir,y){ctx.save();ctx.translate(9,y);if(p.aim)ctx.rotate(Math.atan2(p.aimY,p.aimX*dir));limb(0,0,7,1.5,7,'#b0d3dd');rounded(7,-5.5,14,13,6,metal(c),outline,1.4);ellipse(20,1,3.5,6,'#2e566e',outline);glow(20,1,2.1,'#ffecb8');line(9,-3.5,16,-3.5,'#efffff',1);ctx.restore();}
  function hero(x,y,dir,alpha,v){const p=v.player,c=v.weapon.color,run=p.ground&&Math.abs(p.vx)>35?Math.round(Math.sin(v.t*18)*4)/4:0;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x+13,y);ctx.scale(dir,1);
    if(p.crouch){
      ellipse(1,26,18,2,'#0a1d3166');
      limb(-4,17,-10,22,6,'#42677f');limb(-10,22,-1,24,7,c);rounded(-13,22,19,5,2,metal(c),outline);
      limb(5,17,13,20,6,'#29465f');limb(13,20,12,24,7,c);rounded(5,22,18,5,2,metal(c),outline);
      path('M -9 10 Q 0 7 9 11 L 10 18 Q 0 22 -10 17 Z',metal(c));ellipse(-9,10,5,4,metal('#c4e5e8'),outline);glow(0,14,2.5,c);
      path('M -10 3 Q -10 -6 0 -6 Q 9 -6 11 2 L 10 7 Q 1 13 -8 7 Z',metal(c));path('M -7 -1 Q 0 -4 10 -1 L 10 3 Q 1 7 -6 3 Z','#15334c');path('M -2 0 L 9 -1 L 8 2 L -2 3 Z','#ffe5a2',null);ellipse(-9,2,2.5,3,'#587f96',outline);
      cannon(p,c,dir,9);path('M -9 7 Q -19 3 -24 10 L -10 10 Z','#df9b73',outline,.6);
      if(v.charge>.05){line(-12,31,12,31,'#163b4d',3);line(-12,31,-12+24*Math.min(1,v.charge/.65),31,c,2);if(v.charge>=.65){ctx.strokeStyle=c+'99';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(1,12,23,19,0,0,Math.PI*2);ctx.stroke();}}
      ctx.restore();return;
    }
    ellipse(0,44,16,2,'#0a1d3166');
    if(p.dash>0){ctx.translate(0,4);ctx.rotate(-.32);}else if(!p.ground){ctx.rotate(p.wall?.12:-.05);}
    const swing=run*7,air=!p.ground;
    // Animated two-part legs with knee joints and contoured boots.
    limb(-4,27,-6-swing*.5,35,6,'#42677f');joint(-6-swing*.5,35,3,'#607b94');limb(-6-swing*.5,35,-5+swing,air?40:41,7,c);
    path(`M ${-10+swing} 37 Q ${-3+swing} 36 ${-1+swing} 39 L ${5+swing} 41 Q ${7+swing} 44 ${3+swing} 44 L ${-10+swing} 44 Q ${-13+swing} 42 ${-10+swing} 37 Z`,metal(c));
    limb(5,27,8+swing*.6,34,6,'#29465f');joint(8+swing*.6,34,3,'#5c7e91');limb(8+swing*.6,34,7-swing,air?39:41,7,c);
    path(`M ${2-swing} 37 Q ${8-swing} 35 ${12-swing} 39 L ${17-swing} 42 Q ${18-swing} 44 ${14-swing} 44 L ${2-swing} 44 Z`,metal(c));
    path('M -8 25 Q 0 22 9 25 L 9 30 Q 0 34 -8 29 Z','#233e57');
    // Rounded chest, asymmetrical shoulder armor and a recessed core.
    limb(-8,16,-12,25,6,'#5e8796');joint(-12,25,3,c);
    path('M -10 14 Q -8 10 0 11 Q 9 10 11 16 L 8 27 Q 0 31 -8 26 Z',metal(c));path('M -5 15 Q 2 12 7 16 L 4 23 Q -2 25 -6 21 Z','#244963');glow(0,18,3,c);
    ellipse(-9,14,6,5,metal('#c4e5e8'),outline);line(-12,12,-8,11,'#f5ffff',1);
    // Visored helmet uses curves rather than a square head.
    path('M -10 7 Q -12 -3 -3 -5 Q 7 -8 11 1 L 12 8 Q 7 14 -3 12 Q -9 11 -10 7 Z',metal(c));
    path('M -7 2 Q 1 -1 10 2 L 11 6 Q 4 10 -5 7 Z','#15334c');path('M -3 3 Q 4 1 10 3 L 9 5 L -3 6 Z','#ffe5a2',null);ellipse(-9,5,2.5,4,'#587f96',outline);line(-6,-2,3,-4,'#f3ffff',1.2);path('M -3 10 Q 4 11 9 7 L 7 12 L -2 13 Z','#a7cbd6',null);
    cannon(p,c,dir,17.5);
    // A fabric cable/scarf adds motion and a recognizable silhouette.
    path(`M -8 10 Q -18 ${7+run*2} -23 ${13+run*3} Q -13 ${11+run*3} -8 14 Z`,'#df9b73',outline,.6);
    if(v.charge>.05){line(-12,49,12,49,'#163b4d',3);line(-12,49,-12+24*Math.min(1,v.charge/.65),49,c,2);}if(v.charge>=.65){ctx.strokeStyle=c+'aa';ctx.lineWidth=1.3;ctx.beginPath();ctx.ellipse(2,19,25+Math.sin(v.t*20)*2,28,0,0,Math.PI*2);ctx.stroke();for(let n=0;n<4;n++){const a=v.t*8+n*1.57;glow(2+Math.cos(a)*26,19+Math.sin(a)*28,1.6,c);}}
    ctx.restore();
  }
  function enemy(e,v){ctx.save();ctx.translate(e.x-v.camera,e.y);const p=palettes[v.stage],c=v.s.color;
    if(e.type==='drone'){ctx.translate(19,17);const flap=Math.sin(v.t*13+e.phase)*5;for(const sign of [-1,1]){ctx.save();ctx.scale(sign,1);path(`M 10 -4 Q 25 ${-15+flap} 35 ${-5+flap} L 29 ${3+flap} Q 19 5 10 3 Z`,metal(p[2]));ellipse(27,-3+flap,9,2,'#c7eaff88');ctx.restore();}ellipse(0,0,16,13,metal(p[1]),outline,1.5);path('M -12 -4 Q 0 -9 13 -3 L 10 4 Q 0 8 -10 3 Z','#193248');glow(2,0,4,'#ffb390');ellipse(0,14,5,3,'#fff2b9');path('M -5 16 Q 0 29 5 16 Z','#f8ce9166',null);}
    else if(e.type==='turret'){ellipse(17,27,22,4,'#122a3e');rounded(0,21,35,8,4,metal(p[2]),outline);ellipse(17,16,15,13,metal(p[1]),outline,1.5);ellipse(17,16,9,9,metal(p[2]),outline);ctx.save();ctx.translate(17,15);ctx.rotate(Math.atan2(v.player.y+18-e.y-15,v.player.x-e.x-17));rounded(-2,-5,25,10,4,metal('#b1c5cb'),outline);ellipse(24,0,2.5,5,'#2a4356',outline);glow(23,0,1.8,'#ffbe8c');ctx.restore();line(7,23,26,23,c,1);}
    else{const run=Math.sin(v.t*9+e.phase)*5;limb(9,25,6+run,35,6,p[2]);limb(25,25,29-run,35,6,p[2]);rounded(1+run,32,13,6,3,'#182f45');rounded(23-run,32,13,6,3,'#182f45');ellipse(17,18,19,14,metal(p[2]),outline,1.5);path('M 1 12 Q 6 0 18 1 Q 31 1 33 13 L 27 18 L 7 18 Z',metal(p[1]));path('M 5 12 Q 17 6 29 12 L 27 19 Q 15 23 7 18 Z','#19344a');glow(17,14,4,'#ffb59a');ellipse(1,20,4,7,metal(p[1]),outline);ellipse(33,20,4,7,metal(p[1]),outline);line(8,26,26,26,c,1.5);}
    ctx.restore();
  }
  function boss(b,v){if(!b||b.hp<=0)return;ctx.save();ctx.translate(b.x-v.camera+39,b.y+48);const p=palettes[v.stage],c=v.s.color,attack=b.phase==='attack',pulse=Math.sin(v.t*5),move=Math.round(Math.sin(v.t*8)*3)/3;if(b.inv>0)ctx.globalAlpha=.65;
    ellipse(0,51,58,5,'#0c192855');
    if(v.stage===0){
      // A broad plated crustacean, not a humanoid box with claws attached.
      for(const sign of [-1,1]){ctx.save();ctx.scale(sign,1);for(let n=0;n<3;n++){limb(21,19,37+n*8,27+n*3,7,p[2]);limb(37+n*8,27+n*3,40+n*11+move,48,6,p[1]);joint(37+n*8,27+n*3,4,p[1]);}
      limb(24,-9,47,-5+move,11,p[2]);joint(46,-5+move,7,p[1]);ctx.translate(48,-8+move);ctx.rotate(attack?-.3:.1+pulse*.06);path('M -4 -6 Q 9 -25 28 -21 Q 38 -8 30 7 L 19 -4 L 13 6 Q 30 12 29 26 Q 6 29 -6 10 Z',metal('#ceae83'),outline,2);line(8,-12,23,-15,'#ffe2ae',2);ctx.restore();}
      if(b.phase==='attack'&&b.y<336){for(const xx of [-22,22]){ellipse(xx,28,6,8,'#d5e9e3');path('M '+(xx-5)+' 35 Q '+xx+' 58 '+(xx+5)+' 35 Z','#a5f5e077',null);}}ellipse(0,0,37,32,metal('#b39575'),outline,2);path('M -32 -9 Q -20 -35 8 -31 Q 30 -25 34 -7 Q 9 -14 -32 -9 Z',metal('#d1b58e'),outline,1.5);for(let n=-2;n<=2;n++)line(n*11,-25,n*13,-10,'#76614e',1);ellipse(0,10,25,16,'#375268',outline,2);glow(0,10,9,c);for(const x of [-13,13]){limb(x,-17,x,-33,3,p[2]);glow(x,-34,3.5,'#ffeba2');}
    } else if(v.stage===1){
      // Feathered turbine wings fan and fold during the dive.
      for(const sign of [-1,1]){ctx.save();ctx.scale(sign,1);ctx.rotate(attack?.25:pulse*.05);path('M 16 -14 Q 37 -43 78 -37 Q 66 -19 40 -7 L 72 -17 Q 56 3 32 9 L 58 5 Q 44 22 21 24 Z',metal('#9cb7cb'),outline,2);for(let k=0;k<4;k++)line(28,-12+k*7,60-k*8,-30+k*12,'#e3f4ec88',1.5);joint(22,-8,8,p[2]);ctx.restore();}
      path('M -16 -17 Q 0 -30 17 -14 L 25 16 L 13 38 L -15 36 L -23 13 Z',metal('#7c9daf'),outline,2);ellipse(0,6,14,23,'#294960',outline,1.5);glow(0,4,8,c);path('M -15 -19 Q -22 -34 -11 -45 L 10 -43 L 21 -30 L 8 -19 Z',metal('#c0d5df'),outline,2);path('M -10 -31 L 13 -32 L 11 -26 L -10 -24 Z','#173347');glow(4,-29,2,'#fff1a0');path('M 15 -32 L 32 -23 L 13 -20 Z','#e4c77d',outline);for(const x of [-12,12]){limb(x,32,x*1.4,46,6,p[1]);for(let k=0;k<3;k++)line(x*1.4,45,x*1.4+(-1+k)*6,51,'#ddd6a4',2);}
    } else if(v.stage===2){
      // Narrow insect torso, leaf plates and jointed sickle arms.
      for(const sign of [-1,1]){ctx.save();ctx.scale(sign,1);limb(14,-6,37,-18+move,8,'#679879');joint(37,-18+move,5,'#d2dcac');path(`M 37 ${-20+move} Q 72 -7 48 34 Q 53 9 29 -3 Z`,metal('#b5d88e'),outline,1.5);line(43,-10,49,7,'#f0ffd0',1);limb(10,24,25,37,7,'#447b65');limb(25,37,20+move,49,5,'#a7cc90');ctx.restore();}
      path('M -15 -18 Q 0 -26 15 -17 L 19 6 L 8 35 L -9 35 L -19 7 Z',metal('#83b584'),outline,2);path('M -15 -12 Q 0 -7 14 -14 L 7 6 L 0 13 L -9 5 Z','#d0dfae',outline);glow(0,17,6,c);path('M -18 -31 Q -14 -49 2 -44 Q 14 -49 20 -29 L 10 -19 L -10 -20 Z',metal('#b5d49b'),outline,2);path('M -12 -31 L 0 -27 L 12 -32 L 8 -25 L -9 -24 Z','#173c3c');line(-7,-29,-1,-28,'#fff1b0',2);line(5,-29,11,-30,'#fff1b0',2);line(-9,-40,-20,-56,'#92b588',2);line(10,-40,22,-57,'#92b588',2);
    } else if(v.stage===3){
      // A heavy arctic guardian with curved pauldrons and crystalline knuckles.
      for(const sign of [-1,1]){ctx.save();ctx.scale(sign,1);limb(18,-9,34,5,18,'#7da5be');ellipse(29,-11,18,16,metal('#bcd7e2'),outline,2);limb(34,5,39,25+move*.5,17,'#7da5be');ellipse(39,27,15,15,metal('#c9e4ed'),outline,2);for(let k=0;k<3;k++)path(`M ${31+k*7} 20 L ${33+k*7} 9 L ${37+k*7} 22 Z`,'#e0f9ff',outline,.8);limb(13,28,19,45,16,'#7aa1ba');rounded(9,42,28,10,5,metal('#c4dfe8'),outline,1.5);ctx.restore();}
      path('M -27 -16 Q 0 -34 27 -16 L 29 11 L 17 33 L -18 33 L -29 10 Z',metal('#8cbbce'),outline,2);ellipse(0,5,17,18,'#294b6c',outline,2);glow(0,5,10,c);path('M -16 -31 Q 0 -48 17 -31 L 14 -17 L -13 -17 Z',metal('#c5e5ee'),outline,2);path('M -11 -29 Q 0 -35 12 -29 L 10 -24 L -10 -24 Z','#183b5c');line(-7,-28,8,-28,'#fff3ae',2);for(let n=-1;n<=1;n++)path(`M ${n*11-5} -39 L ${n*11} ${-60+Math.abs(n)*9} L ${n*11+6} -38 Z`,'#c2ecf9',outline,1);
    } else {
      // A floating sovereign: layered cloak, curved armor and suspended hands.
      const float=pulse*2;ctx.translate(0,float);for(const sign of [-1,1]){ctx.save();ctx.scale(sign,1);path('M 17 -25 Q 44 -28 45 -5 Q 42 22 57 43 Q 25 50 13 28 Z',metal('#71516d'),outline,2);path('M 30 -17 Q 33 10 47 36 L 37 31 Q 25 8 24 -16 Z','#c5918244',null);joint(31,-13,11,'#b5a0aa');ellipse(45,10,10,12,metal('#a69ba8'),outline,2);glow(45,10,4,c);ctx.restore();}
      path('M -20 -25 Q 0 -38 20 -25 L 18 5 L 10 30 L -9 30 L -18 6 Z',metal('#b398a7'),outline,2);path('M -13 -14 Q 0 -22 13 -14 L 9 13 L 0 23 L -10 13 Z','#33283f',outline);glow(0,-1,9,c);path('M -11 25 Q 0 32 11 25 L 16 48 L 0 41 L -17 49 Z','#66425c',outline,1.5);ellipse(0,-35,15,14,metal('#d1bab9'),outline,2);path('M -12 -36 Q 0 -44 12 -35 L 8 -28 L -9 -29 Z','#281f39');line(-7,-34,9,-34,'#ffdca6',2);path('M -14 -42 L -18 -59 L -6 -51 L 0 -64 L 7 -51 L 19 -60 L 14 -42 Z',metal('#e6c199'),outline,1.5);ctx.strokeStyle='#efc8a988';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,-44,33,12,-.15,0,Math.PI*2);ctx.stroke();
    }
    if(b.phase==='tell'){ctx.strokeStyle=c+'aa';ctx.lineWidth=1.4;ctx.beginPath();ctx.ellipse(0,2,59+Math.sin(v.t*15)*2,54,0,0,Math.PI*2);ctx.stroke();}
    ctx.restore();
  }
  function projectile(b,v){const x=b.x-v.camera,y=b.y,c=b.color,drawW=b.drawW||b.w,drawH=b.drawH||b.h;ctx.save();ctx.translate(x+b.w/2,y+b.h/2);
    if(b.owner==='player'&&b.weapon===1){ctx.rotate(v.t*17);ctx.strokeStyle=c;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,12,8,0,.3,Math.PI*1.8);ctx.stroke();path('M 9 -5 L 17 -2 L 10 3 Z','#e4ffff',null);}
    else if(b.owner==='player'&&b.weapon===4){ctx.rotate(Math.atan2(b.vy,b.vx));path('M -10 -3 L 3 -9 L 13 0 L 1 7 L -9 3 Z',metal(c),c,.7);line(-4,-2,7,0,'#fff',1);}
    else{const angle=Math.atan2(b.vy,b.vx);ctx.rotate(angle);const r=drawH*.5;path(`M 0 ${-r*.7} Q -18 0 -30 0 Q -16 ${r*.45} 0 ${r*.7} Z`,c+'44',null);ellipse(0,0,drawW*.6,drawH*.65,c+'22');ellipse(0,0,drawW*.48,drawH*.48,c);ellipse(1,-1,drawW*.3,drawH*.28,'#fff6d8');}ctx.restore();
  }
  function pickup(a,v){ctx.save();ctx.translate(a.x-v.camera+9,a.y+9);ellipse(0,0,15,15,'#95ffd518');rounded(-10,-10,20,20,6,metal('#b7ddd6'),outline,1.5);rounded(-7,-7,14,14,4,'#215268');line(-4,0,4,0,'#a5ffdd',3);line(0,-4,0,4,'#a5ffdd',3);ctx.restore();}
  function particle(a,camera){ctx.globalAlpha=Math.min(1,a.life*3);ellipse(a.x-camera,a.y,a.size*.55,a.size*.35,a.color);line(a.x-camera,a.y,a.x-camera-a.vx*.018,a.y-a.vy*.018,a.color,a.size*.35);ctx.globalAlpha=1;}
  function checkpoint(x,ground,on){const c=on?'#94ffce':'#ffdda3';limb(x+5,ground,x+5,ground-39,5,'#718d9b');rounded(x-10,ground-66,30,30,11,metal('#91bdc4'),outline,2);ellipse(x+5,ground-51,10,10,'#1a465a');line(x+1,ground-51,x+9,ground-51,c,2.5);line(x+5,ground-55,x+5,ground-47,c,2.5);glow(x+5,ground-34,2,c);label('CHECKPOINT',x+5,ground-77,'#e8f8ef');}
  function gate(x,ground,on,c){rounded(x-4,120,24,ground-120,11,'#284b5d',outline,2);rounded(x+2,125,12,ground-129,6,on?'#df9d7b66':c+'55');for(let y=130;y<ground;y+=42)ellipse(x+8,y,3,2,'#d9ecdf');label('GUARDIAN',x+8,112,'#fff0c7');}
  function hazards(h,v){const x=h.x-v.camera;if(x>980||x+h.w<0)return;if(h.pit){rounded(x,515,h.w,25,8,'#bd5c6077');for(let xx=x+10;xx<x+h.w;xx+=25){ellipse(xx,524,7,10,'#ffba7955');}}else for(let xx=x;xx<x+h.w;xx+=16){path(`M ${xx} ${h.y+14} Q ${xx+4} ${h.y+4} ${xx+8} ${h.y} L ${xx+16} ${h.y+14} Z`,v.stage===3?'#d5f5fc':'#d4ae85','#263746',.8);line(xx+8,h.y+3,xx+11,h.y+12,'#fff6d099',1);}}
  return {backdrop,platform,hero,enemy,boss,projectile,pickup,particle,checkpoint,gate,hazards};
};

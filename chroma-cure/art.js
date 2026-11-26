(function(){
  'use strict';
  const palette=['#d65d4e','#c49326','#315e91'],symbols=['●','◆','✚'],C=42;
  const sprites=[];
  for(let bug=0;bug<2;bug++)for(let c=0;c<3;c++){
    const a=document.createElement('canvas');a.width=a.height=C*2;const g=a.getContext('2d');g.scale(2,2);g.translate(21,21);
    g.fillStyle='#203e701b';g.beginPath();g.ellipse(1,15,16,5,0,0,Math.PI*2);g.fill();
    if(bug){g.beginPath();if(c===2){g.moveTo(-7,-18);g.lineTo(7,-18);g.lineTo(7,-7);g.lineTo(18,-7);g.lineTo(18,7);g.lineTo(7,7);g.lineTo(7,18);g.lineTo(-7,18);g.lineTo(-7,7);g.lineTo(-18,7);g.lineTo(-18,-7);g.lineTo(-7,-7);}else for(let i=0;i<16;i++){const t=i*Math.PI/8,r=c===1?(i%4===0?20:i%2?14:12):(i%2?15:19),x=Math.cos(t)*r,y=Math.sin(t)*r;i?g.lineTo(x,y):g.moveTo(x,y);}g.closePath();}
    else{g.beginPath();g.roundRect(-18,-18,36,36,10);}
    g.fillStyle=palette[c];g.fill();g.strokeStyle='#203e70';g.lineWidth=1.4;g.stroke();g.fillStyle='#ffffff25';g.beginPath();g.ellipse(-5,-9,10,4,-.2,0,Math.PI*2);g.fill();
    g.fillStyle='#fff8e5';g.font='bold 19px system-ui';g.textAlign='center';g.textBaseline='middle';if(!bug)g.fillText(symbols[c],0,1);else{g.beginPath();g.ellipse(-5,-2,3,4,0,0,7);g.ellipse(5,-2,3,4,0,0,7);g.fill();g.fillStyle='#203e70';g.fillRect(-5,-2,2,3);g.fillRect(5,-2,2,3);g.strokeStyle='#fff8e5';g.lineWidth=1.5;g.beginPath();g.arc(0,5,4,0,Math.PI);g.stroke();g.font='bold 8px system-ui';g.fillStyle='#fff8e5';g.fillText(symbols[c],0,14);}
    sprites[bug*3+c]=a;
  }
  const back=document.createElement('canvas');back.width=336;back.height=588;const bg=back.getContext('2d');bg.fillStyle='#f9f3df';bg.fillRect(0,0,336,588);for(let y=0;y<14;y++)for(let x=0;x<8;x++){bg.fillStyle=(x+y)%2?'#e9ebdd':'#f3eedb';bg.fillRect(x*C+1,y*C+1,C-2,C-2);bg.fillStyle='#203e7017';bg.beginPath();bg.arc(x*C+21,y*C+21,1.2,0,7);bg.fill();}
  function draw(g,s,reduced){g.clearRect(0,0,336,588);g.drawImage(back,0,0);if(s.piece){for(const p of CureEngine.ghost(s)){g.fillStyle=palette[p.c]+'20';g.fillRect(p.x*C+4,p.y*C+4,34,34);g.strokeStyle=palette[p.c];g.lineWidth=2;g.setLineDash([3,3]);g.strokeRect(p.x*C+5,p.y*C+5,32,32);g.setLineDash([]);g.font='bold 15px system-ui';g.textAlign='center';g.fillStyle=palette[p.c];g.fillText(symbols[p.c],p.x*C+21,p.y*C+26);}}
    for(let y=0;y<14;y++)for(let x=0;x<8;x++){const p=s.board[y][x];if(!p)continue;const flashing=s.flash.includes(y*8+x);g.globalAlpha=flashing&&!reduced?.50+.45*Math.cos(s.timer*25):1;g.drawImage(sprites[(p.bug?3:0)+p.c],x*C,y*C,C,C);g.globalAlpha=1;if(!p.bug&&x<7&&s.board[y][x+1]?.id===p.id&&!s.board[y][x+1]?.bug){g.fillStyle='#fff5da';g.fillRect(x*C+37,y*C+17,10,8);}if(!p.bug&&y<13&&s.board[y+1][x]?.id===p.id&&!s.board[y+1][x]?.bug){g.fillStyle='#fff5da';g.fillRect(x*C+17,y*C+37,8,10);}}
    if(s.piece){const cs=CureEngine.cells(s.piece);for(const p of cs)g.drawImage(sprites[p.c],p.x*C,p.y*C,C,C);const a=cs[0],b=cs[1];g.strokeStyle='#fff5da';g.lineWidth=5;g.beginPath();g.moveTo(a.x*C+21+(b.x-a.x)*14,a.y*C+21+(b.y-a.y)*14);g.lineTo(b.x*C+21-(b.x-a.x)*14,b.y*C+21-(b.y-a.y)*14);g.stroke();}
    // Strong outlines show the exact clearing group, including with reduced motion.
    if(s.phase==='clear'){g.strokeStyle='#fffdf0';g.lineWidth=3;for(const i of s.flash){g.beginPath();g.roundRect((i%8)*C+3,Math.floor(i/8)*C+3,36,36,8);g.stroke();}if(s.chain>1){g.fillStyle='#203e70';g.fillRect(62,78,212,42);g.fillStyle='#fff6df';g.font='bold 22px Georgia';g.textAlign='center';g.fillText(s.chain+'× CHAIN REACTION',168,106);}}
    if(s.level===1&&s.doses===0){g.fillStyle='#203e70';g.textAlign='center';g.font='italic 19px Georgia';g.fillText('Four makes a cure.',168,220);g.font='11px system-ui';g.fillText('same symbols · straight line',168,243);}
    // A marked neck makes the overflow rule legible without relying on color.
    g.strokeStyle='#203e7050';g.lineWidth=2;g.setLineDash([5,5]);g.beginPath();g.moveTo(126,2);g.lineTo(210,2);g.stroke();g.setLineDash([]);
  }
  window.CureArt={draw,palette,symbols};
})();

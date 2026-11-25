// Agent Yoda — MM-20261124T0112Z-YODA. Reproducible Canvas/CSS presentation only.
const fs=require('fs'),path=require('path');let h=fs.readFileSync(path.join(__dirname,'baseline.html'),'utf8').replace(/\r\n/g,'\n');
const begin=h.indexOf('    function drawBackground'),end=h.indexOf('    function drawBullets');
const original=h.slice(begin,end);
let specials=original.slice(original.indexOf('    function drawSpecials'),original.indexOf('    function drawPlayer'));
specials=specials.replace('ctx.shadowBlur=0;ctx.restore()',`ctx.shadowBlur=0;
      // Carved carapace plates stay inside the original hazard silhouettes.
      ctx.strokeStyle='#173047';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(-6,-6);ctx.lineTo(-2,6);ctx.moveTo(1,-7);ctx.lineTo(5,6);ctx.stroke();
      ctx.fillStyle='#142139';ctx.beginPath();ctx.arc(3,-3,1.5,0,Math.PI*2);ctx.arc(6,-3,1.5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff7d8';ctx.fillRect(3,-4,1,1);ctx.restore()`);
let player=original.slice(original.indexOf('    function drawPlayer'));
player=player.replace('ctx.shadowBlur=0;ctx.restore()',`ctx.shadowBlur=0;
      ctx.fillStyle='#153a5b';ctx.beginPath();ctx.moveTo(0,-11);ctx.lineTo(5,3);ctx.lineTo(0,8);ctx.lineTo(-5,3);ctx.closePath();ctx.fill();ctx.strokeStyle='#c2ffff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-12,11);ctx.lineTo(-5,6);ctx.moveTo(12,11);ctx.lineTo(5,6);ctx.moveTo(0,-17);ctx.lineTo(0,-12);ctx.stroke();ctx.fillStyle='#ffe7cc';ctx.fillRect(-1,-23,2,8);ctx.restore()`);
const art=`    // Presentation cache: painted lunar botany; never reads or advances random state.
    var gardenBackdrop=null,mushroomArt={},wormArt={};
    function drawBackground(){
      if(!gardenBackdrop){gardenBackdrop=document.createElement('canvas');gardenBackdrop.width=W;gardenBackdrop.height=H;var g=gardenBackdrop.getContext('2d');
        var sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#2c2047');sky.addColorStop(.58,'#13152e');sky.addColorStop(1,'#090d21');g.fillStyle=sky;g.fillRect(0,0,W,H);
        g.fillStyle='#d7f8ff';g.shadowColor='#79efff';g.shadowBlur=26;g.beginPath();g.arc(RIGHT-155,150,60,0,Math.PI*2);g.fill();g.shadowBlur=0;
        g.save();g.beginPath();g.arc(RIGHT-155,150,59,0,Math.PI*2);g.clip();var moon=g.createLinearGradient(RIGHT-215,100,RIGHT-95,190);moon.addColorStop(0,'#e4f7eb');moon.addColorStop(.7,'#b3d1d1');moon.addColorStop(1,'#719cae');g.fillStyle=moon;g.fillRect(RIGHT-215,90,120,120);
        for(var cr=0;cr<18;cr++){var mx=RIGHT-208+(cr*37%109),my=97+(cr*23%107),mr=3+(cr*7%13);g.beginPath();g.arc(mx,my,mr,0,Math.PI*2);g.fillStyle='#587f9540';g.fill();g.beginPath();g.arc(mx+1,my+2,mr*.7,0,Math.PI*2);g.strokeStyle='#f1fff15c';g.lineWidth=1;g.stroke()}g.restore();
        for(var st=0;st<110;st++){g.globalAlpha=.2+(st%5)*.1;g.fillStyle='#d7e9f0';g.fillRect((st*181)%W,80+(st*83)%Math.max(410,H-150),1+(st%3),1+(st%3))}g.globalAlpha=1;
        // Quiet stippled soil and low horizon; moving actors remain the brightest marks.
        g.fillStyle='#86969608';for(var d=0;d<1600;d++)g.fillRect((d*193)%W,TOP+(d*71)%Math.round(H-TOP),d%3+1,1);
        g.fillStyle='#647b8020';g.beginPath();g.moveTo(LEFT,PLAYER_TOP+42);for(var k=0;k<=24;k++)g.lineTo(LEFT+(RIGHT-LEFT)*k/24,PLAYER_TOP+38+Math.sin(k*1.8)*12);g.lineTo(RIGHT,BOTTOM);g.lineTo(LEFT,BOTTOM);g.closePath();g.fill();
        g.strokeStyle='#a4d7c50e';g.lineWidth=1;for(var x=LEFT;x<=RIGHT;x+=GRID_X){g.beginPath();g.moveTo(x,TOP);g.lineTo(x,BOTTOM);g.stroke()}for(var y=TOP;y<=BOTTOM;y+=GRID_Y){g.beginPath();g.moveTo(LEFT,y);g.lineTo(RIGHT,y);g.stroke()}
        g.fillStyle='#34233c36';g.fillRect(LEFT,PLAYER_TOP,RIGHT-LEFT,BOTTOM-PLAYER_TOP);g.strokeStyle='#d782ac60';g.strokeRect(LEFT,PLAYER_TOP,RIGHT-LEFT,BOTTOM-PLAYER_TOP);
        // Botanical filigree stays in the original empty side margin.
        for(var side=0;side<2;side++){var bx=side?W-22:22;g.strokeStyle='#9ca99540';g.lineWidth=1;g.beginPath();g.moveTo(bx,BOTTOM);g.quadraticCurveTo(bx-9,BOTTOM-75,bx,BOTTOM-145);g.stroke();for(var leaf=0;leaf<6;leaf++){g.beginPath();g.ellipse(bx+(leaf%2?5:-5),BOTTOM-18-leaf*20,6,2,leaf%2?-.6:.6,0,Math.PI*2);g.fillStyle='#9da69738';g.fill()}}
      }ctx.drawImage(gardenBackdrop,0,0);
    }
    function mushroomSprite(color){if(mushroomArt[color])return mushroomArt[color];var c=document.createElement('canvas');c.width=c.height=48;var g=c.getContext('2d');g.translate(24,24);g.fillStyle='#d9e7ff';g.fillRect(-3,2,6,11);g.fillStyle='#6c8098';g.fillRect(1,4,2,9);g.fillStyle=color;g.shadowColor=color;g.shadowBlur=5;g.beginPath();g.arc(0,0,11,Math.PI,0);g.lineTo(11,3);g.lineTo(-11,3);g.closePath();g.fill();g.shadowBlur=0;
      g.fillStyle='#17223680';g.beginPath();g.ellipse(0,2,10,1.5,0,0,Math.PI*2);g.fill();g.strokeStyle='#efffdca0';g.lineWidth=1;g.beginPath();g.arc(0,0,8.5,Math.PI*1.13,Math.PI*1.7);g.stroke();g.fillStyle='#1c1732';for(var dot=-5;dot<=5;dot+=5){g.beginPath();g.arc(dot,-2,1.5,0,Math.PI*2);g.fill()}g.fillStyle='#fff5d8';g.fillRect(-5,-6,2,1);g.fillRect(3,-7,2,1);g.strokeStyle='#ddf7df9a';g.beginPath();g.moveTo(-7,2);g.lineTo(-3,3);g.moveTo(7,2);g.lineTo(3,3);g.stroke();return mushroomArt[color]=c;
    }
    function drawMushrooms(){for(var i=0;i<mushrooms.length;i++){var m=mushrooms[i],color=m.poison?'#ff57b8':m.hp/4>.5?'#a9ff67':'#ffb65b';ctx.drawImage(mushroomSprite(color),m.x-24,m.y-24)}}
    function wormSprite(head,armor){var key=head+'-'+armor;if(wormArt[key])return wormArt[key];var c=document.createElement('canvas');c.width=c.height=64;var g=c.getContext('2d');g.translate(32,32);var r=head?12:10,color=head?'#ffe16a':armor?'#ff8f5c':'#aaff69';g.fillStyle=color;g.shadowColor=color;g.shadowBlur=7;g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.fill();g.shadowBlur=0;
      g.strokeStyle='#283e4580';g.lineWidth=1;for(var band=0;band<3;band++){g.beginPath();g.arc(0,3+band*2,r-2,Math.PI*.12,Math.PI*.88);g.stroke()}g.strokeStyle='#fff7c799';g.beginPath();g.arc(-1,-1,r-3,Math.PI*1.05,Math.PI*1.65);g.stroke();g.fillStyle='#16152a';g.beginPath();g.arc(-4,-2,2.2,0,Math.PI*2);g.arc(4,-2,2.2,0,Math.PI*2);g.fill();g.fillStyle='#fff9dc';g.fillRect(-5,-3,1,1);g.fillRect(3,-3,1,1);if(head){g.strokeStyle='#fff0b2';g.lineWidth=2;g.beginPath();g.moveTo(-7,-7);g.lineTo(-13,-14);g.moveTo(7,-7);g.lineTo(13,-14);g.stroke()}if(armor){g.strokeStyle='#fff';g.lineWidth=1.5;g.beginPath();g.arc(0,0,14,0,Math.PI*2);g.stroke()}return wormArt[key]=c;
    }
    function drawSegments(){for(var i=0;i<segments.length;i++){var s=segments[i],pulse=1+Math.sin(performance.now()*.009+s.phase)*.06;ctx.save();ctx.translate(s.x,s.y);ctx.scale(pulse,pulse);ctx.drawImage(wormSprite(s.head,s.hp>1),-32,-32);ctx.restore()}}
`;
h=h.slice(0,begin)+art+specials+player+h.slice(end);
const css=`
    /* Agent Yoda: lunar botany instruments; presentation and placement only. */
    body{min-height:100dvh;background:radial-gradient(ellipse at 50% 40%,#30233f,#0b1020 70%)}
    .hud{left:80px;right:80px}.card{border-radius:7px;background:#10172aed;border-color:#7a94845c;backdrop-filter:none;box-shadow:inset 0 2px 0 #d4e9c60d}.card span{font-size:10px;color:#a6d6d8}.card strong{color:#fff5da}.card.wave{border-color:#a5be785c}.card.wave span{color:#c4e69a}
    .modal-card{background:linear-gradient(145deg,#2b2742,#111a2b);border-color:#9ea98d70}.modal h2{color:#d0e9ac}.modal button{background:linear-gradient(90deg,#9bd4d5,#c4d6ac);border-radius:9px}.controls-grid strong{color:#b7e2df}
    .meter-copy{font-size:10px;color:#f1b6d4}.meter{height:10px;border-radius:3px}#pulse-fill{background:linear-gradient(90deg,#75cfd3,#d192bd,#e8d58f);box-shadow:none}
    @media(max-width:760px),(pointer:coarse){.hud{inset:2px 4px auto;gap:3px}.card{padding:2px 4px;border-radius:4px}.card span{font-size:8px;letter-spacing:.06em}.card strong{font-size:12px;margin-top:0}.meter-copy{font-size:8px;letter-spacing:.08em}.meter{height:7px}body.touch-device #game-shell{overflow:visible!important}#pulse-wrap{bottom:-24px;width:52%}#message{font-size:clamp(24px,5vw,50px)}#sub-message{font-size:10px;letter-spacing:.06em}}
`;
h=h.replace('  </style>',css+'  </style>');fs.writeFileSync(path.join(__dirname,'../index.html'),h);

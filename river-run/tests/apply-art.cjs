// Agent Yoda — RR-20261124T1316Z-YODA. Reproducible Canvas/CSS presentation edits.
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'../..');
let s=fs.readFileSync(path.join(__dirname,'baseline.html'),'utf8').replace(/\r\n/g,'\n');
function add(anchor,value){if(!s.includes(anchor))throw Error('Missing art anchor '+anchor.slice(0,80));s=s.replace(anchor,value+anchor)}
add('  </style>',`
    /* Agent Yoda: rain-polished metropolitan riverfront; original input targets retained. */
    html,body{height:100%;min-height:100dvh}body{height:100dvh;display:flex;align-items:center;justify-content:center}
    #game-shell{overflow:visible;border-radius:14px;border-color:#679ca2;box-shadow:0 20px 70px #0009,0 0 0 4px #112b3b}
    canvas{border-radius:inherit}.hud{top:auto;bottom:calc(100% + 10px);inset-inline:72px;gap:8px}
    .card{border-radius:6px;background:linear-gradient(160deg,#173441f5,#0b1a2af5);border-color:#5c919d88;box-shadow:inset 0 1px #b9dfdf33,0 3px 12px #0004;backdrop-filter:none}
    .card:before{width:2px;box-shadow:none;background:#80c9c5}.card span{font-size:10px;color:#b3dfdf;text-shadow:none;letter-spacing:.13em}
    .card strong{font-variant-numeric:tabular-nums}.card.timer{background:linear-gradient(160deg,#34382b,#141f26);border-color:#b4a66b}.card.timer:before{box-shadow:none;background:#e8cd86}
    .modal{overflow:auto}.modal-card{max-height:calc(100dvh - 28px);overflow-y:auto}
    @media(max-width:760px),(pointer:coarse){
      #game-shell{width:min(calc(100vw - 196px),calc((100dvh - 100px)*1.77777778));max-height:none;margin:0 12px 0 184px;border-radius:6px}
      .hud{inset-inline:0;bottom:calc(100% + 8px);grid-template-columns:repeat(4,1fr);gap:4px}
      .card{padding:4px 6px;min-width:0}.card span{font-size:8px;letter-spacing:.03em}.card strong{font-size:12px;margin-top:1px}
      .touch-controls{inset:0 auto 0 8px;width:170px;align-items:center}
      .vibecade-mobile-restart{right:auto!important;left:70px!important}
      .modal{padding:14px}.modal-card{padding:18px}.modal h2{font-size:26px}.modal p{font-size:12px;line-height:1.4}.controls-grid{font-size:12px;gap:6px 12px;margin:12px 0}
    }
    @media(orientation:portrait) and (max-width:760px){
      #game-shell{width:calc(100vw - 16px);margin:0 8px 180px}
      .touch-controls{inset:auto auto 20px 50%;transform:translateX(-50%);height:170px}
      .vibecade-mobile-restart{left:auto!important;right:8px!important}
    }
`);
add("      var horizon=ctx.createLinearGradient",`
      // Rain-dark masonry and roof coping, baked into the existing district cache.
      ctx.fillStyle='#b6d5d51c';for(var roof=0;roof<24;roof++){var rx=roof*57-8,rw=42+(roof%3)*7,rh=27+((roof*31)%54),ry=TOP-rh;ctx.fillRect(rx,ry,rw,2);ctx.fillRect(rx+rw-3,ry+3,2,rh-3);ctx.fillStyle=pal.haze+'12';ctx.fillRect(rx+4,ry+6,2,rh-8);ctx.fillStyle='#b6d5d51c'}
      ctx.fillStyle='#142d3b';ctx.fillRect(0,TOP-5,W,5);ctx.fillStyle=pal.foam+'55';ctx.fillRect(0,TOP-5,W,1);
`);
add('      drawCurb(waterTop,pal.foam);',`
      // Quiet reflected windows stay below the original moving current lines.
      for(var reflection=0;reflection<52;reflection++){var fx=(reflection*137+23)%W,fy=waterTop+8+(reflection*43)%(LANE_H*5-15);ctx.fillStyle=reflection%3?pal.foam+'0b':pal.haze+'13';ctx.fillRect(fx,fy,12+(reflection%5)*9,1);ctx.fillRect(fx+7,fy+4,5+(reflection%3)*8,1)}
      // Rain-polished asphalt with restrained broken reflections, never hazard outlines.
      for(var wet=0;wet<55;wet++){var wetX=(wet*173+21)%W,wetY=roadTop+7+(wet*31)%(LANE_H*5-14);ctx.fillStyle=wet%4?'#a7cad809':'#f4c7970d';ctx.fillRect(wetX,wetY,18+(wet%4)*17,1)}
`);
add("      ctx.strokeStyle=pal.accent;ctx.lineWidth=2.5;",`
      // Setts and drainage details on the safe banks, within their unchanged bounds.
      for(var bankY of [TOP,waterBottom,roadBottom]){ctx.strokeStyle='#b5ddd918';ctx.lineWidth=1;for(var stone=0;stone<W;stone+=44){ctx.strokeRect(stone+2,bankY+5,40,16);ctx.strokeRect(stone-20,bankY+24,40,16)}ctx.fillStyle='#061b20';for(var drain=40;drain<W;drain+=210){ctx.fillRect(drain,bankY+LANE_H-9,26,5);ctx.fillStyle='#8fbdbb44';for(var slit=0;slit<5;slit++)ctx.fillRect(drain+3+slit*5,bankY+LANE_H-8,1,3);ctx.fillStyle='#061b20'}}
`);
add("      ctx.fillStyle='rgba(92,218,133,.72)';",`
      // Split bark and quiet growth lines; original log/support extents unchanged.
      ctx.strokeStyle='#3f22294d';ctx.lineWidth=1;for(var grain=30;grain<w-27;grain+=25){ctx.beginPath();ctx.moveTo(grain,-8);ctx.bezierCurveTo(grain+12,-12,grain+9,0,grain+19,4);ctx.stroke();ctx.beginPath();ctx.moveTo(grain-2,10);ctx.lineTo(grain+13,8);ctx.stroke()}ctx.fillStyle='#ffe0a050';for(var fleck=31;fleck<w-25;fleck+=38)ctx.fillRect(fleck,-12,9,1);
`);
add("      ctx.fillStyle='#fff4a4';ctx.shadowColor=",`
      // Enamel panel seams, glass reflection and small hardware inside original shells.
      ctx.strokeStyle='#192b4659';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(12,-h/2+4);ctx.lineTo(w-10,-h/2+4);ctx.moveTo(12,h/2-4);ctx.lineTo(w-10,h/2-4);ctx.stroke();
      ctx.fillStyle='#f1ffff70';ctx.fillRect(w-36,-7,2,9);ctx.fillStyle='#1a263f77';ctx.fillRect(w-17,-3,4,6);
      if(lane.type==='truck'){ctx.fillStyle='#23334444';ctx.fillRect(15,-8,34,16);ctx.fillStyle='#fff1bc88';ctx.fillRect(20,-4,22,2);ctx.fillRect(20,1,14,2);ctx.fillStyle='#f7e3bd99';for(var rivet=14;rivet<w-57;rivet+=28){ctx.fillRect(rivet,-h/2+3,2,2);ctx.fillRect(rivet,h/2-5,2,2)}}
      else{ctx.strokeStyle='#22374d66';ctx.beginPath();ctx.moveTo(w*.39,-10);ctx.lineTo(w*.39,10);ctx.moveTo(w*.78,-10);ctx.lineTo(w*.78,10);ctx.stroke();ctx.fillStyle='#e9f9ffbb';ctx.fillRect(w*.55,-6,2,8);ctx.fillRect(w*.35,10,6,1)}
`);
add("      ctx.strokeStyle='#0b674e';ctx.lineWidth=2;",`
      // Subtle amphibian markings remain inside the original body silhouette.
      ctx.fillStyle='#146d5c60';for(var spot=0;spot<6;spot++){var spotX=spot%2?-12:12,spotY=-8+Math.floor(spot/2)*6;ctx.beginPath();ctx.ellipse(spotX,spotY,2.2,1.4,0,0,Math.PI*2);ctx.fill()}ctx.strokeStyle='#d9ffc466';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-5,7);ctx.quadraticCurveTo(0,13,5,7);ctx.stroke();
`);
// Train and cyclist retain their already detailed original art.
fs.writeFileSync(path.join(root,'river-run/index.html'),s);
console.log('Applied presentation-only art and CSS from preserved baseline.');

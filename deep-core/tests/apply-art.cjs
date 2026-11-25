// Agent Yoda — reproducible DC-20261123T0710Z-YODA presentation patch.
const fs=require('fs'),path=require('path');
const file=path.resolve(__dirname,'../index.html');
let html=fs.readFileSync(path.join(__dirname,'baseline.html'),'utf8');
const start=html.indexOf('    function dirtColor('),end=html.indexOf('    function drawAmbient(',start);
let art=html.slice(start,end);
const terrain=`    // Cached mineral cross-section. Deterministic marks never consume simulation randomness.
    var geologyCanvas=null;
    function makeGeology(){
      var old=ctx;geologyCanvas=document.createElement('canvas');geologyCanvas.width=W;geologyCanvas.height=H;ctx=geologyCanvas.getContext('2d');
      ctx.fillStyle='#10131b';ctx.fillRect(0,0,W,H);
      for(var r=0;r<ROWS;r++)for(var c=0;c<COLS;c++){
        var x=OX+c*CELL,y=OY+r*CELL,h=cellHash(c,r,31);
        ctx.fillStyle=dirtColor(r,c);ctx.fillRect(x,y,CELL,CELL);
        // Broken bedding planes, fine grit and bright mineral inclusions.
        for(var line=0;line<5;line++){
          var yy=y+line*10+((h>>>(line*3))%5);
          ctx.strokeStyle=line%2?'rgba(29,20,35,.23)':'rgba(244,211,177,.15)';ctx.lineWidth=line===3?2:1;
          ctx.beginPath();ctx.moveTo(x,yy);ctx.lineTo(x+16,yy+2);ctx.lineTo(x+32,yy-1);ctx.lineTo(x+48,yy+1);ctx.stroke();
        }
        for(var n=0;n<10;n++){
          var sx=x+3+((h>>>(n*3%27))%42),sy=y+3+((h>>>(n*5%25))%42);
          ctx.fillStyle=n%3?'rgba(20,16,28,.17)':'rgba(250,222,187,.28)';ctx.fillRect(sx,sy,n%3+1,1);
        }
        if(h%4===0){ctx.strokeStyle=r<4?'#d8ac7e88':r<8?'#cca3b877':'#b6addd77';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(x+8,y+36);ctx.lineTo(x+18,y+28);ctx.lineTo(x+24,y+29);ctx.lineTo(x+37,y+13);ctx.stroke();}
        if(h%7===0){ctx.fillStyle='#e2d0b655';ctx.beginPath();ctx.moveTo(x+31,y+18);ctx.lineTo(x+35,y+14);ctx.lineTo(x+38,y+19);ctx.lineTo(x+34,y+21);ctx.fill();}
      }
      // Narrow steel mounting rails occupy only the original outside margin.
      ctx.fillStyle='#2b3841';ctx.fillRect(OX-7,OY-6,COLS*CELL+14,5);ctx.fillRect(OX-7,OY+ROWS*CELL+2,COLS*CELL+14,5);
      for(var i=0;i<25;i++){var xx=OX+i*CELL;ctx.fillStyle='#8b9a9b';ctx.fillRect(xx,OY-5,2,2);ctx.fillRect(xx,OY+ROWS*CELL+3,2,2);}
      ctx=old;
    }
`;
const oldPrefix=art.slice(art.indexOf("function drawBoard(){"),art.indexOf('      for(var tr=0;'));
art=art.replace(oldPrefix,"function drawBoard(){if(!geologyCanvas)makeGeology();ctx.drawImage(geologyCanvas,0,0);\n");
// Existing tunnel paths, joining rectangles and all geometry remain exact.
art=art.replace("ctx.fillStyle='#070a17'","ctx.fillStyle='#090d16'").replace("rgba(117,231,255,.12)","rgba(194,179,167,.15)");
art=art.replace("ctx.strokeStyle='#5ceeff';ctx.lineWidth=3;ctx.shadowColor='#4deeff';ctx.shadowBlur=mobileQuality?2:12;","ctx.strokeStyle='#8aa9ad';ctx.lineWidth=3;ctx.shadowColor='#4deeff';ctx.shadowBlur=0;");
html=html.slice(0,start)+terrain+art+html.slice(end);
const css=`
    /* Agent Yoda: geological survey instruments; layout and touch targets retained. */
    html,body{background:radial-gradient(ellipse at 50% 0%,#29303a,#10131c 58%,#080b12)}
    #game-shell{border-color:#62787b;border-radius:10px;background:#10131b;box-shadow:0 22px 60px #0008}
    .card{border-color:#647b7d66;border-radius:5px;background:linear-gradient(135deg,#24333b,#141e28);box-shadow:inset 0 2px #92a1a51a;backdrop-filter:none}
    .card span{color:#b8d8d7;font-size:11px}.card strong{color:#f3eee0;font-variant-numeric:tabular-nums}
    .card.center{border-color:#ad996e88}.card.center span{color:#e4c995}
    #oxygen-wrap{bottom:5px}.meter-copy{font-size:10px;line-height:11px;color:#b8dfdc;letter-spacing:.1em}.meter{border-color:#8b9a9b66;background:#10131b}#oxygen-fill{box-shadow:none;background:linear-gradient(90deg,#d37774,#ddc08d,#8ed5cf)}
    .modal-card{border-color:#738f91;border-radius:12px;background:linear-gradient(135deg,#24333b,#121b28)}.modal h2{color:#e4c995}.modal button{background:linear-gradient(90deg,#a8d9d4,#d5e8d9);border-radius:6px}.controls-grid strong{color:#b9dedb}
    @media(max-width:900px),(pointer:coarse){
      #game-shell{border-radius:0}.hud{inset:3px 6px auto;gap:4px}.card{padding:3px 4px}.card span{font-size:7px;line-height:8px;letter-spacing:.08em}.card strong{font-size:11px;line-height:11px;margin-top:1px}
      #oxygen-wrap{bottom:1px}.meter-copy{font-size:7px;line-height:7px;margin-bottom:1px;letter-spacing:.06em}.meter{height:4px;border-width:1px}
    }
    @media(max-width:600px) and (orientation:portrait){.hud{gap:3px}.card{padding:3px 2px}.card span{font-size:7px}.card strong{font-size:10px}body.touch-device .vibecade-mobile-restart,body.touch-device .vibecade-mobile-options{top:calc(100vw * 9 / 16 + 12px) !important}}
`;
html=html.replace('  </style>',css+'  </style>');fs.writeFileSync(file,html);

/* Brass Crab's arena choreography. Tell -> multi-part attack -> recover. */
window.createCrabFight = function({ground,arena,right,shot,damage,announce,burst,sound,color}) {
  const left=arena+35,edge=right-112,floor=ground-100;
  const patterns=[
    {name:'BREAKWATER RUN',hint:'Jump the charge, then duck the return volley',time:2.9},
    {name:'VAULT & POUNCE',hint:'Move away from the landing marks',time:3.1},
    {name:'HARBOR ORBIT',hint:'Follow the gap in the sweeping fire',time:3.8},
    {name:'PINCER CROSSFIRE',hint:'Duck the high pass, jump the low return',time:3.4},
    {name:'TIDAL SLAM',hint:'Dodge the marked dive, jump the ground wave',time:2.7},
    {name:'FIGURE-EIGHT',hint:'Track the boss through two crossing arcs',time:4.1}
  ];
  function random(b){b.seed=(Math.imul(b.seed,1664525)+1013904223)>>>0;return b.seed/4294967296;}
  function nextPattern(b){
    if(!b.deck.length){b.deck=[0,1,2,3,4,5];for(let i=5;i>0;i--){const j=Math.floor(random(b)*(i+1));[b.deck[i],b.deck[j]]=[b.deck[j],b.deck[i]];}if(b.deck[0]===b.pattern)[b.deck[0],b.deck[1]]=[b.deck[1],b.deck[0]];}
    return b.deck.shift();
  }
  function aim(x,y,px,py,speed,size=12){const angle=Math.atan2(py-y,px-x);shot(x,y,Math.cos(angle)*speed,Math.sin(angle)*speed,color,size);}
  function volley(b,player,enraged){
    const x=b.x+39,y=b.y+48,angle=Math.atan2(player.y+player.h*.5-y,player.x+13-x);
    for(let n=-1;n<=1;n++){const a=angle+n*.24;shot(x,y,Math.cos(a)*(enraged?315:275),Math.sin(a)*(enraged?315:275),color,12);}
  }
  function move(b,x,y,dt,speed){const dx=x-b.x,dy=y-b.y,len=Math.hypot(dx,dy);if(len<speed*dt){b.x=x;b.y=y;return true;}b.x+=dx/len*speed*dt;b.y+=dy/len*speed*dt;return false;}
  function begin(b,player,enraged){
    b.phase='attack';b.elapsed=0;b.duration=patterns[b.pattern].time*(enraged?.91:1);b.timer=b.duration;b.originX=b.x;b.originY=b.y;b.orbitStart=Math.acos(Math.max(-1,Math.min(1,(b.x-(left+edge)/2)/((edge-left)*.48))));b.destination=b.x>(left+edge)/2?left:edge;b.shotClock=.4;b.crossed=false;b.sub=0;b.slammed=false;b.cycle++;
    if(b.pattern===1||b.pattern===4){b.mark= Math.max(left+35,Math.min(edge-35,player.x-25));}
  }
  function update(b,player,dt,t){
    const enraged=b.hp<b.max*.45;
    if(enraged&&!b.enraged){b.enraged=true;announce('BRASS CRAB / OVERDRIVE',1.8);burst(b.x+39,b.y+45,color,24);sound(140,.22,'sawtooth');}
    b.inv=Math.max(0,b.inv-dt);b.slow=Math.max(0,b.slow-dt);const step=dt*(b.slow>0?.75:1);b.timer-=step;
    if(b.phase==='wait'){
      b.y=floor+Math.sin(t*3)*2;
      if(b.timer<=0){b.pattern=nextPattern(b);b.phase='tell';b.timer=enraged?.66:.8;b.mark=Math.max(left+35,Math.min(edge-35,player.x-25));b.attackName=patterns[b.pattern].name;announce(b.attackName+' / '+patterns[b.pattern].hint,2.2);sound(420,.06,'triangle');}
    }else if(b.phase==='tell'){
      if(b.timer<=0)begin(b,player,enraged);
    }else if(b.phase==='attack'){
      b.elapsed+=step;b.timer=Math.max(0,b.duration-b.elapsed);const u=Math.min(1,b.elapsed/b.duration),span=edge-left,mid=(left+edge)/2;
      const oldX=b.x,oldY=b.y;
      if(b.pattern===0){
        // A full-arena rush, a pause, and a fast mirrored return.
        if(u<.44)move(b,b.destination,floor,step,enraged?650:555);
        else if(u<.55){b.y=floor;if(!b.crossed){b.crossed=true;for(let n=0;n<3;n++)shot(b.x+39,ground-43-n*25,b.destination===left?330:-330,0,color,13);}}
        else move(b,b.originX>mid?edge:left,floor,step,enraged?610:510);
      }else if(b.pattern===1){
        const first=u<.5,local=(first?u:u-.5)*2,start=first?b.originX:b.destination,end=first?b.destination:b.originX;
        b.x=start+(end-start)*local;b.y=floor-Math.sin(local*Math.PI)*(enraged?230:200);
        if(!first&&b.sub===0){b.sub=1;for(const direction of [-1,1])shot(b.x+39,ground-17,direction*280,0,color,14);}
      }else if(b.pattern===2){
        // Traverse an ellipse through the upper, lower, left and right arena.
        const angle=b.orbitStart+u*Math.PI*2;
        move(b,mid+Math.cos(angle)*span*.48,244+Math.sin(angle)*100,step,enraged?820:760);
      }else if(b.pattern===3){
        // The first pass is airborne with a high volley; the return skims the floor.
        if(u<.5){const local=u*2;b.x=b.originX+(b.destination-b.originX)*local;b.y=floor-95*Math.sin(local*Math.PI);}
        else{const local=(u-.5)*2;b.x=b.destination+(b.originX-b.destination)*local;b.y=floor;}
        if(u>.21&&!b.crossed){b.crossed=true;const direction=b.destination===left?-1:1;for(let n=0;n<4;n++)shot(b.x+39+direction*n*32,ground-44,direction*310,0,color,12);}
        if(u>.55&&b.sub===0){b.sub=1;for(const direction of [-1,1])shot(b.x+39,ground-17,direction*300,0,color,13);}
      }else if(b.pattern===4){
        if(u<.58)move(b,b.mark,135,step,570);
        else if(!b.slammed){if(move(b,b.mark,floor,step,enraged?860:720)){b.slammed=true;burst(b.x+39,ground,color,22);sound(95,.15,'sawtooth');for(const direction of [-1,1]){shot(b.x+39,ground-18,direction*320,0,color,15);shot(b.x+39,ground-73,direction*235,0,color,11);}}}
      }else{
        const angle=(b.originX>mid?Math.PI*.5:-Math.PI*.5)+u*Math.PI*2;
        const targetX=mid+Math.sin(angle)*span*.47,targetY=245-Math.sin(angle*2)*91;
        move(b,targetX,targetY,step,enraged?820:720);
      }
      b.vx=(b.x-oldX)/dt;b.vy=(b.y-oldY)/dt;b.x=Math.max(left,Math.min(edge,b.x));b.y=Math.max(125,Math.min(floor,b.y));
      b.shotClock-=step;
      if(b.shotClock<=0){b.shotClock=enraged?.64:.85;
        if([2,5].includes(b.pattern))volley(b,player,enraged);
        else if(b.pattern===1)aim(b.x+39,b.y+47,player.x+13,player.y+10,270,12);
      }
      if(u>=1){b.phase='recover';b.timer=enraged?.8:1.15;b.vx=b.vy=0;}
    }else if(b.phase==='recover'){
      move(b,b.x,floor,step,330);
      if(b.timer<=0){b.phase='wait';b.timer=enraged?.22:.4;}
    }
    if(player.x<b.x+b.w-9&&player.x+player.w>b.x+9&&player.y<b.y+b.h&&player.y+player.h>b.y+10)damage(4,player.x<b.x?-1:1);
  }
  function warnings(b){return {name:patterns[b.pattern]?.name||'BRASS CRAB',hint:patterns[b.pattern]?.hint||'',mark:[1,4].includes(b.pattern)?b.mark:null};}
  return {update,warnings};
};

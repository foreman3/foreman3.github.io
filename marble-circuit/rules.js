/* Geometry is shared by the actual simulation and the opt-in browser verifier. */
window.MarbleRules=(()=>{
 'use strict';
 const levels=[
  {name:'First Light',width:94,time:65,lives:5,points:[[115,465],[115,320],[300,320],[300,145],[570,145],[570,350],[805,350],[805,175]],marks:[2,4,6],bump:[],sweep:[],boost:[],tip:'Roll to beacon 1. Brake before the bend.'},
  {name:'Dogleg',width:82,time:55,lives:5,points:[[100,465],[100,280],[285,185],[380,280],[380,445],[590,445],[590,150],[735,150],[835,250],[835,465]],marks:[2,5,7],bump:[],sweep:[],boost:[],tip:'Diagonal lanes. Blend two directions; brake to turn.'},
  {name:'Pinwheel',width:74,time:55,lives:5,points:[[110,470],[305,470],[305,305],[125,305],[125,120],[505,120],[505,310],[690,310],[690,470],[835,470],[835,110]],marks:[3,5,8],bump:[{seg:4,t:.42,offset:17},{seg:9,t:.48,offset:-16}],sweep:[],boost:[],tip:'Striped bumpers push, not break. Pass on the open side.'},
  {name:'Pendulum',width:68,time:50,lives:5,points:[[105,470],[105,120],[305,120],[305,300],[495,300],[495,470],[690,470],[690,115],[835,115],[835,300]],marks:[2,4,6],bump:[{seg:2,t:.5,offset:17}],sweep:[{seg:6,t:.51,period:3.2,phase:0}],boost:[],tip:'Watch the pendulum sweep across the lane. Slow down to time a pass.'},
  {name:'Slipstream',width:64,time:49,lives:5,points:[[105,460],[265,460],[365,360],[210,250],[105,135],[390,135],[505,250],[505,460],[700,460],[700,280],[835,145]],marks:[3,5,7],bump:[{seg:1,t:.48,offset:16},{seg:9,t:.47,offset:-15}],sweep:[{seg:5,t:.47,period:2.8,phase:1}],boost:[{seg:4,t:.5},{seg:8,t:.42}],tip:'Striped tailwinds add momentum. Brake before their next turn.'},
  {name:'Knife Edge',width:52,time:35,lives:4,points:[[100,470],[275,470],[275,305],[100,305],[100,115],[470,115],[470,280],[650,280],[650,470],[830,470],[830,110]],marks:[3,5,8],bump:[{seg:1,t:.5,offset:12},{seg:6,t:.5,offset:-13},{seg:9,t:.47,offset:12}],sweep:[{seg:4,t:.49,period:2.3,phase:.5},{seg:7,t:.5,period:2.7,phase:1.6}],boost:[{seg:4,t:.7},{seg:9,t:.25}],tip:'Mastery course. Set up each bend; do not chase lost speed.'},
  {name:'Grand Circuit',width:44,time:33,lives:3,points:[[100,470],[275,470],[275,300],[100,300],[100,110],[465,110],[465,470],[650,470],[650,280],[835,280],[835,110]],marks:[3,5,7],bump:[{seg:1,t:.5,offset:11},{seg:5,t:.65,offset:-11},{seg:9,t:.48,offset:11}],sweep:[{seg:4,t:.44,period:1.9,phase:.8},{seg:5,t:.32,period:2.1,phase:1.4},{seg:8,t:.53,period:2,phase:2}],boost:[{seg:4,t:.7},{seg:8,t:.23}],tip:'The final circuit. Clean lines, timed passes, almost no wasted motion.'}
 ];
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function point(c,seg,t){const a=c.points[seg],b=c.points[seg+1],dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);return{x:a[0]+dx*t,y:a[1]+dy*t,ux:dx/len,uy:dy/len,len};}
 function distance(x,y,a,b){const dx=b[0]-a[0],dy=b[1]-a[1],q=clamp(((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy),0,1);return Math.hypot(x-a[0]-dx*q,y-a[1]-dy*q);}
 function supported(c,x,y){for(let i=0;i<c.points.length-1;i++)if(distance(x,y,c.points[i],c.points[i+1])<=c.width/2-2)return true;return false;}
 function hazards(c,time){return [...c.bump.map(h=>{const p=point(c,h.seg,h.t);return{...p,x:p.x-p.uy*h.offset,y:p.y+p.ux*h.offset,r:12,kind:'bumper'};}),...c.sweep.map(h=>{const p=point(c,h.seg,h.t),wave=Math.sin(time*Math.PI*2/h.period+h.phase)*(c.width*.42);return{...p,x:p.x-p.uy*wave,y:p.y+p.ux*wave,r:13,kind:'sweeper',sweep:h};})];}
 return{levels,point,distance,supported,hazards,clamp};
})();

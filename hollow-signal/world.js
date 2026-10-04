/* Authored chambers and their bidirectional connections. No network assets. */
window.HollowWorld = (() => {
  const biomes=[
    {name:'TIDEGLASS RUINS',ink:'#111e31',sky:'#385167',light:'#9ad7d3',accent:'#87e2da',stone:'#344a5a',story:'The sea remembers every voice.'},
    {name:'VERDANT UNDERWORKS',ink:'#102326',sky:'#3a5d52',light:'#c1de96',accent:'#b9df83',stone:'#3d5c50',story:'What looked like an infection kept them alive.'},
    {name:'CHOIR ARCHIVES',ink:'#202139',sky:'#555c7c',light:'#c1cff0',accent:'#c8b5ff',stone:'#4e5870',story:'A memory is not a malfunction.'},
    {name:'CINDER ENGINE',ink:'#291d26',sky:'#76504a',light:'#ffcd96',accent:'#ffb880',stone:'#63504f',story:'The promise is keeping the reactor awake.'},
    {name:'THE LIVING HEART',ink:'#281f32',sky:'#694357',light:'#ecbcc0',accent:'#ffaac4',stone:'#714d65',story:'You came to bring someone home.'}
  ];
  const names=['Surface Beacon','Broken Causeway','Drowned Gallery','Resonance Vault','Shellkeeper Crypt','Drainworks','Root Sanctuary','Spore Canopy','Pulse Nursery','Underroot','Matron Nest','Seeker Grotto','Choir Sanctuary','Frozen Stacks','Observatory','Memory Well','Ray Reliquary','Echo Chamber','Engine Sanctuary','Cooling Spine','Ash Conduit','Pressure Gallery','Furnace Crown','Thermal Sump','Heart Sanctuary','Witness Garden','Nerve Bridge','Chorus Vestibule','Custodian Chamber','Severance Console'];
  const grid=[[0,0],[1,0],[0,1],[2,0],[1,1],[2,1],[3,1],[4,1],[5,1],[3,2],[4,2],[5,2],[4,3],[3,3],[5,3],[4,4],[5,4],[3,4],[6,4],[6,3],[7,4],[7,3],[8,3],[8,4],[8,5],[7,5],[9,5],[8,6],[9,6],[7,6]];
  const bosses={4:0,10:1,16:2,22:3,28:4};
  const hubs=[0,6,12,18,24];
  const relics={3:'lens',8:'bomb',11:'seeker',13:'frost'};
  const tanks=[2,9,14,17,20,21,25,26];
  const witnesses={2:0,7:1,9:2,14:3,15:4,19:5,25:6,27:7};
  const rooms=names.map((name,id)=>({id,name,region:Math.floor(id/6),grid:grid[id],w:[4,10,16,22,28].includes(id)?1380:[9,13,15,19,26].includes(id)?1160:1680+(id%3)*140,h:[9,13,15,19,26].includes(id)?1000:600,kind:[5,8].includes(id)?'tunnel':[9,13,15,19,26].includes(id)?'shaft':id%4===1?'bridge':'hall',boss:bosses[id],hub:hubs.includes(id),relic:relics[id],tank:tanks.includes(id),witness:witnesses[id],portals:[]}));
  const edges=[];
  function connect(a,b,req='',options={}){
    const id=`${Math.min(a,b)}-${Math.max(a,b)}`,ra=rooms[a],rb=rooms[b],dx=rb.grid[0]-ra.grid[0],dy=rb.grid[1]-ra.grid[1];
    const side=options.side|| (Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up');
    const opposite={right:'left',left:'right',down:'up',up:'down',lift:'lift'}[side];
    const e={id,a,b,req,...options};edges.push(e);
    ra.portals.push({...e,to:b,side});rb.portals.push({...e,to:a,side:opposite});
  }
  connect(0,1);connect(0,2);connect(1,3);connect(1,4,'lens');connect(2,4,'lens');connect(3,5,'fold');connect(4,5);connect(5,6,'fold');
  connect(6,7);connect(6,9,'fold');connect(7,8,'fold');connect(7,10,'bomb');connect(9,10,'bomb');connect(10,11);connect(8,11,'bomb');connect(10,12,'jump',{high:true});
  connect(12,13,'jump',{high:true});connect(12,14);connect(12,15);connect(14,16,'bomb');connect(15,16);connect(15,17);connect(13,17,'jump');connect(17,2,'phase',{side:'lift',shortcut:true});
  connect(16,18,'phase');connect(18,19,'phase');connect(18,20);connect(19,21);connect(20,21,'jump');connect(21,22);connect(20,23,'heat');connect(22,23);connect(23,24,'heat');
  connect(24,25);connect(24,26);connect(24,27);connect(25,29,'final');connect(26,28,'heat');connect(27,28);connect(27,29,'final');
  const powers={
    lens:{name:'RESONANCE LENS',tag:'CHARGE / RELEASE',copy:'Hold Fire until the halo is complete, then release. A charged pulse opens cyan resonance seals. Lio’s voice rides the same mineral channels.'},
    fold:{name:'SPINDLE SHELL',tag:'FOLD / ROLL',copy:'Press Down / S to change form. On touch, joystick Down folds and Up unfolds where there is room. Roll through low tunnels.'},
    bomb:{name:'PULSE MINE',tag:'FOLD / FIRE',copy:'While folded, tap Fire to place a pulse mine. Its blast breaks mineral-crust defenders and amber seals. Stay folded over a blast to launch upward. Tap for precise timing, or hold Fire to chain airborne mines while steering. Mines need no ammunition.'},
    jump:{name:'WING COIL',tag:'SECOND JUMP',copy:'Release and press Jump again in the air. The second jump reaches the upper Archives and gives you room to evade aerial attacks.'},
    phase:{name:'PHASE BEAM',tag:'PIERCE / UNSEAL',copy:'A beam that passes through bodies and opens violet phase seals. Q or Weapon cycles your arsenal. The Echo Chamber now offers a return route to the ruins.'},
    heat:{name:'THERMAL MANTLE',tag:'HEAT PROTECTION',copy:'Your suit can now cross hot basins and thermal seals. Follow the reactor sump into the Living Heart.'},
    seeker:{name:'SEEKER BOLTS',tag:'HOMING / Q',copy:'Slow, guided bolts follow the closest threat. They spend regenerating suit energy; your pulse beam always remains available.'},
    frost:{name:'FROST NEEDLE',tag:'FREEZE / Q',copy:'Freezes ordinary enemies briefly. Frozen threats are harmless and can serve as temporary platforms. Use the calm to cross a crowded chamber.'}
  };
  const bossNames=['SHELLKEEPER','ROOT MATRON','ARCHIVE RAY','FURNACE EEL','THE CUSTODIAN'];
  // Dimensions and authored geometry are assigned by chambers.js.
  return{biomes,rooms,edges,powers,hubs,bossNames};
})();

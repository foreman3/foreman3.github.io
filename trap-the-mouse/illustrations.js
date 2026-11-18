const ns = 'http://www.w3.org/2000/svg';
export function svg(tag, attrs = {}) {
  const el = document.createElementNS(ns, tag);
  for (const [key, val] of Object.entries(attrs)) el.setAttribute(key, val);
  return el;
}
export function stamp(name, attrs = {}) { return svg('use', { href:'#'+name, ...attrs }); }
export function center({q,r}) {
  return { x:340 + 49 * (q+r/2), y:231 + 42.44 * r };
}

export function preparePlate() {
  // Shared printing blocks keep repeated leaves, hedges and tracks lightweight.
  document.querySelector('#symbols').innerHTML = `
    <pattern id="flecks" width="37" height="31" patternUnits="userSpaceOnUse"><path d="M2 8l1.6-.8m12 15 1.2-.5m12-10 1.7-.7m3 17 1.2-.3" fill="none" stroke="#d2d9a9" opacity=".22" stroke-width=".9"/></pattern>
    <g id="leaf"><path d="M0 0Q-12-5-9-22Q4-16 0 0Z" fill="#72906b" stroke="#233e30" stroke-width="1.3"/><path d="M0 0-8-19m4 10-4-3m3 0 1-4" fill="none" stroke="#314d38" stroke-width="1"/></g>
    <g id="frond"><path d="M0 0Q14-42 0-86" fill="none" stroke="#94a67d" stroke-width="1.8"/>
      <use href="#leaf" transform="translate(4 -13) rotate(-46)"/><use href="#leaf" transform="translate(6 -24) scale(-1 1) rotate(-38)"/>
      <use href="#leaf" transform="translate(6 -37) rotate(-45)"/><use href="#leaf" transform="translate(6 -50) scale(-.85 .85) rotate(-37)"/>
      <use href="#leaf" transform="translate(4 -61) scale(.82) rotate(-30)"/><use href="#leaf" transform="translate(2 -72) scale(-.63 .68) rotate(-25)"/></g>
    <g id="berry"><circle cy="-2" r="3.5" fill="#ae6952"/><circle cx="-3" cy="2" r="3" fill="#b87559"/><circle cx="2" cy="2" r="3.1" fill="#924c3d"/><circle cy="4.5" r="2.8" fill="#ae6550"/><path d="m-2-3 2-.8" stroke="#dfad87" stroke-linecap="round" stroke-width="1.4"/></g>
    <g id="hedge">
      <ellipse cy="11" rx="19" ry="6" fill="#766b48" opacity=".35"/>
      <path d="M-19 6q-4-8 3-11-1-8 7-9 3-7 10-4 7-4 12 3 8 0 7 8 6 7-1 13-4 6-13 5-8 4-15-1-7 1-10-4Z" fill="#38583c" stroke="#294737" stroke-width="1.8"/>
      <path d="M-15-2q-1-6 6-7 1-5 8-5m2 3q4-5 8 0m3 3 3 3" fill="none" stroke="#81916a" stroke-width="2" stroke-linecap="round"/>
      <g stroke="#a9b280" stroke-width="1" fill="#6f895d"><path d="M-10 5q-6 0-7-5 6-1 7 5Zm7-3q-1-6 4-8 1 6-4 8Zm9 5q3-6 8-5-1 4-8 5Z"/></g>
      <g fill="var(--bloom)" stroke="#493d32" stroke-width=".7"><circle cx="-7" cy="0" r="2.5"/><circle cx="-4" cy="3" r="2.3"/><circle cx="8" cy="-6" r="2.4"/></g>
    </g>
    <g id="field-mouse" stroke-linecap="round" stroke-linejoin="round">
      <ellipse cx="0" cy="13" rx="19" ry="5" fill="#5f4c35" opacity=".32"/>
      <path d="M-12 8C-26 12-27 1-21-3c3-2 2-6-1-7" fill="none" stroke="#49392d" stroke-width="3"/><path d="M-12 8C-26 12-27 1-21-3c3-2 2-6-1-7" fill="none" stroke="#d59775" stroke-width="1.6"/>
      <path d="M-18 7Q-20-4-10-10Q-4-14 2-11Q7-17 13-10L21-3Q22 0 13 4L6 9Q0 14-12 12Z" fill="#bd783f" stroke="#49392d" stroke-width="1.8"/>
      <path d="M1 6Q9 2 20-2 16 4 8 7l-5 3Z" fill="#edc392"/>
      <path d="M1-9Q-5-17 1-20 8-22 8-12" fill="#c48a59" stroke="#49392d" stroke-width="1.4"/><path d="M2-12q-3-6 1-6 4 0 3 6" fill="#e2aa94"/>
      <circle cx="12" cy="-8" r="2.3" fill="#302c25"/><circle cx="12.6" cy="-8.7" r=".75" fill="#fff5d6"/><ellipse cx="21" cy="-3" rx="2" ry="1.45" fill="#614332"/>
      <path d="m14-1 9 1m-10 1 8 2M-11 11l6 1m8-3 5 1" fill="none" stroke="#70533d" stroke-width="1"/>
      <path d="m-15 0 4-5m0 3 4-5m-3 7 3-4m2-4 3-2" fill="none" stroke="#ecc292" stroke-width="1.15"/>
    </g>
    <g id="paw" fill="#805335"><ellipse cy="2.1" rx="2.25" ry="2.7"/><circle cx="-2.7" cy="-1.1" r="1"/><circle cx="-.7" cy="-2.8" r="1.1"/><circle cx="1.6" cy="-2.4" r="1"/></g>
    <g id="tuft" fill="none" stroke="#8c8d67" stroke-linecap="round" stroke-width="1.3"><path d="m-3 2-2-3m5 3 1-6m2 6 3-3"/></g>
    <g id="exit-mark" fill="none" stroke="#704f36" stroke-linecap="round" stroke-width="1.5"><path d="m-3 1 3-3 3 3m-6 4 3-3 3 3"/></g>
  `;
  const decor = document.querySelector('#engraving');
  decor.append(svg('rect',{width:680,height:462,fill:'url(#flecks)'}));
  for (const inset of [8,12]) {
    decor.append(svg('rect',{x:inset,y:inset,width:680-2*inset,height:462-2*inset,fill:'none',stroke:'#b8ba87',opacity:inset===8?.52:.22,'stroke-width':1}));
  }
  for (const flip of [false,true]) {
    const corner=svg('g',{transform:flip?'translate(680 462) rotate(180)':'',opacity:'.82'});
    for (const [x,y,angle,s] of [[19,442,10,1.52],[22,435,48,1.23],[29,436,78,.94],[28,361,-12,.88],[61,415,26,.75],[22,294,3,.65]]) {
      corner.append(stamp('frond',{transform:`translate(${x} ${y}) rotate(${angle}) scale(${s})`}));
    }
    for (const [x,y] of [[39,371],[43,378],[61,401],[78,411],[37,315]]) corner.append(stamp('berry',{transform:`translate(${x} ${y})`}));
    decor.append(corner);
  }
  const compass=svg('g',{transform:'translate(67 65)',fill:'#b8be91',stroke:'#acb38c',opacity:'.78'});
  compass.innerHTML='<circle r="17" fill="none" stroke-width=".6"/><path d="m0-22 4 18 17 4-17 3-4 18-3-18-18-3 18-4Z" fill="none" stroke-width=".9"/><path d="M0-22V0l4-4ZM0 21V0l-3 3Z" stroke="none"/><text y="-27" text-anchor="middle" stroke="none" font-family="Georgia" font-size="10">N</text>';
  decor.append(compass);
}

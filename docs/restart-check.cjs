// Run with Node and Playwright against a local server on port 8765.
// Exposes lexical state only in intercepted test responses; production has no test hooks.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const cases = {
  arkanoid: ['levelIndex=3;score=900;lives=1;bricks.forEach(b=>b.alive=false);checkLevelComplete()', '[levelIndex,score,lives]', [0,0,3]],
  asteroids: ['score=900;lives=1', '[score,lives]', [0,3]],
  balance: ['score=9', 'score', 0],
  'barrel-brigade': ['state.level=4;state.score=900;state.hats=1', '[state.level,state.score,state.hats]', [1,0,4]],
  boxing: ['state.opponentIndex=3;state.score=900;player.health=10', '[state.opponentIndex,state.score,player.health]', [0,0,100]],
  burger: ['levelNumber=3;score=900;lives=1;handleLevelComplete()', '[levelNumber,score,lives]', [0,0,3]],
  'deep-core': ['state.stage=4;state.score=900;state.lives=1', '[state.stage,state.score,state.lives]', [1,0,3]],
  excitebike: ['state.stage=3;state.score=900', '[state.stage,state.score]', [1,0]],
  flappy: ['score=9', 'score', 0],
  'galactic-wing': ['wave=4;score=900;lives=1', '[wave,score,lives]', [1,0,3]],
  joust: ['state.wave=4;state.score=900;state.lives=1', '[state.wave,state.score,state.lives]', [1,0,3]],
  'lunar-lander': ['state.level=4;state.score=900;state.hull=1', '[state.level,state.score,state.hull]', [1,0,3]],
  'missile-command': ['wave=4;score=900', '[wave,score]', [1,0]],
  'mushroom-moon': ['state.wave=4;state.score=900;state.lives=1', '[state.wave,state.score,state.lives]', [1,0,3]],
  'neon-flight': ['score=900;distance=900', '[score,distance]', [0,0]],
  'number-munchers': ['level=4;score=900;lives=1', '[level,score,lives]', [1,0,4]],
  pacman: ['level=4;score=900;lives=1', '[level,score,lives]', [1,0,3]],
  'paper-route-rush': ["state.phase=4;state.score=900;state.mode='failed'", '[state.phase,state.score,state.health]', [1,0,3]],
  pinball: ['state.stage=3;state.score=900;state.lives=1;state.ballSave=1;drainBall()', '[state.stage,state.score,state.lives,ball.ready]', [0,0,3,true]],
  pitfall: ['state.screenIndex=4;state.score=900;state.lives=1', '[state.screenIndex,state.score,state.lives]', [0,0,3]],
  pole: ['state.lap=3;state.score=900;state.raceDistance=900', '[state.lap,state.score,state.raceDistance]', [1,0,0]],
  qbert: ['level=4;lives=1', '[level,lives]', [1,3]],
  'river-run': ['state.stage=4;state.score=900;state.lives=1', '[state.stage,state.score,state.lives]', [1,0,3]],
  'scorched-earth': ['roundNumber=5', 'roundNumber', 1],
  'soda-shift': ['state.phaseIndex=3;state.score=900;state.lives=1', '[state.phaseIndex,state.score,state.lives]', [0,0,3]],
  'space-invaders': ['wave=4;score=900;lives=1', '[wave,score,lives]', [1,0,3]],
  'space-invaders-command': ['wave=4;score=900;missiles.push({x:1,y:1,tx:1,ty:1})', '[wave,score,missiles.length,explosions.length]', [1,0,0,0]],
  tanks: ['level=4;lives=1;transitionTicks=80', '[level,lives,transitionTicks,enemies.length]', [1,3,0,2]],
  tetris: ['score=900;lines=20', '[score,lines]', [0,0]],
  'trap-the-mouse': ['level=4;pendingTurn=setTimeout(()=>{level++;startLevel()},200)', 'level', 1],
  'ultra-tanks': ['level=4;lives=1;totalSpawned=90', '[level,lives,totalSpawned,guidedMissilesRemaining,airRaidAvailable]', [1,3,2,5,1]],
  'video-poker': ["credits=5;bet=5;stage='drawing'", '[credits,bet,stage,hand.length]', [100,1,'select',0]]
};
function expose(source) {
  const hook = '\nwindow.__audit = expression => eval(expression);\n';
  if (source.includes('} catch (bootError)')) return source.replace('} catch (bootError)',hook+'} catch (bootError)');
  const ending = source.match(/\}\)\(\);\s*$/);
  return ending ? source.slice(0, ending.index) + hook + source.slice(ending.index) : source + hook;
}
async function instrument(page, slug) {
  await page.route(`**/${slug}/**`, async route => {
    const url = new URL(route.request().url());
    let file = path.join(root, decodeURIComponent(url.pathname));
    if (url.pathname.endsWith('/')) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) return route.continue();
    if (file.endsWith('index.html')) {
      let source = fs.readFileSync(file, 'utf8');
      const scripts = [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].filter(m => m[1].trim());
      for (const script of scripts) new vm.Script(script[1], { filename: file });
      const largest = scripts.sort((a,b)=>b[1].length-a[1].length)[0];
      if (largest) source = source.replace(largest[0], largest[0].replace(largest[1], expose(largest[1])));
      return route.fulfill({ body: source, contentType: 'text/html' });
    }
    if (file.endsWith('game.js')) {
      const source = fs.readFileSync(file, 'utf8'); new vm.Script(source, { filename: file });
      return route.fulfill({body:expose(source),contentType:'text/javascript'});
    }
    return route.continue();
  });
}
module.exports = { instrument };
if (require.main === module) (async () => {
  const browser = await chromium.launch({ channel:'msedge', headless:true });
  const failures = [];
  const listed = [...fs.readFileSync(path.join(root,'Games.md'),'utf8').matchAll(/\]\(([a-z-]+)\/\)/g)].map(m=>m[1]);
  assert.deepEqual(Object.keys(cases).sort(), listed.sort(), 'Every local canonical game is covered');
  for (const [slug, [mutate, snapshot, expected]] of Object.entries(cases)) {
    if (process.argv.length > 2 && !process.argv.slice(2).includes(slug)) continue;
    const page = await browser.newPage({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    try {
      if (slug === 'balance' && process.env.VIBECADE_MATTER_PATH) {
        await page.route('https://cdnjs.cloudflare.com/ajax/libs/matter-js/0.19.0/matter.min.js', route =>
          route.fulfill({path:process.env.VIBECADE_MATTER_PATH,contentType:'text/javascript'}));
      }
      await instrument(page, slug);
      await page.goto(`http://127.0.0.1:8765/${slug}/`, {waitUntil:'load'});
      await page.waitForFunction(()=>typeof window.__audit==='function' && document.querySelector('.vibecade-mobile-restart, #restartBtn'));
      // Dismiss through the actual launch flow before mutating a progressed run.
      const launch = page.locator('#instruction-close, #startGameBtn, #start-button').first();
      if (await launch.isVisible()) await launch.click({timeout:4000});
      await page.waitForTimeout(1800);
      await page.evaluate(({mutate,snapshot,expected})=>{
        window.__audit(mutate);
        (document.querySelector('.vibecade-mobile-restart') || document.querySelector('#restartBtn')).click();
        const actual=window.__audit(snapshot);
        if(JSON.stringify(actual)!==JSON.stringify(expected))throw new Error(JSON.stringify({actual,expected}));
      },{mutate,snapshot,expected});
      if (slug === 'pinball') await page.evaluate(()=>__audit('ball.ready=false;paused=true'));
      if (slug === 'tetris') {
        const scheduled = await page.evaluate(()=>{
          const original=window.requestAnimationFrame;let count=0;
          window.requestAnimationFrame=callback=>{count++;return original(callback);};
          try { for(let i=0;i<5;i++) window.__audit('resetGame()'); }
          finally { window.requestAnimationFrame=original; }
          return count;
        });
        assert.equal(scheduled,0,'Restart must not create additional animation loops');
      }
      await page.waitForTimeout(1600);
      assert.equal(errors.length,0,errors.join('\n'));
      if(['arkanoid','burger','trap-the-mouse'].includes(slug)) assert.deepEqual(await page.evaluate(s=>window.__audit(s),snapshot),expected,'Old transition must not change restarted run');
      if(slug==='pinball')assert.equal(await page.evaluate(()=>__audit('ball.ready')),false,'Old ball-save timer must not replace the new ball');
      console.log(`PASS ${slug}`);
    } catch(e) { failures.push(slug);console.log(`FAIL ${slug}: ${e.message.slice(0,900)}; errors=${errors.join(';')}`); }
    finally { await page.close(); }
  }
  await browser.close();
  if(failures.length)process.exitCode=1;
})();

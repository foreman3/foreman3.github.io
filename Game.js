import { PinballTable } from './PinballTable.js';
import { MiniTable } from './MiniTable.js';

export class Game {
    constructor() {
        this.score = 0;
        this.lives = 3;
        this.treasures = 0;
        this.inMiniGame = false;
        
        this.initThree();
        this.initMatter();
        this.initUI();
        this.initParticles();
        
        this.pinballTable = new PinballTable(this.engine, this.scene, this);
        
        this.addCollisionEvents();
        this.animate();
    }

    initThree() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 3000);
        this.camera.position.set(0, -400, 1200);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(-200, -200, 1000);
        this.scene.add(directionalLight);
    }

    initMatter() {
        this.engine = Matter.Engine.create();
        this.engine.world.gravity.y = 1.2;
    }
    
    initUI() {
        this.scoreElement = document.createElement('div');
        this.scoreElement.style.cssText = 'position:absolute;top:20px;right:20px;color:white;font-family:sans-serif;font-size:24px;';
        document.body.appendChild(this.scoreElement);

        this.livesElement = document.createElement('div');
        this.livesElement.style.cssText = 'position:absolute;top:50px;right:20px;color:white;font-family:sans-serif;font-size:24px;';
        document.body.appendChild(this.livesElement);
        
        this.treasuresElement = document.createElement('div');
        this.treasuresElement.style.cssText = 'position:absolute;top:80px;right:20px;color:white;font-family:sans-serif;font-size:24px;';
        document.body.appendChild(this.treasuresElement);

        this.updateScore(0);
        this.updateLives(0);
        this.updateTreasures(0);
    }
    
    initParticles() {
        particlesJS('particles-js', { /* ... particles.js config ... */ });
    }
    
    updateScore(points) { this.score += points; this.scoreElement.innerText = `Score: ${this.score}`; }
    updateLives(change) { this.lives += change; this.livesElement.innerText = `Lives: ${this.lives}`; if (this.lives === 0) this.gameOver(); }
    updateTreasures(change) { this.treasures += change; this.treasuresElement.innerText = `Treasures: ${this.treasures}`; }

    gameOver() {
        const gameOverElement = document.createElement('div');
        gameOverElement.style.cssText = 'position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);color: white;font-family: sans-serif;font-size: 48px;';
        gameOverElement.innerText = 'Game Over';
        document.body.appendChild(gameOverElement);
        Matter.Engine.clear(this.engine);
    }
    
    startMiniGame() {
        this.inMiniGame = true;
        this.pinballTable.destroy();
        this.miniTable = new MiniTable(this.engine, this.scene);
        this.scene.background = new THREE.Color(0x4a2a1a);
    }
    
    endMiniGame(win) {
        this.inMiniGame = false;
        this.miniTable.destroy();
        if(win) this.updateTreasures(1);
        this.pinballTable = new PinballTable(this.engine, this.scene, this);
        this.scene.background = new THREE.Color(0x1a1a1a);
    }
    
    addCollisionEvents() {
        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;
                const ballLabel = this.inMiniGame ? 'mini-ball' : 'ball';
                const ball = bodyA.label === ballLabel ? bodyA : (bodyB.label === ballLabel ? bodyB : null);
                if (!ball) return;
                
                const other = bodyA === ball ? bodyB : bodyA;

                if (other.label === 'drain') {
                    this.updateLives(-1);
                    Matter.Body.setPosition(this.pinballTable.ballBody, {x: TABLE_WIDTH - 80, y: TABLE_HEIGHT - 200});
                    Matter.Body.setVelocity(this.pinballTable.ballBody, {x: 0, y: 0});
                } else if (other.label === 'bumper' || other.label === 'slingshot' || other.label === 'spinner') {
                    this.updateScore(100);
                } else if (other.label === 'dropTarget') {
                    this.updateScore(250);
                     const index = this.pinballTable.dropTargets.indexOf(other);
                    if (index > -1) {
                        Matter.World.remove(this.engine.world, other);
                        this.scene.remove(this.pinballTable.dropTargetMeshes[index]);
                        this.pinballTable.dropTargetMeshes[index] = null;
                    }
                } else if (other.label === 'upperTarget') {
                    this.updateScore(500);
                    const index = this.pinballTable.upperTargets.indexOf(other);
                    if (index > -1) {
                        Matter.World.remove(this.engine.world, other);
                        this.scene.remove(this.pinballTable.upperTargetMeshes[index]);
                        this.pinballTable.upperTargetMeshes[index] = null;
                    }
                }
                else if (other.label === 'book') {
                    this.updateScore(200);
                    this.pinballTable.clues++;
                    const index = this.pinballTable.books.indexOf(other);
                    if (index > -1) {
                        Matter.World.remove(this.engine.world, other);
                        this.scene.remove(this.pinballTable.bookMeshes[index]);
                        this.pinballTable.bookMeshes[index] = null;
                        if(this.pinballTable.clues === 5) this.pinballTable.openBookcase();
                    }
                } else if (other.label === 'tunnel') {
                    this.startMiniGame();
                } else if (other.label === 'pyramid') {
                    this.endMiniGame(true);
                } else if (other.label === 'miniDrain') {
                    this.endMiniGame(false);
                } else if (other.label === 'skillShot') {
                    if (ball.velocity.y < -10) {
                        this.updateScore(1000);
                    }
                } else if (other.label === 'ramp') {
                    this.updateScore(500);
                    if (other === this.pinballTable.leftRamp.body) {
                        this.pinballTable.leftRamp.attachBall(ball);
                    } else if (other === this.pinballTable.rightRamp.body) {
                        this.pinballTable.rightRamp.attachBall(ball);
                    }
                }
            });
        });
    }

    animate() {
        if(this.lives > 0) Matter.Engine.update(this.engine);
        if(this.inMiniGame) {
            if(this.miniTable) this.miniTable.update();
        }
        else this.pinballTable.update();
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animate());
    }
}

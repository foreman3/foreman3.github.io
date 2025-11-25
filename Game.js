import { PinballTable } from './PinballTable.js';
import { MiniTable } from './MiniTable.js';

export class Game {
    constructor() {
        this.score = 0;
        this.lives = 3;
        this.treasures = 0;
        this.clues = 0;
        this.items = [];
        this.activeMission = null;
        this.missions = [
            { id: 'egypt', name: "Pharaoh's Tomb", item: 'Scepter', unlockClues: 3 },
            { id: 'atlantis', name: "Lost City", item: 'Trident', unlockClues: 4 },
            { id: 'jungle', name: "Jungle Temple", item: 'Idol', unlockClues: 5 },
            { id: 'pirate', name: "Pirate Cove", item: 'Chest', unlockClues: 3 },
            { id: 'space', name: "Alien Base", item: 'Artifact', unlockClues: 6 }
        ];
        this.availableMissions = [...this.missions];
        this.startNextMission();

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
        this.camera.position.set(0, -600, 1000);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
        directionalLight.position.set(-200, -400, 1000);
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

        this.missionElement = document.createElement('div');
        this.missionElement.style.cssText = 'position:absolute;top:110px;right:20px;color:white;font-family:sans-serif;font-size:18px;text-align:right;';
        document.body.appendChild(this.missionElement);
        this.updateMissionUI();
    }

    initParticles() {
        particlesJS('particles-js', { /* ... particles.js config ... */ });
    }

    updateScore(points) { this.score += points; this.scoreElement.innerText = `Score: ${this.score}`; }
    updateLives(change) { this.lives += change; this.livesElement.innerText = `Lives: ${this.lives}`; if (this.lives === 0) this.gameOver(); }
    updateTreasures(change) { this.treasures += change; this.treasuresElement.innerText = `Treasures: ${this.treasures}`; }

    startNextMission() {
        if (this.availableMissions.length === 0) {
            this.activeMission = { name: "All Treasures Found!", item: "Winner", unlockClues: 999 };
        } else {
            const index = Math.floor(Math.random() * this.availableMissions.length);
            this.activeMission = this.availableMissions.splice(index, 1)[0];
        }
        this.clues = 0;
        this.updateMissionUI();
    }

    updateMissionUI() {
        if (!this.activeMission) return;
        this.missionElement.innerHTML = `
            Mission: ${this.activeMission.name}<br>
            Clues: ${this.clues}/${this.activeMission.unlockClues}<br>
            Item: ${this.items.includes(this.activeMission.item) ? this.activeMission.item : 'Locked'}
        `;
    }

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
        this.pinballTable.destroy();
        this.miniTable = new MiniTable(this.engine, this.scene, this, this.activeMission.id);
        this.scene.background = new THREE.Color(0x000000);
    }

    endMiniGame(win) {
        this.inMiniGame = false;
        this.miniTable.destroy();
        if (win) {
            this.updateTreasures(1);
            this.startNextMission();
        } else {
            // Reset clues if failed? Or keep them? Let's keep them for now but maybe reset tunnel
            // For now, just return to main table, tunnel closes
        }
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
                    Matter.Body.setPosition(this.pinballTable.ballBody, { x: TABLE_WIDTH - 70, y: TABLE_HEIGHT - 100 });
                    Matter.Body.setVelocity(this.pinballTable.ballBody, { x: 0, y: 0 });
                } else if (other.label === 'bumper') {
                    this.updateScore(100);
                    other.light.intensity = 1;
                } else if (other.label === 'slingshot' || other.label === 'spinner') {
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
                    // this.pinballTable.clues++; // Moved to Game state
                    const index = this.pinballTable.books.indexOf(other);
                    if (index > -1) {
                        Matter.World.remove(this.engine.world, other);
                        this.scene.remove(this.pinballTable.bookMeshes[index]);
                        this.pinballTable.bookMeshes[index] = null;
                        this.pinballTable.bookMeshes[index] = null;
                        this.clues++;
                        this.updateMissionUI();
                        if (this.clues >= this.activeMission.unlockClues && !this.items.includes(this.activeMission.item)) {
                            this.items.push(this.activeMission.item);
                            this.updateMissionUI();
                            this.pinballTable.openBookcase(); // Reveal tunnel
                        }
                    }
                } else if (other.label === 'tunnel') {
                    this.startMiniGame();
                } else if (other.label === 'pyramid') {
                    this.endMiniGame(true);
                } else if (other.label === 'saucer') {
                    this.updateScore(500);
                    // Multiball Lock Logic
                    if (!this.multiballActive) {
                        this.pinballTable.lockBall(ball);
                        if (this.pinballTable.lockedBalls === 3) {
                            this.startMultiball();
                        } else {
                            // Spawn a new ball for the player to continue
                            setTimeout(() => this.pinballTable.createBall(), 1000);
                        }
                    } else {
                        // In multiball, just kick it out
                        Matter.Body.setVelocity(ball, { x: 0, y: 0 });
                        Matter.Body.setPosition(ball, other.position);
                        setTimeout(() => {
                            Matter.Body.applyForce(ball, ball.position, { x: Math.random() > 0.5 ? 0.1 : -0.1, y: -0.2 });
                        }, 500);
                    }
                } else if (other.label === 'rollover') {
                    this.updateScore(100);
                    other.light.intensity = 1;
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

    startMultiball() {
        this.multiballActive = true;
        this.pinballTable.releaseLockedBalls();
        this.updateMissionUI(); // Maybe show "MULTIBALL!"
    }

    animate() {
        if (this.lives > 0) Matter.Engine.update(this.engine);
        if (this.inMiniGame) {
            if (this.miniTable) this.miniTable.update();
        }
        else {
            if (this.pinballTable) this.pinballTable.update();
        }
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animate());
    }
}
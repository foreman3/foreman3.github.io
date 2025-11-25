// Ensure Matter.js, Three.js and particles.js are loaded
if (typeof Matter === 'undefined' || typeof THREE === 'undefined' || typeof particlesJS === 'undefined') {
    throw new Error('Matter.js, Three.js or particles.js is not loaded');
}

// Constants
const TABLE_WIDTH = 800;
const TABLE_HEIGHT = 1200;

// Helper function to convert Matter.js coordinates to Three.js coordinates
const matterToThree = (body, mesh) => {
    const { x, y } = body.position;
    mesh.position.set(x - TABLE_WIDTH / 2, -(y - TABLE_HEIGHT / 2), 0);
    mesh.rotation.z = body.angle;
};

class MiniTable {
    constructor(engine, scene) {
        this.engine = engine;
        this.scene = scene;
        this.elements = [];
        this.createMiniTable();
        this.createBall();
        this.addControls();
    }

    createMiniTable() {
        const wallOptions = { isStatic: true, render: { fillStyle: '#b5a642' } };
        const miniTableX = TABLE_WIDTH / 2;
        const miniTableY = TABLE_HEIGHT / 2;

        this.walls = [
            Matter.Bodies.rectangle(miniTableX, miniTableY - 200, 400, 20, wallOptions),
            Matter.Bodies.rectangle(miniTableX, miniTableY + 200, 400, 20, wallOptions),
            Matter.Bodies.rectangle(miniTableX - 200, miniTableY, 20, 400, wallOptions),
            Matter.Bodies.rectangle(miniTableX + 200, miniTableY, 20, 400, wallOptions),
        ];

        this.pyramid = Matter.Bodies.rectangle(miniTableX, miniTableY, 100, 100, {isStatic: true, label: 'pyramid'});
        Matter.World.add(this.engine.world, [...this.walls, this.pyramid]);

        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xb5a642 });
        this.wallMeshes = this.walls.map(wall => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(wall.bounds.max.x - wall.bounds.min.x, wall.bounds.max.y - wall.bounds.min.y, 20), wallMaterial);
            this.scene.add(mesh);
            return mesh;
        });
        
        const pyramidMaterial = new THREE.MeshStandardMaterial({ color: 0xf0e68c });
        this.pyramidMesh = new THREE.Mesh(new THREE.ConeGeometry(70, 100, 4), pyramidMaterial);
        this.scene.add(this.pyramidMesh);
    }
    
    createBall() {
        this.ballBody = Matter.Bodies.circle(TABLE_WIDTH / 2, TABLE_HEIGHT/2 + 150, 10, { restitution: 0.9, label: 'mini-ball' });
        Matter.World.add(this.engine.world, this.ballBody);

        const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
        this.ballMesh = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 32), ballMaterial);
        this.scene.add(this.ballMesh);
    }
    
    addControls() {
        // Simplified controls for the mini table
    }

    update() {
        matterToThree(this.ballBody, this.ballMesh);
        this.walls.forEach((wall, i) => matterToThree(wall, this.wallMeshes[i]));
        matterToThree(this.pyramid, this.pyramidMesh);
    }
    
    destroy() {
        Matter.World.clear(this.engine.world, false);
        this.scene.remove(this.ballMesh, ...this.wallMeshes, this.pyramidMesh);
    }
}


class PinballTable {
    constructor(engine, scene, game) {
        this.engine = engine;
        this.scene = scene;
        this.game = game;
        this.elements = [];
        this.clues = 0;
        this.bookcaseOpen = false;

        this.createTable();
        this.createFlippers();
        this.createBall();
        this.createPlunger();
        this.createBumpers();
        this.createSlingshots();
        this.createBookcase();
        
        this.addControls();
    }

    createTable() {
        const wallOptions = { isStatic: true, render: { fillStyle: '#1a2a3a' } };
        
        const vertices = [
            { x: 0, y: 0 }, { x: TABLE_WIDTH, y: 0 }, { x: TABLE_WIDTH, y: TABLE_HEIGHT }, { x: 0, y: TABLE_HEIGHT },
        ];

        const wall = Matter.Bodies.fromVertices(TABLE_WIDTH/2, TABLE_HEIGHT/2, [vertices], wallOptions);

        this.drain = Matter.Bodies.rectangle(TABLE_WIDTH / 2, TABLE_HEIGHT - 20, TABLE_WIDTH / 2, 20, {isStatic: true, isSensor: true, label: 'drain'});
        this.tunnel = Matter.Bodies.rectangle(150, 150, 100, 50, {isStatic: true, isSensor: true, label: 'tunnel'});

        Matter.World.add(this.engine.world, [wall, this.drain, this.tunnel]);

        const shape = new THREE.Shape();
        shape.moveTo(vertices[0].x - TABLE_WIDTH/2, -(vertices[0].y-TABLE_HEIGHT/2));
        shape.lineTo(vertices[1].x - TABLE_WIDTH/2, -(vertices[1].y-TABLE_HEIGHT/2));
        shape.lineTo(vertices[2].x - TABLE_WIDTH/2, -(vertices[2].y-TABLE_HEIGHT/2));
        shape.lineTo(vertices[3].x - TABLE_WIDTH/2, -(vertices[3].y-TABLE_HEIGHT/2));
        shape.lineTo(vertices[0].x - TABLE_WIDTH/2, -(vertices[0].y-TABLE_HEIGHT/2));
        
        const extrudeSettings = { depth: 20, bevelEnabled: false };
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const material = new THREE.MeshStandardMaterial({ color: 0x1a2a3a });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = -10;
        this.scene.add(mesh);
    }
    
    createFlippers() {
        const flipperOptions = { restitution: 0.5, friction: 1, density: 0.01 };
        
        this.leftFlipper = Matter.Bodies.rectangle(TABLE_WIDTH/2 - 120, TABLE_HEIGHT - 120, 150, 20, flipperOptions);
        const leftFlipperPivot = Matter.Bodies.circle(this.leftFlipper.position.x - 70, this.leftFlipper.position.y, 5, { isStatic: true });
        this.leftFlipperConstraint = Matter.Constraint.create({ bodyA: this.leftFlipper, bodyB: leftFlipperPivot, stiffness: 0.1, length: 0 });
        
        this.rightFlipper = Matter.Bodies.rectangle(TABLE_WIDTH/2 + 120, TABLE_HEIGHT - 120, 150, 20, flipperOptions);
        const rightFlipperPivot = Matter.Bodies.circle(this.rightFlipper.position.x + 70, this.rightFlipper.position.y, 5, { isStatic: true });
        this.rightFlipperConstraint = Matter.Constraint.create({ bodyA: this.rightFlipper, bodyB: rightFlipperPivot, stiffness: 0.1, length: 0 });
        
        Matter.World.add(this.engine.world, [this.leftFlipper, leftFlipperPivot, this.leftFlipperConstraint, this.rightFlipper, rightFlipperPivot, this.rightFlipperConstraint]);

        const flipperMaterial = new THREE.MeshStandardMaterial({ color: 0xff4500, metalness: 0.6, roughness: 0.3 });
        this.leftFlipperMesh = new THREE.Mesh(new THREE.BoxGeometry(150, 20, 10), flipperMaterial);
        this.rightFlipperMesh = new THREE.Mesh(new THREE.BoxGeometry(150, 20, 10), flipperMaterial);
        this.scene.add(this.leftFlipperMesh);
        this.scene.add(this.rightFlipperMesh);
    }

    createBall() {
        this.ballBody = Matter.Bodies.circle(TABLE_WIDTH - 80, TABLE_HEIGHT - 200, 20, { restitution: 0.9, friction: 0.01, label: 'ball' });
        Matter.World.add(this.engine.world, this.ballBody);

        const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
        this.ballMesh = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 32), ballMaterial);
        this.scene.add(this.ballMesh);
    }

    createPlunger() {
        const plungerX = TABLE_WIDTH - 60;
        this.plungerBody = Matter.Bodies.rectangle(plungerX, TABLE_HEIGHT - 100, 20, 80, { isStatic: false, label: 'plunger' });
        const plungerConstraint = Matter.Constraint.create({ bodyA: this.plungerBody, pointB: { x: plungerX, y: TABLE_HEIGHT - 150 }, stiffness: 0.05 });
        const plungerStopper = Matter.Bodies.rectangle(plungerX, TABLE_HEIGHT-50, 40, 20, {isStatic: true});
        Matter.World.add(this.engine.world, [this.plungerBody, plungerConstraint, plungerStopper]);
        
        const plungerMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        this.plungerMesh = new THREE.Mesh(new THREE.BoxGeometry(20, 80, 10), plungerMaterial);
        this.scene.add(this.plungerMesh);
        this.plungerPullForce = 0;
    }
    
    createBumpers() {
        const bumperOptions = { isStatic: true, restitution: 2, label: 'bumper' };
        this.bumpers = [
            Matter.Bodies.circle(TABLE_WIDTH / 2, 350, 40, bumperOptions),
            Matter.Bodies.circle(TABLE_WIDTH / 2 - 150, 450, 30, bumperOptions),
            Matter.Bodies.circle(TABLE_WIDTH / 2 + 150, 450, 30, bumperOptions)
        ];
        Matter.World.add(this.engine.world, this.bumpers);

        const bumperMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffff, metalness: 0.7, roughness: 0.2, emissive: 0x00ffff, emissiveIntensity: 0.5 });
        this.bumperMeshes = this.bumpers.map((bumper, i) => {
            const radius = bumper.circleRadius;
            const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 30, 32), bumperMaterial);
            this.scene.add(mesh);
            return mesh;
        });
    }

    createSlingshots() {
        const slingshotOptions = { isStatic: true, restitution: 1.5, label: 'slingshot' };
        this.slingshots = [
            Matter.Bodies.rectangle(TABLE_WIDTH/2 - 250, TABLE_HEIGHT - 350, 20, 150, slingshotOptions),
            Matter.Bodies.rectangle(TABLE_WIDTH/2 + 250, TABLE_HEIGHT - 350, 20, 150, slingshotOptions)
        ];
        Matter.World.add(this.engine.world, this.slingshots);

        const slingshotMaterial = new THREE.MeshStandardMaterial({ color: 0xff1493 });
        this.slingshotMeshes = this.slingshots.map(slingshot => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(20, 150, 20), slingshotMaterial);
            this.scene.add(mesh);
            return mesh;
        });
    }
    
    createBookcase() {
        this.books = [];
        this.bookMeshes = [];
        const bookOptions = { isStatic: true, label: 'book' };
        const bookcaseX = 150;
        const bookcaseY = 200;
        for (let i = 0; i < 5; i++) {
            const book = Matter.Bodies.rectangle(bookcaseX + i * 30, bookcaseY, 25, 80, bookOptions);
            this.books.push(book);
            const bookMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const bookMesh = new THREE.Mesh(new THREE.BoxGeometry(25, 80, 30), bookMaterial);
            this.bookMeshes.push(bookMesh);
        }
        this.bookcase = Matter.Composite.create({ bodies: this.books });
        Matter.World.add(this.engine.world, this.bookcase);
        this.bookMeshes.forEach(mesh => this.scene.add(mesh));
    }

    addControls() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') {
                Matter.Body.setAngularVelocity(this.leftFlipper, -Math.PI * 0.05);
            } else if (event.key === 'ArrowRight') {
                Matter.Body.setAngularVelocity(this.rightFlipper, Math.PI * 0.05);
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === 'ArrowLeft') {
                Matter.Body.setAngularVelocity(this.leftFlipper, Math.PI * 0.03);
            } else if (event.key === 'ArrowRight') {
                Matter.Body.setAngularVelocity(this.rightFlipper, -Math.PI * 0.03);
            }
        });
        
        const plungerElement = this.game.renderer.domElement;
        plungerElement.addEventListener('mousedown', () => { this.plungerPullForce = 1; });
        plungerElement.addEventListener('mouseup', () => {
             Matter.Body.applyForce(this.ballBody, this.plungerBody.position, {x: 0, y: -this.plungerPullForce});
             this.plungerPullForce = 0;
        });
    }
    
    openBookcase() {
        if(this.bookcaseOpen) return;
        this.bookcaseOpen = true;
        Matter.Composite.rotate(this.bookcase, Math.PI / 2, {x: 150, y: 200});
    }

    update() {
        if(this.plungerPullForce > 0) this.plungerPullForce += 0.2;
        matterToThree(this.ballBody, this.ballMesh);
        matterToThree(this.leftFlipper, this.leftFlipperMesh);
        matterToThree(this.rightFlipper, this.rightFlipperMesh);
        matterToThree(this.plungerBody, this.plungerMesh);
        this.bumpers.forEach((bumper, i) => matterToThree(bumper, this.bumperMeshes[i]));
        this.slingshots.forEach((slingshot, i) => matterToThree(slingshot, this.slingshotMeshes[i]));
        this.books.forEach((book, i) => {
            if (this.bookMeshes[i]) matterToThree(book, this.bookMeshes[i]);
        });
    }
    
    destroy() {
         Matter.World.clear(this.engine.world, false);
         this.scene.clear();
    }
}

class Game {
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
        particlesJS('particles-js', {
          "particles": { "number": { "value": 80, "density": { "enable": true, "value_area": 800 } }, "color": { "value": "#ffffff" }, "shape": { "type": "circle", "stroke": { "width": 0, "color": "#000000" }, "polygon": { "nb_sides": 5 }, }, "opacity": { "value": 0.5, "random": false, "anim": { "enable": false, "speed": 1, "opacity_min": 0.1, "sync": false } }, "size": { "value": 3, "random": true, "anim": { "enable": false, "speed": 40, "size_min": 0.1, "sync": false } }, "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.4, "width": 1 }, "move": { "enable": true, "speed": 6, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false, "attract": { "enable": false, "rotateX": 600, "rotateY": 1200 } } }, "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" }, "resize": true }, "modes": { "grab": { "distance": 400, "line_linked": { "opacity": 1 } }, "bubble": { "distance": 400, "size": 40, "duration": 2, "opacity": 8, "speed": 3 }, "repulse": { "distance": 200, "duration": 0.4 }, "push": { "particles_nb": 4 }, "remove": { "particles_nb": 2 } } }, "retina_detect": true
        });
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
                } else if (other.label === 'bumper' || other.label === 'slingshot') {
                    this.updateScore(other.label === 'bumper' ? 100: 50);
                    const mesh = this.pinballTable.bumperMeshes.find(m => m.uuid === other.mesh_uuid) || this.pinballTable.slingshotMeshes.find(m => m.uuid === other.mesh_uuid);
                    if(mesh) mesh.material.color.setHex(Math.random() * 0xffffff);
                } else if (other.label === 'book') {
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
                }
            });
        });
    }

    animate() {
        if(this.lives > 0) Matter.Engine.update(this.engine);
        if(this.inMiniGame) this.miniTable.update();
        else this.pinballTable.update();
        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.animate());
    }
}

// Start the game
new Game();

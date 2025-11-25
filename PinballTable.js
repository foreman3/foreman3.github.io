import { TABLE_WIDTH, TABLE_HEIGHT, matterToThree } from './utils.js';
import { Ramp } from './Ramp.js';

export class PinballTable {
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
        this.createRamps();
        this.createDropTargets();
        this.createSpinner();
        this.createBookcase();
        this.createUpperPlayfield();
        
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
        
        this.skillShotTarget = Matter.Bodies.rectangle(plungerX, TABLE_HEIGHT - 300, 40, 20, {isStatic: true, isSensor: true, label: 'skillShot'});
        Matter.World.add(this.engine.world, [this.plungerBody, plungerConstraint, plungerStopper, this.skillShotTarget]);
        
        const plungerMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        this.plungerMesh = new THREE.Mesh(new THREE.BoxGeometry(20, 80, 10), plungerMaterial);
        this.scene.add(this.plungerMesh);

        const skillShotMaterial = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 0.5 });
        this.skillShotMesh = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 10), skillShotMaterial);
        this.scene.add(this.skillShotMesh);

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

    createRamps() {
        const leftRampVertices = [
            {x: 100, y: 500}, {x: 200, y: 400}, {x: 200, y: 300}, {x: 100, y: 200}
        ];
        const leftRampPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-350, 100, 0),
            new THREE.Vector3(-250, 200, 30),
            new THREE.Vector3(-250, 300, 30),
            new THREE.Vector3(-350, 400, 0),
        ]);
        this.leftRamp = new Ramp(this.engine, this.scene, leftRampVertices, {x: 150, y: 350}, leftRampPath);

        const rightRampVertices = [
            {x: 600, y: 500}, {x: 700, y: 400}, {x: 700, y: 300}, {x: 600, y: 200}
        ];
        const rightRampPath = new THREE.CatmullRomCurve3([
            new THREE.Vector3(250, 100, 0),
            new THREE.Vector3(150, 200, 30),
            new THREE.Vector3(150, 300, 30),
            new THREE.Vector3(250, 400, 0),
        ]);
        this.rightRamp = new Ramp(this.engine, this.scene, rightRampVertices, {x: 650, y: 350}, rightRampPath);
        this.rightRamp.onDetach = (ball) => {
            Matter.Body.setPosition(ball, {x: 650, y: 200});
        };
    }

    createDropTargets() {
        this.dropTargets = [];
        this.dropTargetMeshes = [];
        const targetOptions = { isStatic: true, label: 'dropTarget' };
        for (let i = 0; i < 3; i++) {
            const target = Matter.Bodies.rectangle(TABLE_WIDTH / 2 - 50 + i * 50, 600, 40, 20, targetOptions);
            this.dropTargets.push(target);
            Matter.World.add(this.engine.world, target);

            const targetMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
            const targetMesh = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 10), targetMaterial);
            this.dropTargetMeshes.push(targetMesh);
            this.scene.add(targetMesh);
        }
    }
    
    createSpinner() {
        this.spinner = Matter.Bodies.rectangle(TABLE_WIDTH - 150, 400, 20, 100, {label: 'spinner'});
        Matter.World.add(this.engine.world, this.spinner);
        const spinnerMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
        this.spinnerMesh = new THREE.Mesh(new THREE.BoxGeometry(20, 100, 10), spinnerMaterial);
        this.scene.add(this.spinnerMesh);
    }
    
    createBookcase() {
        this.books = [];
        this.bookMeshes = [];
        const bookOptions = { isStatic: true, label: 'book' };
        const bookcaseX = 150;
        const bookcaseY = 800;
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
    
    createUpperPlayfield() {
        const floor = Matter.Bodies.rectangle(650, 250, 200, 100, { isStatic: true });
        Matter.World.add(this.engine.world, floor);

        const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(200, 100, 10), new THREE.MeshStandardMaterial({color: 0x333333}));
        floorMesh.position.set(250, -350, 30);
        this.scene.add(floorMesh);

        this.upperFlipper = Matter.Bodies.rectangle(700, 300, 100, 15, {restitution: 0.5, friction: 1, density: 0.01});
        const upperFlipperPivot = Matter.Bodies.circle(650, 300, 5, {isStatic: true});
        const upperFlipperConstraint = Matter.Constraint.create({bodyA: this.upperFlipper, bodyB: upperFlipperPivot, stiffness: 0.1, length: 0});
        Matter.World.add(this.engine.world, [this.upperFlipper, upperFlipperPivot, upperFlipperConstraint]);
        
        this.upperFlipperMesh = new THREE.Mesh(new THREE.BoxGeometry(100, 15, 10), new THREE.MeshStandardMaterial({color: 0xff4500}));
        this.scene.add(this.upperFlipperMesh);

        this.upperTargets = [];
        this.upperTargetMeshes = [];
        for (let i = 0; i < 3; i++) {
            const target = Matter.Bodies.rectangle(600 + i * 50, 200, 40, 20, {isStatic: true, label: 'upperTarget'});
            this.upperTargets.push(target);
            Matter.World.add(this.engine.world, target);
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(40, 20, 10), new THREE.MeshStandardMaterial({color: 0x00ff00}));
            this.upperTargetMeshes.push(mesh);
            this.scene.add(mesh);
        }
    }

    addControls() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') {
                Matter.Body.setAngularVelocity(this.leftFlipper, -Math.PI * 0.05);
            } else if (event.key === 'ArrowRight') {
                Matter.Body.setAngularVelocity(this.rightFlipper, Math.PI * 0.05);
            } else if (event.key === 'Shift') {
                Matter.Body.setAngularVelocity(this.upperFlipper, -Math.PI * 0.05);
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === 'ArrowLeft') {
                Matter.Body.setAngularVelocity(this.leftFlipper, Math.PI * 0.03);
            } else if (event.key === 'ArrowRight') {
                Matter.Body.setAngularVelocity(this.rightFlipper, -Math.PI * 0.03);
            } else if (event.key === 'Shift') {
                Matter.Body.setAngularVelocity(this.upperFlipper, Math.PI * 0.03);
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
        Matter.Composite.rotate(this.bookcase, Math.PI / 2, {x: 150, y: 800});
    }

    update() {
        if(this.plungerPullForce > 0) this.plungerPullForce += 0.2;
        this.leftRamp.update();
        this.rightRamp.update();
        matterToThree(this.ballBody, this.ballMesh);
        matterToThree(this.leftFlipper, this.leftFlipperMesh);
        matterToThree(this.rightFlipper, this.rightFlipperMesh);
        matterToThree(this.upperFlipper, this.upperFlipperMesh);
        matterToThree(this.plungerBody, this.plungerMesh);
        this.bumpers.forEach((bumper, i) => matterToThree(bumper, this.bumperMeshes[i]));
        this.slingshots.forEach((slingshot, i) => matterToThree(slingshot, this.slingshotMeshes[i]));
        this.dropTargets.forEach((target, i) => {
            if (this.dropTargetMeshes[i]) matterToThree(target, this.dropTargetMeshes[i]);
        });
        this.upperTargets.forEach((target, i) => {
            if (this.upperTargetMeshes[i]) matterToThree(target, this.upperTargetMeshes[i]);
        });
        matterToThree(this.spinner, this.spinnerMesh);
        matterToThree(this.skillShotTarget, this.skillShotMesh);
        this.bookcase.bodies.forEach((book, i) => {
            if (this.bookMeshes[i]) {
                matterToThree(book, this.bookMeshes[i]);
            }
        });
    }
    
    destroy() {
         Matter.World.clear(this.engine.world, false);
         this.scene.clear();
    }
}
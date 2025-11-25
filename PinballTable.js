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
        // ... (same as before)
    }
    
    createFlippers() {
        // ... (same as before)
    }

    createBall() {
        // ... (same as before)
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
        // ... (same as before)
    }

    createSlingshots() {
        // ... (same as before)
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
        // ... (same as before)
    }
    
    createSpinner() {
        // ... (same as before)
    }
    
    createBookcase() {
        // ... (same as before)
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
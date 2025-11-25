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
        this.createSaucer();
        this.createRolloverLanes();
        
        this.addControls();
    }

    createTable() {
        const wallOptions = { isStatic: true, render: { fillStyle: '#1a2a3a' } };
        
        const walls = [
            // Outer walls
            Matter.Bodies.rectangle(TABLE_WIDTH / 2, -10, TABLE_WIDTH, 20, wallOptions), // Top
            Matter.Bodies.rectangle(TABLE_WIDTH / 2, TABLE_HEIGHT + 10, TABLE_WIDTH, 20, wallOptions), // Bottom
            Matter.Bodies.rectangle(-10, TABLE_HEIGHT / 2, 20, TABLE_HEIGHT, wallOptions), // Left
            Matter.Bodies.rectangle(TABLE_WIDTH + 10, TABLE_HEIGHT / 2, 20, TABLE_HEIGHT, wallOptions), // Right
            // Plunger lane
            Matter.Bodies.rectangle(TABLE_WIDTH - 40, TABLE_HEIGHT - 350, 20, 700, wallOptions),
        ];

        this.drain = Matter.Bodies.rectangle(TABLE_WIDTH / 2, TABLE_HEIGHT - 20, TABLE_WIDTH / 2, 20, {isStatic: true, isSensor: true, label: 'drain'});
        this.tunnel = Matter.Bodies.rectangle(150, 150, 100, 50, {isStatic: true, isSensor: true, label: 'tunnel'});

        Matter.World.add(this.engine.world, [...walls, this.drain, this.tunnel]);

        const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3e50, metalness: 0.7, roughness: 0.2 });
        const wallMeshes = walls.map(wall => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(wall.bounds.max.x - wall.bounds.min.x, wall.bounds.max.y - wall.bounds.min.y, 100), wallMaterial);
            this.scene.add(mesh);
            return mesh;
        });
        
        const backgroundGeometry = new THREE.PlaneGeometry(TABLE_WIDTH, TABLE_HEIGHT);
        const backgroundMaterial = new THREE.MeshStandardMaterial({map: new THREE.TextureLoader().load('https://www.transparenttextures.com/patterns/old-map.png'), color: 0x9a7d5a});
        const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
        backgroundMesh.position.z = -50;
        this.scene.add(backgroundMesh);
    }
    
    createFlippers() {
        const flipperOptions = { restitution: 0.5, friction: 1, density: 0.01 };
        
        this.leftFlipper = Matter.Bodies.rectangle(TABLE_WIDTH/2 - 100, TABLE_HEIGHT - 150, 120, 20, flipperOptions);
        const leftFlipperPivot = Matter.Bodies.circle(this.leftFlipper.position.x - 60, this.leftFlipper.position.y, 5, { isStatic: true });
        this.leftFlipperConstraint = Matter.Constraint.create({ bodyA: this.leftFlipper, bodyB: leftFlipperPivot, stiffness: 0.1, length: 0 });
        
        this.rightFlipper = Matter.Bodies.rectangle(TABLE_WIDTH/2 + 100, TABLE_HEIGHT - 150, 120, 20, flipperOptions);
        const rightFlipperPivot = Matter.Bodies.circle(this.rightFlipper.position.x + 60, this.rightFlipper.position.y, 5, { isStatic: true });
        this.rightFlipperConstraint = Matter.Constraint.create({ bodyA: this.rightFlipper, bodyB: rightFlipperPivot, stiffness: 0.1, length: 0 });
        
        Matter.World.add(this.engine.world, [this.leftFlipper, leftFlipperPivot, this.leftFlipperConstraint, this.rightFlipper, rightFlipperPivot, this.rightFlipperConstraint]);

        const flipperMaterial = new THREE.MeshStandardMaterial({ color: 0xff4500, metalness: 0.8, roughness: 0.2 });
        this.leftFlipperMesh = new THREE.Mesh(new THREE.BoxGeometry(120, 20, 15), flipperMaterial);
        this.rightFlipperMesh = new THREE.Mesh(new THREE.BoxGeometry(120, 20, 15), flipperMaterial);
        this.scene.add(this.leftFlipperMesh);
        this.scene.add(this.rightFlipperMesh);
    }

    createBall() {
        this.ballBody = Matter.Bodies.circle(TABLE_WIDTH - 70, TABLE_HEIGHT - 100, 15, { restitution: 0.8, friction: 0.01, label: 'ball' });
        Matter.World.add(this.engine.world, this.ballBody);

        const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1, emissive: 0x999900 });
        this.ballMesh = new THREE.Mesh(new THREE.SphereGeometry(15, 32, 32), ballMaterial);
        this.scene.add(this.ballMesh);
    }

    createPlunger() {
        const plungerX = TABLE_WIDTH - 70;
        this.plungerBody = Matter.Bodies.rectangle(plungerX, TABLE_HEIGHT - 50, 20, 80, { isStatic: false, label: 'plunger' });
        const plungerConstraint = Matter.Constraint.create({ bodyA: this.plungerBody, pointB: { x: plungerX, y: TABLE_HEIGHT }, stiffness: 0.05 });
        const plungerStopper = Matter.Bodies.rectangle(plungerX, TABLE_HEIGHT - 100, 40, 20, {isStatic: true});
        
        this.skillShotTarget = Matter.Bodies.rectangle(plungerX, TABLE_HEIGHT - 400, 40, 20, {isStatic: true, isSensor: true, label: 'skillShot'});
        Matter.World.add(this.engine.world, [this.plungerBody, plungerConstraint, plungerStopper, this.skillShotTarget]);
        
        const plungerMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        this.plungerMesh = new THREE.Mesh(new THREE.BoxGeometry(20, 80, 10), plungerMaterial);
        this.scene.add(this.plungerMesh);

        const skillShotMaterial = new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 0.8 });
        this.skillShotMesh = new THREE.Mesh(new THREE.TorusGeometry( 20, 5, 16, 100 ), skillShotMaterial);
        this.scene.add(this.skillShotMesh);

        this.plungerPullForce = 0;
    }
    
    createBumpers() {
        const bumperOptions = { isStatic: true, restitution: 1.5, label: 'bumper' };
        this.bumpers = [
            Matter.Bodies.circle(TABLE_WIDTH / 2, 400, 30, bumperOptions),
            Matter.Bodies.circle(TABLE_WIDTH / 2 - 100, 500, 25, bumperOptions),
            Matter.Bodies.circle(TABLE_WIDTH / 2 + 100, 500, 25, bumperOptions)
        ];
        Matter.World.add(this.engine.world, this.bumpers);

        const bumperMaterial = new THREE.MeshStandardMaterial({ color: 0x00ffff, metalness: 0.7, roughness: 0.2, emissive: 0x00ffff, emissiveIntensity: 0.5 });
        this.bumperMeshes = this.bumpers.map((bumper, i) => {
            const radius = bumper.circleRadius;
            const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 30, 32), bumperMaterial);
            const light = new THREE.PointLight(0x00ffff, 0, 50);
            mesh.add(light);
            bumper.light = light;
            this.scene.add(mesh);
            return mesh;
        });
    }

    createSlingshots() {
        const slingshotOptions = { isStatic: true, restitution: 1.5, label: 'slingshot' };
        
        const leftSlingshotVertices = [ {x: 100, y: 800}, {x: 200, y: 750}, {x: 100, y: 700} ];
        this.leftSlingshot = Matter.Bodies.fromVertices(133, 750, [leftSlingshotVertices], slingshotOptions);
        
        const rightSlingshotVertices = [ {x: 700, y: 800}, {x: 600, y: 750}, {x: 700, y: 700} ];
        this.rightSlingshot = Matter.Bodies.fromVertices(666, 750, [rightSlingshotVertices], slingshotOptions);

        Matter.World.add(this.engine.world, [this.leftSlingshot, this.rightSlingshot]);

        const slingshotMaterial = new THREE.MeshStandardMaterial({ color: 0xff1493, emissive: 0xff1493, emissiveIntensity: 0.5 });
        
        const leftSlingshotShape = new THREE.Shape();
        leftSlingshotShape.moveTo(leftSlingshotVertices[0].x - 133, -(leftSlingshotVertices[0].y - 750));
        leftSlingshotShape.lineTo(leftSlingshotVertices[1].x - 133, -(leftSlingshotVertices[1].y - 750));
        leftSlingshotShape.lineTo(leftSlingshotVertices[2].x - 133, -(leftSlingshotVertices[2].y - 750));
        this.leftSlingshotMesh = new THREE.Mesh(new THREE.ShapeGeometry(leftSlingshotShape), slingshotMaterial);
        this.leftSlingshotMesh.position.set(-267, -350, 0);
        this.scene.add(this.leftSlingshotMesh);

        const rightSlingshotShape = new THREE.Shape();
        rightSlingshotShape.moveTo(rightSlingshotVertices[0].x - 666, -(rightSlingshotVertices[0].y-750));
        rightSlingshotShape.lineTo(rightSlingshotVertices[1].x - 666, -(rightSlingshotVertices[1].y-750));
        rightSlingshotShape.lineTo(rightSlingshotVertices[2].x - 666, -(rightSlingshotVertices[2].y-750));
        this.rightSlingshotMesh = new THREE.Mesh(new THREE.ShapeGeometry(rightSlingshotShape), slingshotMaterial);
        this.rightSlingshotMesh.position.set(266, -350, 0);
        this.scene.add(this.rightSlingshotMesh);
    }

    createRamps() {
        const leftRampVertices = [ {x: 100, y: 500}, {x: 200, y: 400}, {x: 200, y: 300}, {x: 100, y: 200} ];
        const leftRampPath = new THREE.CatmullRomCurve3([ new THREE.Vector3(-350, 100, 0), new THREE.Vector3(-250, 200, 30), new THREE.Vector3(-250, 300, 30), new THREE.Vector3(-350, 400, 0), ]);
        this.leftRamp = new Ramp(this.engine, this.scene, leftRampVertices, {x: 150, y: 350}, leftRampPath);

        const rightRampVertices = [ {x: 600, y: 500}, {x: 700, y: 400}, {x: 700, y: 300}, {x: 600, y: 200} ];
        const rightRampPath = new THREE.CatmullRomCurve3([ new THREE.Vector3(250, 100, 0), new THREE.Vector3(150, 200, 30), new THREE.Vector3(150, 300, 30), new THREE.Vector3(250, 400, 0), ]);
        this.rightRamp = new Ramp(this.engine, this.scene, rightRampVertices, {x: 650, y: 350}, rightRampPath);
        this.rightRamp.onDetach = (ball) => { Matter.Body.setPosition(ball, {x: 650, y: 200}); };
    }

    createDropTargets() {
        this.dropTargets = [];
        this.dropTargetMeshes = [];
        const targetOptions = { isStatic: true, label: 'dropTarget' };
        for (let i = 0; i < 3; i++) {
            const target = Matter.Bodies.rectangle(TABLE_WIDTH / 2 - 80 + i * 80, 700, 60, 20, targetOptions);
            this.dropTargets.push(target);
            Matter.World.add(this.engine.world, target);

            const targetMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x00ff00 });
            const targetMesh = new THREE.Mesh(new THREE.BoxGeometry(60, 20, 15), targetMaterial);
            const light = new THREE.PointLight(0x00ff00, 1, 100);
            target.light = light;
            targetMesh.add(light);
            this.dropTargetMeshes.push(targetMesh);
            this.scene.add(targetMesh);
        }
    }
    
    createSpinner() {
        this.spinner = Matter.Bodies.rectangle(TABLE_WIDTH - 150, 500, 20, 120, {label: 'spinner', frictionAir: 0.1});
        Matter.World.add(this.engine.world, this.spinner);
        const spinnerMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00, metalness: 0.8, roughness: 0.2 });
        this.spinnerMesh = new THREE.Mesh(new THREE.BoxGeometry(20, 120, 10), spinnerMaterial);
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
    
    createSaucer() {
        this.saucer = Matter.Bodies.circle(150, 300, 30, {isStatic: true, isSensor: true, label: 'saucer'});
        Matter.World.add(this.engine.world, this.saucer);

        const saucerMaterial = new THREE.MeshStandardMaterial({color: 0x9932CC, emissive: 0x9932CC, emissiveIntensity: 0.6});
        this.saucerMesh = new THREE.Mesh(new THREE.TorusGeometry(30, 8, 16, 100), saucerMaterial);
        this.saucerMesh.rotation.x = Math.PI / 2;
        this.scene.add(this.saucerMesh);
    }

    createRolloverLanes() {
        this.rolloverLanes = [];
        this.rolloverLaneMeshes = [];
        for (let i = 0; i < 4; i++) {
            const lane = Matter.Bodies.rectangle(300 + i * 50, 150, 10, 80, {isStatic: true, isSensor: true, label: 'rollover'});
            this.rolloverLanes.push(lane);
            Matter.World.add(this.engine.world, lane);
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(10, 80, 5), new THREE.MeshStandardMaterial({color: 0xffa500, transparent: true, opacity: 0.5}));
            const light = new THREE.PointLight(0xffa500, 0, 50);
            mesh.add(light);
            lane.light = light;
            this.rolloverLaneMeshes.push(mesh);
            this.scene.add(mesh);
        }
    }

    addControls() {
        document.addEventListener('keydown', (event) => {
            if (event.key === 'ArrowLeft') {
                Matter.Body.setAngularVelocity(this.leftFlipper, -Math.PI * 0.1);
            } else if (event.key === 'ArrowRight') {
                Matter.Body.setAngularVelocity(this.rightFlipper, Math.PI * 0.1);
            } else if (event.key === 'Shift') {
                Matter.Body.setAngularVelocity(this.upperFlipper, -Math.PI * 0.05);
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.key === 'ArrowLeft') {
                Matter.Body.setAngularVelocity(this.leftFlipper, 0.2); // Apply a force to return to initial position
            } else if (event.key === 'ArrowRight') {
                Matter.Body.setAngularVelocity(this.rightFlipper, -0.2); // Apply a force to return to initial position
            } else if (event.key === 'Shift') {
                Matter.Body.setAngularVelocity(this.upperFlipper, 0.2); // Apply a force to return to initial position
            }
        });
        
        const plungerElement = this.game.renderer.domElement;
        plungerElement.addEventListener('mousedown', () => { this.plungerPulling = true; });
        plungerElement.addEventListener('mouseup', () => {
             this.plungerPulling = false;
             Matter.Body.applyForce(this.plungerBody, this.plungerBody.position, {x: 0, y: -this.plungerPullForce / 50});
             this.plungerPullForce = 0;
        });
    }
    
    openBookcase() {
        if(this.bookcaseOpen) return;
        this.bookcaseOpen = true;
        Matter.Composite.rotate(this.bookcase, Math.PI / 2, {x: 150, y: 800});
    }

    update() {
        if(this.plungerPulling) this.plungerPullForce += 1;
        this.leftRamp.update();
        this.rightRamp.update();
        matterToThree(this.ballBody, this.ballMesh);
        matterToThree(this.leftFlipper, this.leftFlipperMesh);
        matterToThree(this.rightFlipper, this.rightFlipperMesh);
        matterToThree(this.upperFlipper, this.upperFlipperMesh);
        matterToThree(this.plungerBody, this.plungerMesh);
        this.bumpers.forEach((bumper, i) => {
            matterToThree(bumper, this.bumperMeshes[i]);
            bumper.light.intensity *= 0.95; // fade out light
        });
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
        matterToThree(this.saucer, this.saucerMesh);
        this.rolloverLanes.forEach((lane, i) => {
            matterToThree(lane, this.rolloverLaneMeshes[i]);
            if (lane.light) lane.light.intensity *= 0.95;
        });
    }
    
    destroy() {
         Matter.World.clear(this.engine.world, false);
         this.scene.clear();
    }
}
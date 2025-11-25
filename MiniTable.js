import { TABLE_WIDTH, TABLE_HEIGHT, matterToThree } from './utils.js';

export class MiniTable {
    constructor(engine, scene, game) {
        this.engine = engine;
        this.scene = scene;
        this.game = game;
        this.elements = [];
        this.createMiniTable();
        this.createBall();
        this.createFlippers();
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
        this.drain = Matter.Bodies.rectangle(miniTableX, miniTableY + 180, 200, 20, {isStatic: true, isSensor: true, label: 'miniDrain'});
        Matter.World.add(this.engine.world, [...this.walls, this.pyramid, this.drain]);

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
        this.ballBody = Matter.Bodies.circle(TABLE_WIDTH / 2, TABLE_HEIGHT/2 - 150, 10, { restitution: 0.9, label: 'mini-ball' });
        Matter.Body.setVelocity(this.ballBody, {x: 0, y: 15});
        Matter.World.add(this.engine.world, this.ballBody);

        const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
        this.ballMesh = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 32), ballMaterial);
        this.scene.add(this.ballMesh);
    }

    createFlippers() {
        const flipperOptions = { restitution: 0.5, friction: 1, density: 0.01 };
        
        this.leftFlipper = Matter.Bodies.rectangle(TABLE_WIDTH/2 - 70, TABLE_HEIGHT/2 + 150, 100, 15, flipperOptions);
        const leftFlipperPivot = Matter.Bodies.circle(this.leftFlipper.position.x - 50, this.leftFlipper.position.y, 5, { isStatic: true });
        this.leftFlipperConstraint = Matter.Constraint.create({ bodyA: this.leftFlipper, bodyB: leftFlipperPivot, stiffness: 0.1, length: 0 });
        
        this.rightFlipper = Matter.Bodies.rectangle(TABLE_WIDTH/2 + 70, TABLE_HEIGHT/2 + 150, 100, 15, flipperOptions);
        const rightFlipperPivot = Matter.Bodies.circle(this.rightFlipper.position.x + 50, this.rightFlipper.position.y, 5, { isStatic: true });
        this.rightFlipperConstraint = Matter.Constraint.create({ bodyA: this.rightFlipper, bodyB: rightFlipperPivot, stiffness: 0.1, length: 0 });
        
        Matter.World.add(this.engine.world, [this.leftFlipper, leftFlipperPivot, this.leftFlipperConstraint, this.rightFlipper, rightFlipperPivot, this.rightFlipperConstraint]);

        const flipperMaterial = new THREE.MeshStandardMaterial({ color: 0xff4500, metalness: 0.6, roughness: 0.3 });
        this.leftFlipperMesh = new THREE.Mesh(new THREE.BoxGeometry(100, 15, 10), flipperMaterial);
        this.rightFlipperMesh = new THREE.Mesh(new THREE.BoxGeometry(100, 15, 10), flipperMaterial);
        this.scene.add(this.leftFlipperMesh);
        this.scene.add(this.rightFlipperMesh);
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
    }

    update() {
        matterToThree(this.ballBody, this.ballMesh);
        matterToThree(this.leftFlipper, this.leftFlipperMesh);
        matterToThree(this.rightFlipper, this.rightFlipperMesh);
        this.walls.forEach((wall, i) => matterToThree(wall, this.wallMeshes[i]));
        matterToThree(this.pyramid, this.pyramidMesh);
    }
    
    destroy() {
        Matter.World.clear(this.engine.world, false);
        this.scene.remove(this.ballMesh, this.leftFlipperMesh, this.rightFlipperMesh, ...this.wallMeshes, this.pyramidMesh);
    }
}
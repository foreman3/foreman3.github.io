import { TABLE_WIDTH, TABLE_HEIGHT, matterToThree } from './utils.js';

export class MiniTable {
    constructor(engine, scene, game, theme) {
        this.engine = engine;
        this.scene = scene;
        this.game = game;
        this.theme = theme;
        this.elements = [];
        this.createMiniTable();
        this.createBall();
        this.createFlippers();
        this.addControls();
    }

    createMiniTable() {
        const miniTableX = TABLE_WIDTH / 2;
        const miniTableY = TABLE_HEIGHT / 2;
        let wallColor, floorColor;

        switch (this.theme) {
            case 'egypt': wallColor = 0xc2b280; floorColor = 0xf0e68c; break;
            case 'atlantis': wallColor = 0x0077be; floorColor = 0x00ffff; break;
            case 'jungle': wallColor = 0x228b22; floorColor = 0x32cd32; break;
            case 'pirate': wallColor = 0x8b4513; floorColor = 0xdeb887; break;
            case 'space': wallColor = 0x4b0082; floorColor = 0x000000; break;
            default: wallColor = 0xffffff; floorColor = 0xcccccc;
        }

        const wallOptions = { isStatic: true, render: { fillStyle: '#' + wallColor.toString(16) } };

        this.walls = [
            Matter.Bodies.rectangle(miniTableX, miniTableY - 200, 400, 20, wallOptions),
            Matter.Bodies.rectangle(miniTableX, miniTableY + 200, 400, 20, wallOptions),
            Matter.Bodies.rectangle(miniTableX - 200, miniTableY, 20, 400, wallOptions),
            Matter.Bodies.rectangle(miniTableX + 200, miniTableY, 20, 400, wallOptions),
        ];

        this.drain = Matter.Bodies.rectangle(miniTableX, miniTableY + 180, 200, 20, { isStatic: true, isSensor: true, label: 'miniDrain' });

        this.obstacles = [];
        this.obstacleMeshes = [];

        if (this.theme === 'egypt') {
            this.target = Matter.Bodies.rectangle(miniTableX, miniTableY - 100, 60, 60, { isStatic: true, label: 'pyramid' });
            this.obstacles.push(this.target);
            const mesh = new THREE.Mesh(new THREE.ConeGeometry(40, 60, 4), new THREE.MeshStandardMaterial({ color: 0xffd700 }));
            mesh.position.set(0, 0, 0); // Position handled in update
            this.obstacleMeshes.push(mesh);
        } else if (this.theme === 'atlantis') {
            this.target = Matter.Bodies.circle(miniTableX, miniTableY - 100, 30, { isStatic: true, label: 'pyramid' }); // Reusing label for win condition
            this.obstacles.push(this.target);
            const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(30, 0), new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 0.5 }));
            this.obstacleMeshes.push(mesh);

            // Obstacles
            const obs1 = Matter.Bodies.circle(miniTableX - 100, miniTableY, 20, { isStatic: true, restitution: 1.2 });
            const obs2 = Matter.Bodies.circle(miniTableX + 100, miniTableY, 20, { isStatic: true, restitution: 1.2 });
            this.obstacles.push(obs1, obs2);
            this.obstacleMeshes.push(
                new THREE.Mesh(new THREE.SphereGeometry(20), new THREE.MeshStandardMaterial({ color: 0x0000ff })),
                new THREE.Mesh(new THREE.SphereGeometry(20), new THREE.MeshStandardMaterial({ color: 0x0000ff }))
            );
        } else if (this.theme === 'jungle') {
            this.target = Matter.Bodies.rectangle(miniTableX, miniTableY - 150, 50, 50, { isStatic: true, label: 'pyramid' });
            this.obstacles.push(this.target);
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(50, 50, 50), new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
            this.obstacleMeshes.push(mesh);

            // Bumper trees
            for (let i = 0; i < 3; i++) {
                const x = miniTableX - 100 + i * 100;
                const y = miniTableY - 50 + (i % 2) * 50;
                const tree = Matter.Bodies.circle(x, y, 15, { isStatic: true, restitution: 1.5 });
                this.obstacles.push(tree);
                this.obstacleMeshes.push(new THREE.Mesh(new THREE.CylinderGeometry(5, 15, 40), new THREE.MeshStandardMaterial({ color: 0x8b4513 })));
            }
        } else if (this.theme === 'pirate') {
            this.target = Matter.Bodies.rectangle(miniTableX, miniTableY - 120, 80, 50, { isStatic: true, label: 'pyramid' });
            this.obstacles.push(this.target);
            this.obstacleMeshes.push(new THREE.Mesh(new THREE.BoxGeometry(80, 50, 40), new THREE.MeshStandardMaterial({ color: 0x8b0000 })));

            // Pegs
            for (let i = 0; i < 5; i++) {
                const peg = Matter.Bodies.circle(miniTableX + (Math.random() - 0.5) * 200, miniTableY + (Math.random() - 0.5) * 200, 5, { isStatic: true, restitution: 0.5 });
                this.obstacles.push(peg);
                this.obstacleMeshes.push(new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 20), new THREE.MeshStandardMaterial({ color: 0xaaaaaa })));
            }
        } else if (this.theme === 'space') {
            this.target = Matter.Bodies.circle(miniTableX, miniTableY - 100, 25, { isStatic: true, label: 'pyramid', isSensor: true });
            this.obstacles.push(this.target);
            this.obstacleMeshes.push(new THREE.Mesh(new THREE.TorusKnotGeometry(15, 5), new THREE.MeshStandardMaterial({ color: 0xff00ff, wireframe: true })));

            // Gravity well? Just visual for now, maybe add force in update
        }

        Matter.World.add(this.engine.world, [...this.walls, this.drain, ...this.obstacles]);

        const wallMaterial = new THREE.MeshStandardMaterial({ color: wallColor });
        this.wallMeshes = this.walls.map(wall => {
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(wall.bounds.max.x - wall.bounds.min.x, wall.bounds.max.y - wall.bounds.min.y, 20), wallMaterial);
            this.scene.add(mesh);
            return mesh;
        });

        this.obstacleMeshes.forEach(mesh => this.scene.add(mesh));
    }

    createBall() {
        this.ballBody = Matter.Bodies.circle(TABLE_WIDTH / 2, TABLE_HEIGHT / 2 + 100, 10, { restitution: 0.9, label: 'mini-ball' });
        Matter.Body.setVelocity(this.ballBody, { x: (Math.random() - 0.5) * 10, y: -15 });
        Matter.World.add(this.engine.world, this.ballBody);

        const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
        this.ballMesh = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 32), ballMaterial);
        this.scene.add(this.ballMesh);
    }

    createFlippers() {
        const flipperOptions = { restitution: 0.5, friction: 1, density: 0.01 };

        this.leftFlipper = Matter.Bodies.rectangle(TABLE_WIDTH / 2 - 70, TABLE_HEIGHT / 2 + 150, 100, 15, flipperOptions);
        const leftFlipperPivot = Matter.Bodies.circle(this.leftFlipper.position.x - 50, this.leftFlipper.position.y, 5, { isStatic: true });
        this.leftFlipperConstraint = Matter.Constraint.create({ bodyA: this.leftFlipper, bodyB: leftFlipperPivot, stiffness: 0.1, length: 0 });

        this.rightFlipper = Matter.Bodies.rectangle(TABLE_WIDTH / 2 + 70, TABLE_HEIGHT / 2 + 150, 100, 15, flipperOptions);
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
        this.keydownHandler = (event) => {
            if (event.key === 'ArrowLeft') {
                Matter.Body.setAngularVelocity(this.leftFlipper, -Math.PI * 0.05);
            } else if (event.key === 'ArrowRight') {
                Matter.Body.setAngularVelocity(this.rightFlipper, Math.PI * 0.05);
            }
        };

        this.keyupHandler = (event) => {
            if (event.key === 'ArrowLeft') {
                Matter.Body.setAngularVelocity(this.leftFlipper, Math.PI * 0.03);
            } else if (event.key === 'ArrowRight') {
                Matter.Body.setAngularVelocity(this.rightFlipper, -Math.PI * 0.03);
            }
        };

        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
    }

    update() {
        matterToThree(this.ballBody, this.ballMesh);
        matterToThree(this.leftFlipper, this.leftFlipperMesh);
        matterToThree(this.rightFlipper, this.rightFlipperMesh);
        this.walls.forEach((wall, i) => matterToThree(wall, this.wallMeshes[i]));
        this.obstacles.forEach((obs, i) => {
            if (this.obstacleMeshes[i]) matterToThree(obs, this.obstacleMeshes[i]);
        });

        if (this.theme === 'space') {
            // Simple gravity well effect towards center
            const dx = TABLE_WIDTH / 2 - this.ballBody.position.x;
            const dy = TABLE_HEIGHT / 2 - this.ballBody.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 150) {
                Matter.Body.applyForce(this.ballBody, this.ballBody.position, { x: dx * 0.00001, y: dy * 0.00001 });
            }
            this.obstacleMeshes[0].rotation.x += 0.05;
            this.obstacleMeshes[0].rotation.y += 0.05;
        }
    }

    destroy() {
        Matter.World.clear(this.engine.world, false);
        this.scene.remove(this.ballMesh, this.leftFlipperMesh, this.rightFlipperMesh, ...this.wallMeshes, ...this.obstacleMeshes);
        document.removeEventListener('keydown', this.keydownHandler);
        document.removeEventListener('keyup', this.keyupHandler);
    }
}
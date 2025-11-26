export class MainTable extends Phaser.Scene {
    constructor() {
        super({ key: 'MainTable' });
    }

    preload() {
        // Load assets here (images, sounds)
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });

        // Red texture for particles
        graphics.fillStyle(0xff0000, 1);
        graphics.fillCircle(5, 5, 5);
        graphics.generateTexture('red', 10, 10);
        graphics.clear();

        // Yellow texture for ball
        graphics.fillStyle(0xffd700, 1);
        graphics.fillCircle(10, 10, 10);
        graphics.generateTexture('ball', 20, 20);
    }

    create() {
        this.matter.world.setBounds(0, 0, 600, 800);
        this.matter.world.setGravity(0, 1);

        // Launch UI scene in parallel
        this.scene.launch('UI');

        // Initialize Game State
        this.registry.set('score', 0);
        this.registry.set('lives', 3);
        this.registry.set('clues', 0);
        this.registry.set('items', []);
        this.registry.set('mission', 'None');

        this.missions = [
            { id: 'egypt', name: "Pharaoh's Tomb", item: 'Scepter', unlockClues: 3 },
            { id: 'atlantis', name: "Lost City", item: 'Trident', unlockClues: 4 },
            { id: 'jungle', name: "Jungle Temple", item: 'Idol', unlockClues: 5 },
            { id: 'pirate', name: "Pirate Cove", item: 'Chest', unlockClues: 3 },
            { id: 'space', name: "Alien Base", item: 'Artifact', unlockClues: 6 }
        ];
        this.availableMissions = [...this.missions];
        this.startNextMission();

        // Basic setup
        this.createTable();
        this.createFlippers();
        this.createBall();
        this.createPlunger();
        this.createGameElements();
        this.createMissionElements();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    createTable() {
        // Walls
        const wallOptions = { isStatic: true, render: { fillColor: 0x2c3e50 } };

        // Left Wall
        this.matter.add.rectangle(10, 400, 20, 800, wallOptions);
        // Right Wall
        this.matter.add.rectangle(590, 400, 20, 800, wallOptions);
        // Top Wall
        this.matter.add.rectangle(300, 10, 600, 20, wallOptions);

        // Plunger Lane Divider
        this.matter.add.rectangle(550, 600, 10, 400, wallOptions);

        // Top Curve (Simplified)
        this.matter.add.fromVertices(560, 50, [
            { x: 0, y: 0 }, { x: 40, y: 40 }, { x: 0, y: 80 }
        ], { isStatic: true, render: { fillColor: 0x2c3e50 } });
    }

    createPlunger() {
        this.plunger = this.matter.add.rectangle(570, 780, 20, 40, { isStatic: true, label: 'plunger' });
    }

    createFlippers() {
        const flipperOptions = {
            isStatic: false,
            density: 0.1 // Heavy enough to hit ball
        };

        // Left Flipper
        this.leftFlipper = this.matter.add.rectangle(200, 700, 120, 20, flipperOptions);
        this.matter.add.worldConstraint(this.leftFlipper, 0, 1, {
            pointA: { x: 150, y: 680 },
            pointB: { x: -50, y: 0 }
        });

        // Right Flipper
        this.rightFlipper = this.matter.add.rectangle(400, 700, 120, 20, flipperOptions);
        this.matter.add.worldConstraint(this.rightFlipper, 0, 1, {
            pointA: { x: 450, y: 680 },
            pointB: { x: 50, y: 0 }
        });
    }

    createGameElements() {
        // Bumpers
        const bumperOptions = { isStatic: true, label: 'bumper', render: { fillColor: 0x00ffff } };
        this.bumpers = [
            this.matter.add.circle(300, 250, 25, bumperOptions),
            this.matter.add.circle(200, 350, 25, bumperOptions),
            this.matter.add.circle(400, 350, 25, bumperOptions)
        ];

        // Slingshots
        const slingshotOptions = { isStatic: true, label: 'slingshot', render: { fillColor: 0xff1493 } };
        this.matter.add.fromVertices(180, 600, [{ x: 0, y: 0 }, { x: 40, y: 20 }, { x: 0, y: 80 }], slingshotOptions);
        this.matter.add.fromVertices(420, 600, [{ x: 0, y: 0 }, { x: -40, y: 20 }, { x: 0, y: 80 }], slingshotOptions);
    }

    createMissionElements() {
        // Bookcase (Target Bank)
        this.books = [];
        for (let i = 0; i < 5; i++) {
            const book = this.matter.add.rectangle(150 + i * 20, 500, 15, 40, { isStatic: true, label: 'book', render: { fillColor: 0x8b4513 } });
            this.books.push(book);
        }

        // Tunnel (Sensor)
        this.tunnel = this.matter.add.rectangle(190, 450, 80, 40, { isStatic: true, isSensor: true, label: 'tunnel', render: { fillColor: 0x000000 } });

        // Gate (Visual/Blocker)
        this.gate = this.matter.add.rectangle(190, 500, 100, 10, { isStatic: true, label: 'gate', render: { fillColor: 0x555555 } });
    }

    handleCollision(body) {
        if (body.label === 'bumper') {
            this.registry.values.score += 100;
        } else if (body.label === 'slingshot') {
            this.registry.values.score += 50;
        } else if (body.label === 'book') {
            this.registry.values.score += 200;
            this.collectClue();
        } else if (body.label === 'tunnel') {
            if (this.tunnelOpen) {
                this.scene.start('MiniTable', { theme: this.activeMission.id });
            }
        }
    }

    startNextMission() {
        if (this.availableMissions.length === 0) {
            this.registry.set('mission', 'All Treasures Found!');
            return;
        }
        const index = Math.floor(Math.random() * this.availableMissions.length);
        this.activeMission = this.availableMissions.splice(index, 1)[0];
        this.registry.set('mission', this.activeMission.name);
        this.registry.set('clues', 0);
        this.tunnelOpen = false;
        // Reset bookcase visual if needed
    }

    collectClue() {
        let clues = this.registry.values.clues + 1;
        this.registry.set('clues', clues);

        if (clues >= this.activeMission.unlockClues && !this.tunnelOpen) {
            this.tunnelOpen = true;
            this.registry.values.items.push(this.activeMission.item);
            // Animate bookcase opening (simple disable for now)
            this.gate.isSensor = true; // Make gate passable
            this.gate.render.visible = false;
        }
    }

    update() {
        // Flipper Controls
        if (this.leftKey.isDown) {
            this.matter.body.setAngularVelocity(this.leftFlipper, -0.2);
        } else {
            this.matter.body.setAngularVelocity(this.leftFlipper, 0.1); // Return force
        }

        if (this.rightKey.isDown) {
            this.matter.body.setAngularVelocity(this.rightFlipper, 0.2);
        } else {
            this.matter.body.setAngularVelocity(this.rightFlipper, -0.1); // Return force
        }

        // Plunger Logic
        if (this.spaceKey.isDown) {
            // Charge plunger (visual only for now, or move body down)
        } else if (Phaser.Input.Keyboard.JustUp(this.spaceKey)) {
            // Launch ball if in lane
            if (this.ball.x > 550 && this.ball.y > 600) {
                this.ball.setVelocity(0, -25);
            }
        }

        // Respawn if drained
        if (this.ball.y > 820) {
            this.ball.setPosition(570, 750);
            this.ball.setVelocity(0, 0);
        }
    }
}

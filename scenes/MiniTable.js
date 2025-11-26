export class MiniTable extends Phaser.Scene {
    constructor() {
        super({ key: 'MiniTable' });
    }

    init(data) {
        this.theme = data.theme || 'egypt';
    }

    create() {
        this.matter.world.setBounds(0, 0, 600, 800);

        // Background color based on theme
        const colors = {
            egypt: 0xc2b280,
            atlantis: 0x006994,
            jungle: 0x228b22,
            pirate: 0x8b4513,
            space: 0x000000
        };
        this.cameras.main.setBackgroundColor(colors[this.theme] || 0x000000);

        this.add.text(300, 100, `Mini Table: ${this.theme.toUpperCase()}`, { fontSize: '32px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(300, 150, 'Hit the Target to Win!', { fontSize: '20px', fill: '#fff' }).setOrigin(0.5);

        this.createTable();
        this.createFlippers();
        this.createBall();
        this.createTarget();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    }

    createTable() {
        const wallOptions = { isStatic: true, render: { fillColor: 0x555555 } };
        this.matter.add.rectangle(10, 400, 20, 800, wallOptions);
        this.matter.add.rectangle(590, 400, 20, 800, wallOptions);
        this.matter.add.rectangle(300, 10, 600, 20, wallOptions);

        // Drain
        this.drain = this.matter.add.rectangle(300, 810, 600, 20, { isStatic: true, isSensor: true, label: 'drain' });
    }

    createFlippers() {
        const flipperOptions = { isStatic: false, density: 0.1 };

        // Smaller flippers for difficulty
        this.leftFlipper = this.matter.add.rectangle(250, 700, 80, 20, flipperOptions);
        this.matter.add.worldConstraint(this.leftFlipper, 0, 1, { pointA: { x: 220, y: 680 }, pointB: { x: -30, y: 0 } });

        this.rightFlipper = this.matter.add.rectangle(350, 700, 80, 20, flipperOptions);
        this.matter.add.worldConstraint(this.rightFlipper, 0, 1, { pointA: { x: 380, y: 680 }, pointB: { x: 30, y: 0 } });

        // Stoppers
        this.matter.add.circle(220, 720, 5, { isStatic: true, render: { visible: false } });
        this.matter.add.circle(380, 720, 5, { isStatic: true, render: { visible: false } });
    }

    createBall() {
        this.ball = this.matter.add.circle(300, 200, 10, { restitution: 0.8, friction: 0.005, label: 'ball', render: { fillColor: 0xffd700 } });
        this.matter.body.setVelocity(this.ball, { x: (Math.random() - 0.5) * 10, y: 5 });
    }

    createTarget() {
        // Theme specific obstacle/target
        this.target = this.matter.add.rectangle(300, 300, 40, 40, { isStatic: true, label: 'target', render: { fillColor: 0xff0000 } });

        // Collision
        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach(pair => {
                const { bodyA, bodyB } = pair;
                if (bodyA.label === 'ball' || bodyB.label === 'ball') {
                    const other = bodyA.label === 'ball' ? bodyB : bodyA;
                    if (other.label === 'target') {
                        this.winGame();
                    } else if (other.label === 'drain') {
                        this.loseGame();
                    }
                }
            });
        });
    }

    update() {
        if (this.leftKey.isDown) {
            this.matter.body.setAngularVelocity(this.leftFlipper.body, -0.2);
        } else {
            this.matter.body.setAngularVelocity(this.leftFlipper.body, 0.1);
        }

        if (this.rightKey.isDown) {
            this.matter.body.setAngularVelocity(this.rightFlipper.body, 0.2);
        } else {
            this.matter.body.setAngularVelocity(this.rightFlipper.body, -0.1);
        }
    }

    winGame() {
        this.registry.values.score += 1000;
        this.scene.start('MainTable');
        // Logic to mark mission complete or award treasure would go here
        // For now, MainTable handles mission progression on next start
    }

    loseGame() {
        this.scene.start('MainTable');
    }
}

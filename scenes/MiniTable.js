const MatterBody = Phaser.Physics.Matter.Matter.Body;

export class MiniTable extends Phaser.Scene {
    constructor() {
        super({ key: 'MiniTable' });
    }

    init(data) {
        this.theme = data.theme || 'egypt';
        this.onComplete = data.onComplete || (() => {});
    }

    create() {
        this.matter.world.setBounds(0, 0, 600, 800);
        this.matter.world.setGravity(0, 1.2);

        const colors = {
            egypt: 0xc2b280,
            atlantis: 0x005a8c,
            jungle: 0x1f5f2d,
            pirate: 0x5b3816,
            space: 0x0d1024
        };
        this.cameras.main.setBackgroundColor(colors[this.theme] || 0x111111);
        this.add.text(300, 50, `Mini Table: ${this.theme.toUpperCase()}`, { fontSize: '22px', fill: '#fff' }).setOrigin(0.5);
        this.add.text(300, 80, 'Complete 2 tasks, then hit the treasure shot!', { fontSize: '16px', fill: '#fff' }).setOrigin(0.5);

        this.taskHits = 0;
        this.requiredTasks = 2;
        this.treasureOpen = false;

        this.createWalls();
        this.createFlippers();
        this.createThemeLayout();
        this.createBall();
        this.setupInput();
        this.setupCollisions();
    }

    createWalls() {
        const wallOptions = { isStatic: true, label: 'wall', restitution: 0.9 };
        this.matter.add.rectangle(10, 400, 20, 800, wallOptions);
        this.matter.add.rectangle(590, 400, 20, 800, wallOptions);
        this.matter.add.rectangle(300, 10, 600, 20, wallOptions);
        this.drain = this.matter.add.rectangle(300, 810, 600, 20, { isStatic: true, isSensor: true, label: 'drain' });
    }

    createFlippers() {
        this.flippers = {
            left: this.createFlipper(240, 700, 'left'),
            right: this.createFlipper(360, 700, 'right')
        };
    }

    createFlipper(x, y, side) {
        const body = this.matter.add.rectangle(x, y, 85, 18, { label: `${side}Flipper`, frictionAir: 0.01 });
        const pivot = this.matter.add.circle(side === 'left' ? x - 38 : x + 38, y, 4, { isStatic: true });
        this.matter.add.constraint(body, pivot, 0, 1, { pointA: { x: side === 'left' ? -38 : 38, y: 0 } });
        body.restAngle = side === 'left' ? Phaser.Math.DegToRad(-18) : Phaser.Math.DegToRad(18);
        body.activeAngle = side === 'left' ? Phaser.Math.DegToRad(32) : Phaser.Math.DegToRad(-32);
        MatterBody.setAngle(body, body.restAngle);
        return body;
    }

    createThemeLayout() {
        this.objectives = [];
        this.obstacles = [];

        const addObjective = (x, y, w, h, tint = 0xff0000) => {
            const obj = this.matter.add.rectangle(x, y, w, h, { isStatic: true, isSensor: true, label: 'objective' });
            obj.tint = tint;
            this.objectives.push(obj);
            this.add.rectangle(x, y, w, h, tint, 0.6).setStrokeStyle(2, 0xffffff);
        };

        const addObstacle = (x, y, shape) => {
            this.obstacles.push(shape);
        };

        switch (this.theme) {
            case 'egypt':
                addObjective(180, 260, 50, 30, 0xffd37f);
                addObjective(420, 260, 50, 30, 0xffd37f);
                this.treasureTarget = this.matter.add.rectangle(300, 180, 60, 20, { isStatic: true, isSensor: true, label: 'treasure' });
                this.add.triangle(300, 180, 0, 20, 30, -20, -30, -20, 0xffeaae, 0.8).setStrokeStyle(2, 0x000000);
                break;
            case 'atlantis':
                addObjective(220, 320, 40, 40, 0x46c3ff);
                addObjective(380, 320, 40, 40, 0x46c3ff);
                this.treasureTarget = this.matter.add.circle(300, 200, 22, { isStatic: true, isSensor: true, label: 'treasure' });
                this.add.circle(300, 200, 24, 0x7ad9ff, 0.8).setStrokeStyle(2, 0x004f88);
                // Small pegs to speed play
                this.obstacles.push(this.matter.add.circle(260, 360, 12, { isStatic: true, restitution: 1.2, label: 'peg' }));
                this.obstacles.push(this.matter.add.circle(340, 360, 12, { isStatic: true, restitution: 1.2, label: 'peg' }));
                break;
            case 'jungle':
                addObjective(200, 300, 45, 30, 0x4caf50);
                addObjective(400, 300, 45, 30, 0x4caf50);
                this.treasureTarget = this.matter.add.rectangle(300, 200, 70, 20, { isStatic: true, isSensor: true, label: 'treasure' });
                this.add.rectangle(300, 200, 70, 20, 0x2e8b57, 0.8).setStrokeStyle(2, 0x103f24);
                // bumpers
                this.obstacles.push(this.matter.add.circle(250, 360, 16, { isStatic: true, restitution: 1.4, label: 'bumper' }));
                this.obstacles.push(this.matter.add.circle(350, 360, 16, { isStatic: true, restitution: 1.4, label: 'bumper' }));
                break;
            case 'pirate':
                addObjective(180, 340, 40, 30, 0xd4983f);
                addObjective(420, 340, 40, 30, 0xd4983f);
                this.treasureTarget = this.matter.add.rectangle(300, 220, 80, 20, { isStatic: true, isSensor: true, label: 'treasure' });
                this.add.rectangle(300, 220, 80, 20, 0xc79c6e, 0.8).setStrokeStyle(2, 0x3d2914);
                this.obstacles.push(this.matter.add.rectangle(300, 320, 100, 10, { isStatic: true, angle: Phaser.Math.DegToRad(10), label: 'plank' }));
                this.obstacles.push(this.matter.add.rectangle(300, 380, 100, 10, { isStatic: true, angle: Phaser.Math.DegToRad(-10), label: 'plank' }));
                break;
            case 'space':
            default:
                addObjective(220, 260, 40, 40, 0xff66ff);
                addObjective(380, 260, 40, 40, 0xff66ff);
                this.treasureTarget = this.matter.add.circle(300, 200, 24, { isStatic: true, isSensor: true, label: 'treasure' });
                this.add.circle(300, 200, 26, 0x9c7bff, 0.8).setStrokeStyle(2, 0xffffff);
                // Gravity well effect handled in update
                this.gravityWell = { x: 300, y: 250 };
                break;
        }
    }

    createBall() {
        this.ball = this.matter.add.image(300, 500, 'ball');
        this.ball.setCircle(10);
        this.ball.setFriction(0.002);
        this.ball.setFrictionAir(0.001);
        this.ball.setBounce(0.95);
        this.ball.body.label = 'miniBall';
        const vx = Phaser.Math.Between(-5, 5);
        this.ball.setVelocity(vx, -15);
    }

    setupInput() {
        this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    }

    setupCollisions() {
        this.collisionHandler = (event) => {
            event.pairs.forEach(pair => {
                const bodies = [pair.bodyA, pair.bodyB];
                const ball = bodies.find(b => b.label === 'miniBall');
                const other = bodies.find(b => b !== ball);
                if (!ball || !other) return;

                if (other.label === 'objective') {
                    other.label = 'clearedObjective';
                    this.taskHits++;
                    this.addFlash(other.position.x, other.position.y, 0x00ff99);
                    if (this.taskHits >= this.requiredTasks) {
                        this.treasureOpen = true;
                    }
                } else if (other.label === 'treasure') {
                    if (this.treasureOpen) this.winMini();
                } else if (other.label === 'drain') {
                    this.loseMini();
                }
            });
        };
        this.matter.world.on('collisionstart', this.collisionHandler);
    }

    addFlash(x, y, color) {
        const rect = this.add.rectangle(x, y, 60, 60, color, 0.4);
        this.tweens.add({
            targets: rect,
            alpha: 0,
            duration: 300,
            onComplete: () => rect.destroy()
        });
    }

    update() {
        const leftTarget = this.leftKey.isDown ? this.flippers.left.activeAngle : this.flippers.left.restAngle;
        const rightTarget = this.rightKey.isDown ? this.flippers.right.activeAngle : this.flippers.right.restAngle;
        this.rotateFlipper(this.flippers.left, leftTarget);
        this.rotateFlipper(this.flippers.right, rightTarget);

        // Space gravity well
        if (this.theme === 'space' && this.gravityWell) {
            const dx = this.gravityWell.x - this.ball.x;
            const dy = this.gravityWell.y - this.ball.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 200) {
                MatterBody.applyForce(this.ball.body, this.ball.body.position, { x: dx * 0.00002, y: dy * 0.00002 });
            }
        }
    }

    rotateFlipper(flipper, target) {
        const newAngle = Phaser.Math.Angle.RotateTo(flipper.angle, target, 0.32);
        MatterBody.setAngle(flipper, newAngle);
        MatterBody.setAngularVelocity(flipper, 0);
    }

    winMini() {
        this.onComplete(true);
        this.cleanupAndExit();
    }

    loseMini() {
        this.onComplete(false);
        this.cleanupAndExit();
    }

    cleanupAndExit() {
        this.matter.world.off('collisionstart', this.collisionHandler);
        this.scene.stop();
    }
}

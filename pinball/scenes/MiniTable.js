const MatterBody = Phaser.Physics.Matter.Matter.Body;

export class MiniTable extends Phaser.Scene {
    constructor() {
        super({ key: 'MiniTable' });
    }

    init(data) {
        this.theme = data.theme || 'shock';
        this.onComplete = data.onComplete || (() => {});
    }

    create() {
        this.matter.world.setBounds(0, 0, 600, 800);
        this.matter.world.setGravity(0, 1.1);

        const colors = {
            shock: 0x0c2036,
            toxin: 0x18301a,
            signal: 0x102633,
            orbit: 0x1b2240,
            zen: 0x15122e
        };
        this.cameras.main.setBackgroundColor(colors[this.theme] || 0x0b1022);
        this.add.rectangle(300, 400, 520, 740, 0x0b1426, 0.9).setStrokeStyle(4, 0x5ce1ff, 0.25);

        this.add.text(300, 48, 'LAB DRILL', { fontSize: '24px', fill: '#e8f6ff' }).setOrigin(0.5);
        this.add.text(300, 78, 'Clear 2 signals, then hit the core', { fontSize: '14px', fill: '#a6c7ff' }).setOrigin(0.5);

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
        const addWall = (x, y, w, h, angle = 0) => {
            this.matter.add.rectangle(x, y, w, h, { ...wallOptions, angle });
            this.add.rectangle(x, y, w, h, 0x122238, 0.9).setRotation(angle);
        };
        addWall(18, 400, 26, 780);
        addWall(582, 400, 26, 780);
        addWall(300, 16, 560, 26);
        addWall(190, 580, 120, 14, Math.PI / 5);
        addWall(410, 580, 120, 14, -Math.PI / 5);
        this.drain = this.matter.add.rectangle(300, 810, 600, 20, { isStatic: true, isSensor: true, label: 'drain' });
    }

    createFlippers() {
        this.flippers = {
            left: this.createFlipper(245, 690, 'left'),
            right: this.createFlipper(355, 690, 'right')
        };
    }

    createFlipper(x, y, side) {
        const body = this.matter.add.rectangle(x, y, 90, 20, { label: `${side}Flipper`, frictionAir: 0.01 });
        const pivot = this.matter.add.circle(side === 'left' ? x - 40 : x + 40, y, 4, { isStatic: true });
        this.matter.add.constraint(body, pivot, 0, 1, { pointA: { x: side === 'left' ? -40 : 40, y: 0 } });
        body.restAngle = side === 'left' ? Phaser.Math.DegToRad(18) : Phaser.Math.DegToRad(-18);
        body.activeAngle = side === 'left' ? Phaser.Math.DegToRad(-32) : Phaser.Math.DegToRad(32);
        MatterBody.setAngle(body, body.restAngle);
        return body;
    }

    createThemeLayout() {
        this.objectives = [];
        this.obstacles = [];

        const addObjective = (x, y, w, h, tint = 0xff5b5b) => {
            const obj = this.matter.add.rectangle(x, y, w, h, { isStatic: true, isSensor: true, label: 'objective' });
            obj.sprite = this.add.rectangle(x, y, w, h, tint, 0.7).setStrokeStyle(2, 0xffffff, 0.6);
            this.objectives.push(obj);
        };

        switch (this.theme) {
            case 'toxin':
                addObjective(200, 320, 52, 26, 0x8bff7a);
                addObjective(400, 320, 52, 26, 0x8bff7a);
                this.treasureTarget = this.matter.add.rectangle(300, 210, 70, 24, { isStatic: true, isSensor: true, label: 'treasure' });
                this.treasureGlow = this.add.rectangle(300, 210, 70, 24, 0xb3ff9a, 0.8).setStrokeStyle(2, 0x2a5c1f);
                this.obstacles.push(this.matter.add.rectangle(300, 380, 140, 12, { isStatic: true, angle: Phaser.Math.DegToRad(-8), label: 'beam' }));
                break;
            case 'signal':
                addObjective(210, 300, 50, 26, 0x5ce1ff);
                addObjective(390, 300, 50, 26, 0x5ce1ff);
                this.treasureTarget = this.matter.add.rectangle(300, 210, 70, 24, { isStatic: true, isSensor: true, label: 'treasure' });
                this.treasureGlow = this.add.rectangle(300, 210, 70, 24, 0x7bdcff, 0.8).setStrokeStyle(2, 0x103b5c);
                this.obstacles.push(this.matter.add.circle(300, 350, 16, { isStatic: true, restitution: 1.2, label: 'peg' }));
                break;
            case 'orbit':
                addObjective(220, 290, 48, 26, 0x9bb2ff);
                addObjective(380, 290, 48, 26, 0x9bb2ff);
                this.treasureTarget = this.matter.add.circle(300, 210, 22, { isStatic: true, isSensor: true, label: 'treasure' });
                this.treasureGlow = this.add.circle(300, 210, 26, 0xb8c7ff, 0.8).setStrokeStyle(2, 0x1a4b7a);
                this.obstacles.push(this.matter.add.circle(250, 360, 12, { isStatic: true, restitution: 1.2, label: 'peg' }));
                this.obstacles.push(this.matter.add.circle(350, 360, 12, { isStatic: true, restitution: 1.2, label: 'peg' }));
                break;
            case 'zen':
                addObjective(220, 270, 46, 26, 0xb39bff);
                addObjective(380, 270, 46, 26, 0xb39bff);
                this.treasureTarget = this.matter.add.circle(300, 210, 24, { isStatic: true, isSensor: true, label: 'treasure' });
                this.treasureGlow = this.add.circle(300, 210, 28, 0xa78bff, 0.8).setStrokeStyle(2, 0xffffff);
                this.gravityWell = { x: 300, y: 260 };
                break;
            case 'shock':
            default:
                addObjective(210, 300, 50, 26, 0x2fe1ff);
                addObjective(390, 300, 50, 26, 0x2fe1ff);
                this.treasureTarget = this.matter.add.rectangle(300, 210, 70, 24, { isStatic: true, isSensor: true, label: 'treasure' });
                this.treasureGlow = this.add.rectangle(300, 210, 70, 24, 0x7bdcff, 0.8).setStrokeStyle(2, 0x103b5c);
                this.obstacles.push(this.matter.add.rectangle(300, 360, 120, 12, { isStatic: true, angle: Phaser.Math.DegToRad(6), label: 'beam' }));
                break;
        }
    }

    createBall() {
        this.ball = this.matter.add.image(300, 520, 'ball');
        this.ball.setCircle(12);
        this.ball.setFriction(0.002);
        this.ball.setFrictionAir(0.001);
        this.ball.setBounce(0.96);
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
            event.pairs.forEach((pair) => {
                const bodies = [pair.bodyA, pair.bodyB];
                const ball = bodies.find((b) => b.label === 'miniBall');
                const other = bodies.find((b) => b !== ball);
                if (!ball || !other) return;

                if (other.label === 'objective') {
                    other.label = 'clearedObjective';
                    this.taskHits++;
                    if (other.sprite) other.sprite.setAlpha(0.2);
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

        if (this.treasureGlow && this.treasureOpen) {
            const pulse = 0.6 + Math.sin(this.time.now * 0.02) * 0.2;
            this.treasureGlow.setAlpha(pulse);
        }

        if (this.theme === 'zen' && this.gravityWell) {
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

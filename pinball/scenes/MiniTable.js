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
        this.width = this.scale.gameSize.width;
        this.height = this.scale.gameSize.height;
        this.matter.world.setBounds(0, 0, this.width, this.height);
        this.matter.world.setGravity(0, 1.0);

        this.themeConfig = {
            shock: { bg: 0x0b1a2c, accent: 0x5ce1ff, accent2: 0xa6f3ff, label: 'Shock Circuit' },
            toxin: { bg: 0x122414, accent: 0x8fff79, accent2: 0xd1ff9d, label: 'Toxin Flush' },
            signal: { bg: 0x0e2330, accent: 0x63d9ff, accent2: 0xd5f7ff, label: 'Signal Sweep' },
            orbit: { bg: 0x171e39, accent: 0xb3beff, accent2: 0xe4eaff, label: 'Orbit Burst' },
            zen: { bg: 0x17122d, accent: 0xc29bff, accent2: 0xf0e3ff, label: 'Zenith Mode' }
        }[this.theme] || { bg: 0x0b1a2c, accent: 0x5ce1ff, accent2: 0xa6f3ff, label: 'Lab Drill' };

        this.cameras.main.setBackgroundColor(this.themeConfig.bg);
        this.drawLayout();

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

    drawLayout() {
        this.add.rectangle(this.width / 2, this.height / 2, this.width * 0.84, this.height * 0.86, 0x09111d, 0.92)
            .setStrokeStyle(3, this.themeConfig.accent, 0.24);
        this.add.rectangle(this.width / 2, this.height / 2, this.width * 0.78, this.height * 0.8, 0x0d1828, 0.66)
            .setStrokeStyle(1, 0xffffff, 0.08);

        this.add.text(this.width / 2, 52, this.themeConfig.label.toUpperCase(), {
            fontFamily: 'Space Grotesk',
            fontSize: '26px',
            fontStyle: '700',
            color: '#effcff'
        }).setOrigin(0.5);
        this.add.text(this.width / 2, 82, 'Clear the two lit nodes, then hit the core gate.', {
            fontFamily: 'Space Grotesk',
            fontSize: '14px',
            color: '#abd4f6'
        }).setOrigin(0.5);
        this.progressText = this.add.text(this.width / 2, 106, 'Nodes cleared: 0 / 2', {
            fontFamily: 'Space Grotesk',
            fontSize: '14px',
            color: '#ffe2a7'
        }).setOrigin(0.5);
    }

    createWalls() {
        const wallOptions = { isStatic: true, label: 'wall', restitution: 0.92 };
        const addWall = (x, y, w, h, angle = 0) => {
            this.matter.add.rectangle(x, y, w, h, { ...wallOptions, angle });
            this.add.rectangle(x, y, w, h, 0x17304b, 0.85).setRotation(angle);
        };

        addWall(this.width * 0.16, this.height * 0.5, 18, this.height * 0.78);
        addWall(this.width * 0.84, this.height * 0.5, 18, this.height * 0.78);
        addWall(this.width / 2, this.height * 0.14, this.width * 0.68, 18);
        addWall(this.width * 0.33, this.height * 0.72, this.width * 0.18, 14, Math.PI / 5.2);
        addWall(this.width * 0.67, this.height * 0.72, this.width * 0.18, 14, -Math.PI / 5.2);
        this.drain = this.matter.add.rectangle(this.width / 2, this.height + 10, this.width, 20, { isStatic: true, isSensor: true, label: 'drain' });
    }

    createFlippers() {
        const y = this.height * 0.84;
        this.flippers = {
            left: this.createFlipper(this.width * 0.43, y, 'left'),
            right: this.createFlipper(this.width * 0.57, y, 'right')
        };
    }

    createFlipper(x, y, side) {
        const width = 92;
        const body = this.matter.add.rectangle(x, y, width, 20, { label: `${side}Flipper`, frictionAir: 0.01, restitution: 0.2 });
        const pivot = this.matter.add.circle(side === 'left' ? x - 40 : x + 40, y, 5, { isStatic: true });
        this.matter.add.constraint(body, pivot, 0, 1, { pointA: { x: side === 'left' ? -40 : 40, y: 0 } });
        body.restAngle = side === 'left' ? Phaser.Math.DegToRad(18) : Phaser.Math.DegToRad(-18);
        body.activeAngle = side === 'left' ? Phaser.Math.DegToRad(-32) : Phaser.Math.DegToRad(32);
        MatterBody.setAngle(body, body.restAngle);
        body.sprite = this.add.rectangle(x, y, width, 18, this.themeConfig.accent, 0.95).setOrigin(0.5).setStrokeStyle(2, 0xffffff, 0.24);
        return body;
    }

    createThemeLayout() {
        this.objectives = [];
        this.obstacles = [];

        const addObjective = (x, y, w, h) => {
            const obj = this.matter.add.rectangle(x, y, w, h, { isStatic: true, isSensor: true, label: 'objective' });
            obj.sprite = this.add.rectangle(x, y, w, h, this.themeConfig.accent, 0.72).setStrokeStyle(2, 0xffffff, 0.55);
            this.objectives.push(obj);
            return obj;
        };

        switch (this.theme) {
            case 'toxin':
                addObjective(this.width * 0.38, this.height * 0.42, 54, 28);
                addObjective(this.width * 0.62, this.height * 0.42, 54, 28);
                this.obstacles.push(this.matter.add.rectangle(this.width / 2, this.height * 0.51, this.width * 0.22, 12, { isStatic: true, angle: Phaser.Math.DegToRad(-10), label: 'beam' }));
                break;
            case 'signal':
                addObjective(this.width * 0.36, this.height * 0.4, 52, 26);
                addObjective(this.width * 0.64, this.height * 0.4, 52, 26);
                this.obstacles.push(this.matter.add.circle(this.width / 2, this.height * 0.48, 16, { isStatic: true, restitution: 1.25, label: 'peg' }));
                break;
            case 'orbit':
                addObjective(this.width * 0.38, this.height * 0.38, 48, 26);
                addObjective(this.width * 0.62, this.height * 0.38, 48, 26);
                this.obstacles.push(this.matter.add.circle(this.width * 0.42, this.height * 0.5, 13, { isStatic: true, restitution: 1.25, label: 'peg' }));
                this.obstacles.push(this.matter.add.circle(this.width * 0.58, this.height * 0.5, 13, { isStatic: true, restitution: 1.25, label: 'peg' }));
                break;
            case 'zen':
                addObjective(this.width * 0.38, this.height * 0.37, 48, 26);
                addObjective(this.width * 0.62, this.height * 0.37, 48, 26);
                this.gravityWell = { x: this.width / 2, y: this.height * 0.34 };
                this.gravityGlow = this.add.circle(this.gravityWell.x, this.gravityWell.y, 36, this.themeConfig.accent, 0.16).setStrokeStyle(2, this.themeConfig.accent2, 0.55);
                break;
            case 'shock':
            default:
                addObjective(this.width * 0.38, this.height * 0.41, 52, 26);
                addObjective(this.width * 0.62, this.height * 0.41, 52, 26);
                this.obstacles.push(this.matter.add.rectangle(this.width / 2, this.height * 0.49, this.width * 0.22, 12, { isStatic: true, angle: Phaser.Math.DegToRad(8), label: 'beam' }));
                break;
        }

        this.treasureTarget = this.matter.add.circle(this.width / 2, this.height * 0.28, 24, { isStatic: true, isSensor: true, label: 'treasure' });
        this.treasureGlow = this.add.circle(this.width / 2, this.height * 0.28, 30, this.themeConfig.accent, 0.28).setStrokeStyle(2, this.themeConfig.accent2, 0.8);
        this.treasureGlow.setAlpha(0.28);
    }

    createBall() {
        this.ball = this.matter.add.image(this.width / 2, this.height * 0.62, 'ball');
        this.ball.setCircle(12);
        this.ball.setFriction(0.002);
        this.ball.setFrictionAir(0.001);
        this.ball.setBounce(0.96);
        this.ball.body.label = 'miniBall';
        this.ball.setVelocity(Phaser.Math.Between(-4, 4), -14);
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
                    this.taskHits += 1;
                    if (other.sprite) other.sprite.setAlpha(0.18);
                    this.progressText.setText(`Nodes cleared: ${this.taskHits} / ${this.requiredTasks}`);
                    this.addFlash(other.position.x, other.position.y, this.themeConfig.accent);
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
        const rect = this.add.circle(x, y, 34, color, 0.42);
        this.tweens.add({
            targets: rect,
            alpha: 0,
            scale: 1.4,
            duration: 280,
            onComplete: () => rect.destroy()
        });
    }

    update() {
        const leftTarget = this.leftKey.isDown ? this.flippers.left.activeAngle : this.flippers.left.restAngle;
        const rightTarget = this.rightKey.isDown ? this.flippers.right.activeAngle : this.flippers.right.restAngle;
        this.rotateFlipper(this.flippers.left, leftTarget);
        this.rotateFlipper(this.flippers.right, rightTarget);

        if (this.treasureGlow) {
            const base = this.treasureOpen ? 0.5 : 0.2;
            const pulse = base + Math.sin(this.time.now * 0.012) * 0.08;
            this.treasureGlow.setAlpha(pulse);
        }

        if (this.gravityWell) {
            const dx = this.gravityWell.x - this.ball.x;
            const dy = this.gravityWell.y - this.ball.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 180) {
                MatterBody.applyForce(this.ball.body, this.ball.body.position, { x: dx * 0.000018, y: dy * 0.000018 });
            }
            if (this.gravityGlow) this.gravityGlow.setAlpha(0.16 + (Math.sin(this.time.now * 0.018) + 1) * 0.05);
        }
    }

    rotateFlipper(flipper, target) {
        const newAngle = Phaser.Math.Angle.RotateTo(flipper.angle, target, 0.34);
        MatterBody.setAngle(flipper, newAngle);
        MatterBody.setAngularVelocity(flipper, 0);
        if (flipper.sprite) {
            flipper.sprite.setPosition(flipper.position.x, flipper.position.y);
            flipper.sprite.setRotation(newAngle);
        }
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

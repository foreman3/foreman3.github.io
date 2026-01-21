const MatterBody = Phaser.Physics.Matter.Matter.Body;

export class MainTable extends Phaser.Scene {
    constructor() {
        super({ key: 'MainTable' });
        this.tableWidth = Math.min(window.innerWidth * 0.85, 980);
        this.tableHeight = Math.min(window.innerHeight * 0.95, 1120);
    }

    preload() {
        this.tableWidth = Math.min(window.innerWidth * 0.85, 980);
        this.tableHeight = Math.min(window.innerHeight * 0.95, 1120);

        const g = this.make.graphics({ x: 0, y: 0, add: false });

        g.fillStyle(0xe6f0ff, 1);
        g.fillCircle(12, 12, 12);
        g.fillStyle(0xffffff, 1);
        g.fillCircle(7, 7, 4);
        g.lineStyle(2, 0xa9c4ff, 0.9);
        g.strokeCircle(12, 12, 11);
        g.generateTexture('ball', 24, 24);
        g.clear();

        g.fillStyle(0x2be4ff, 1);
        g.fillCircle(32, 32, 32);
        g.lineStyle(4, 0xffffff, 0.85);
        g.strokeCircle(32, 32, 28);
        g.lineStyle(2, 0x5fd2ff, 0.7);
        g.strokeCircle(32, 32, 22);
        g.fillStyle(0x0b1522, 1);
        g.fillCircle(32, 32, 14);
        g.generateTexture('bumper', 64, 64);
        g.clear();

        g.fillStyle(0xc2e7ff, 1);
        g.fillCircle(7, 7, 7);
        g.lineStyle(2, 0x0b1c30, 0.8);
        g.strokeCircle(7, 7, 6);
        g.generateTexture('post', 14, 14);
        g.clear();

        g.fillStyle(0xff7a52, 1);
        g.fillRoundedRect(0, 0, 52, 20, 6);
        g.lineStyle(2, 0xffffff, 0.75);
        g.strokeRoundedRect(0, 0, 52, 20, 6);
        g.generateTexture('target', 52, 20);
        g.clear();

        g.fillStyle(0x9cf7ff, 1);
        g.fillCircle(10, 10, 10);
        g.fillStyle(0x091320, 1);
        g.fillCircle(10, 10, 4);
        g.lineStyle(2, 0xffffff, 0.6);
        g.strokeCircle(10, 10, 8);
        g.generateTexture('laneLight', 20, 20);
        g.clear();

        const flipperG = this.make.graphics({ x: 0, y: 0, add: false });
        const drawFlipper = (key, color, tipDir = 1) => {
            flipperG.clear();
            flipperG.fillStyle(color, 1);
            flipperG.lineStyle(2, 0xffffff, 0.6);
            const length = 122;
            const height = 20;
            const radius = 10;
            flipperG.fillRoundedRect(-length / 2, -height / 2, length, height, radius);
            flipperG.strokeRoundedRect(-length / 2, -height / 2, length, height, radius);
            flipperG.fillCircle((length / 2) * tipDir, 0, height / 2 + 2);
            flipperG.strokeCircle((length / 2) * tipDir, 0, height / 2 + 2);
            flipperG.generateTexture(key, length + 24, height + 16);
        };
        drawFlipper('flipperL', 0xff8a3d, 1);
        drawFlipper('flipperR', 0x4bb2ff, -1);

        const bg = this.make.graphics({ x: 0, y: 0, add: false });
        bg.fillGradientStyle(0x1b0f2b, 0x2a1144, 0x0a1a2f, 0x120a1f, 1);
        bg.fillRect(0, 0, this.tableWidth, this.tableHeight);
        bg.lineStyle(2, 0xff4ecb, 0.12);
        for (let y = 40; y < this.tableHeight; y += 90) {
            bg.lineBetween(30, y, this.tableWidth - 30, y - 20);
        }
        bg.lineStyle(2, 0x3fffea, 0.15);
        for (let x = 40; x < this.tableWidth; x += 140) {
            bg.lineBetween(x, 60, x + 30, this.tableHeight - 80);
        }
        bg.fillStyle(0xffe45c, 0.08);
        for (let x = 80; x < this.tableWidth; x += 160) {
            for (let y = 120; y < this.tableHeight; y += 180) {
                bg.fillCircle(x, y, 10);
            }
        }
        bg.lineStyle(3, 0x6cf7ff, 0.22);
        bg.strokeRoundedRect(18, 18, this.tableWidth - 36, this.tableHeight - 36, 24);
        bg.generateTexture('playfield', this.tableWidth, this.tableHeight);

        const decal = this.make.graphics({ x: 0, y: 0, add: false });
        decal.fillStyle(0xff00aa, 0.18);
        decal.fillRoundedRect(0, 0, 220, 80, 18);
        decal.lineStyle(3, 0xffffff, 0.4);
        decal.strokeRoundedRect(0, 0, 220, 80, 18);
        decal.fillStyle(0x00f7ff, 0.45);
        decal.fillTriangle(40, 50, 180, 40, 90, 10);
        decal.generateTexture('decalA', 220, 80);
        decal.clear();

        decal.fillStyle(0xffe45c, 0.18);
        decal.fillRoundedRect(0, 0, 200, 70, 16);
        decal.lineStyle(3, 0xffffff, 0.35);
        decal.strokeRoundedRect(0, 0, 200, 70, 16);
        decal.fillStyle(0xff4ecb, 0.5);
        decal.fillTriangle(30, 50, 170, 45, 110, 8);
        decal.generateTexture('decalB', 200, 70);
    }

    create() {
        this.tableWidth = this.scale.gameSize.width;
        this.tableHeight = this.scale.gameSize.height;

        this.add.image(this.tableWidth / 2, this.tableHeight / 2, 'playfield');
        this.add.image(this.tableWidth * 0.32, this.tableHeight * 0.32, 'decalA').setRotation(-0.2).setAlpha(0.9);
        this.add.image(this.tableWidth * 0.68, this.tableHeight * 0.62, 'decalB').setRotation(0.15).setAlpha(0.9);
        this.add.rectangle(this.tableWidth / 2, this.tableHeight / 2, this.tableWidth - 16, this.tableHeight - 16, 0x120b1f, 0.18)
            .setStrokeStyle(3, 0xff7bd5, 0.25)
            .setDepth(1);

        if (!this.scene.isActive('UI')) this.scene.launch('UI');

        this.matter.world.setBounds(0, 0, this.tableWidth, this.tableHeight, 36, true, true, true, false);
        this.matter.world.setGravity(0, 0.48);

        this.defineMissions();
        this.initState();

        this.createTable();
        this.createFlippers();
        this.createPlunger();
        this.createBumpers();
        this.createSlingshots();
        this.createTargets();
        this.createLanes();
        this.createRamps();
        this.createLocksAndTunnel();

        this.startNextMission();

        this.setupCollisions();
        this.setupInput();

        this.spawnBall();
        this.registry.set('lives', 3);
    }

    defineMissions() {
        this.missions = [
            { id: 'shock', name: 'Shock Therapy', treasure: 'Stun Module', requiredClues: 3, requiredItems: ['Lab Key', 'Brain Chip'] },
            { id: 'toxin', name: 'Toxin Flush', treasure: 'Antidote Core', requiredClues: 4, requiredItems: ['Lab Key', 'Bio Sample'] },
            { id: 'signal', name: 'Signal Sweep', treasure: 'Signal Prism', requiredClues: 3, requiredItems: ['Brain Chip', 'Pulse Coil'] },
            { id: 'orbit', name: 'Orbit Burst', treasure: 'Orbit Relay', requiredClues: 4, requiredItems: ['Bio Sample', 'Pulse Coil'] },
            { id: 'zen', name: 'Zenith Mode', treasure: 'Zenith Crown', requiredClues: 5, requiredItems: ['Star Chart', 'Lab Key'] }
        ];
        this.itemPool = ['Lab Key', 'Brain Chip', 'Bio Sample', 'Pulse Coil', 'Star Chart'];
        this.availableMissions = Phaser.Utils.Array.Shuffle([...this.missions]);
    }

    initState() {
        if (this.registry.get('score') == null) this.registry.set('score', 0);
        if (this.registry.get('lives') == null) this.registry.set('lives', 3);
        if (!this.registry.get('items')) this.registry.set('items', []);
        if (!this.registry.get('treasures')) this.registry.set('treasures', []);

        this.items = this.registry.get('items');
        this.treasures = this.registry.get('treasures');
        this.clueCount = 0;
        this.registry.set('clues', this.clueCount);
        this.tunnelOpen = false;
        this.targetDrops = 0;
        this.laneStates = [false, false, false];
        this.spinnerHits = 0;
        this.lockedBalls = [];
        this.miniTableActive = false;
    }

    createTable() {
        const wallOptions = { isStatic: true, restitution: 0.78, label: 'wall' };
        const addWall = (x, y, w, h, angle = 0, color = 0x1c1530, alpha = 0.9, label = 'wall') => {
            const body = this.matter.add.rectangle(x, y, w, h, { ...wallOptions, angle, label });
            this.add.rectangle(x, y, w, h, color, alpha).setRotation(angle).setDepth(1);
            return body;
        };

        const edge = 18;
        const laneDividerX = this.tableWidth - 106;
        const plungerLaneX = this.tableWidth - 70;
        const plungerWallX = this.tableWidth - 92;
        const topGap = 120;

        addWall(edge, this.tableHeight * 0.5, edge * 2, this.tableHeight * 0.95);
        addWall(this.tableWidth - edge, this.tableHeight * 0.5, edge * 2, this.tableHeight * 0.95);
        addWall(edge + (laneDividerX - edge * 2) / 2, 16, laneDividerX - edge * 2, 26);

        this.laneDivider = addWall(laneDividerX, this.tableHeight / 2, 16, this.tableHeight, 0, 0x0b0d18, 0.9, 'divider');
        this.add.rectangle(laneDividerX + 26, this.tableHeight / 2, 52, this.tableHeight, 0x0b0d18, 0.5).setDepth(1);

        // Narrow plunger lane walls to keep the ball aligned.
        addWall(plungerWallX, this.tableHeight * 0.5, 12, this.tableHeight, 0, 0x151225, 0.95, 'plungerWall');
        addWall(this.tableWidth - 30, this.tableHeight * 0.5, 10, this.tableHeight, 0, 0x151225, 0.95, 'plungerWall');
        // Lane exit guide to feed the ball onto the playfield.
        addWall(this.tableWidth - 88, 170, 150, 14, -Math.PI / 4.6, 0x2b1a42, 0.95);
        // Curved lane guide to feed the ball onto the playfield.
        const curveStartX = this.tableWidth - 78;
        const curveStartY = 240;
        for (let i = 0; i < 6; i++) {
            const angle = -Math.PI / 2.6 + i * (Math.PI / 14);
            const x = curveStartX - i * 16;
            const y = curveStartY - i * 20;
            addWall(x, y, 70, 12, angle, 0x2b1a42, 0.95);
        }

        addWall(this.tableWidth - 100, topGap, 130, 16, -Math.PI / 4.8, 0x2b1a42, 0.9);
        addWall(this.tableWidth * 0.18, topGap + 10, 170, 16, Math.PI / 6, 0x2b1a42, 0.9);
        addWall(this.tableWidth * 0.24, this.tableHeight - 212, 170, 18, Math.PI / 5, 0x2b1a42, 0.95);
        addWall(this.tableWidth * 0.67, this.tableHeight - 212, 170, 18, -Math.PI / 5, 0x2b1a42, 0.95);

        addWall(this.tableWidth * 0.43, this.tableHeight - 290, 120, 16, Math.PI / 2.9, 0x231737, 0.9);
        addWall(this.tableWidth * 0.57, this.tableHeight - 290, 120, 16, -Math.PI / 2.9, 0x231737, 0.9);

        this.addPost(this.tableWidth * 0.18, this.tableHeight - 255);
        this.addPost(this.tableWidth * 0.32, this.tableHeight - 240);
        this.addPost(this.tableWidth * 0.68, this.tableHeight - 240);
        this.addPost(this.tableWidth * 0.82, this.tableHeight - 255);

        this.spinner = this.matter.add.rectangle(this.tableWidth * 0.5, 230, 16, 110, { isStatic: true, isSensor: true, label: 'spinner' });
        this.add.rectangle(this.tableWidth * 0.5, 230, 12, 100, 0x9cf7ff, 0.55).setStrokeStyle(2, 0xffffff, 0.4);

        this.leftOrbit = this.matter.add.rectangle(this.tableWidth * 0.16, 260, 28, 160, { isStatic: true, isSensor: true, label: 'leftOrbit' });
        this.rightOrbit = this.matter.add.rectangle(this.tableWidth * 0.84, 260, 28, 160, { isStatic: true, isSensor: true, label: 'rightOrbit' });

        this.drain = this.matter.add.rectangle(this.tableWidth / 2, this.tableHeight + 10, this.tableWidth - 200, 20, { isStatic: true, isSensor: true, label: 'drain' });
        this.leftOutlane = this.matter.add.rectangle(70, this.tableHeight - 20, 50, 24, { isStatic: true, isSensor: true, label: 'leftOutlane' });
        this.rightOutlane = this.matter.add.rectangle(this.tableWidth - 70, this.tableHeight - 20, 50, 24, { isStatic: true, isSensor: true, label: 'rightOutlane' });
        this.leftInlane = this.matter.add.rectangle(this.tableWidth * 0.32, this.tableHeight - 140, 60, 20, { isStatic: true, isSensor: true, label: 'leftInlane' });
        this.rightInlane = this.matter.add.rectangle(this.tableWidth * 0.68, this.tableHeight - 140, 60, 20, { isStatic: true, isSensor: true, label: 'rightInlane' });
        this.kickback = this.matter.add.rectangle(70, this.tableHeight - 96, 20, 110, { isStatic: true, label: 'kickback' });
    }

    addPost(x, y) {
        const post = this.matter.add.circle(x, y, 7, { isStatic: true, restitution: 1.1, label: 'post' });
        this.add.image(x, y, 'post').setDepth(2);
        return post;
    }

    createFlippers() {
        const fY = this.tableHeight - 118;
        this.flippers = {
            left: this.createFlipper(this.tableWidth * 0.37, fY, 'left'),
            right: this.createFlipper(this.tableWidth * 0.63, fY, 'right')
        };
    }

    createFlipper(x, y, side) {
        const width = 122;
        const height = 20;
        const body = this.matter.add.rectangle(x, y, width, height, {
            chamfer: 6,
            friction: 0,
            frictionAir: 0.01,
            label: `${side}Flipper`
        });
        const pivot = this.matter.add.circle(side === 'left' ? x - width * 0.45 : x + width * 0.45, y, 4, { isStatic: true, label: `${side}Pivot` });
        this.matter.add.constraint(body, pivot, 0, 1, { pointA: { x: side === 'left' ? -width * 0.45 : width * 0.45, y: 0 } });

        body.restAngle = side === 'left' ? Phaser.Math.DegToRad(22) : Phaser.Math.DegToRad(-22);
        body.activeAngle = side === 'left' ? Phaser.Math.DegToRad(-34) : Phaser.Math.DegToRad(34);
        MatterBody.setAngle(body, body.restAngle);
        const tex = side === 'left' ? 'flipperL' : 'flipperR';
        body.sprite = this.add.image(x, y, tex).setOrigin(0.5).setDepth(4).setScale(1);
        return body;
    }

    createPlunger() {
        const laneX = this.tableWidth - 70;
        const laneBottom = this.tableHeight - 72;
        this.plunger = this.matter.add.rectangle(laneX, laneBottom, 18, 70, { isStatic: true, label: 'plunger' });
        this.plungerPull = 0;
        this.plungerRestY = laneBottom;
        this.plungerSprite = this.add.rectangle(laneX, laneBottom, 24, 80, 0x9fb3c8, 0.9)
            .setStrokeStyle(2, 0xffffff, 0.7)
            .setDepth(3);
    }

    createBumpers() {
        const opts = { isStatic: true, restitution: 1.35, label: 'bumper' };
        const midX = this.tableWidth * 0.5;
        this.bumpers = [
            this.matter.add.circle(midX, 240, 28, opts),
            this.matter.add.circle(midX - 70, 300, 26, opts),
            this.matter.add.circle(midX + 70, 300, 26, opts)
        ];
        this.bumpers.forEach((b, i) => {
            const sprite = this.add.image(b.position.x, b.position.y, 'bumper').setScale(0.95);
            sprite.setTint([0x28e0ff, 0xff8a3d, 0x7affad][i % 3]);
        });
    }

    createSlingshots() {
        const opts = { isStatic: true, restitution: 1.2, label: 'slingshot' };
        this.slings = [];
        this.slings.push(this.matter.add.trapezoid(this.tableWidth * 0.28, this.tableHeight - 200, 110, 46, 0.35, opts));
        this.slings.push(this.matter.add.trapezoid(this.tableWidth * 0.72, this.tableHeight - 200, 110, 46, 0.35, opts));
        this.slings.forEach((sling, index) => {
            const tint = index === 0 ? 0xffc08a : 0x8acbff;
            this.add.triangle(sling.position.x, sling.position.y, 0, 30, 34, -30, -34, -30, tint, 0.7)
                .setStrokeStyle(2, 0xffffff, 0.45);
        });
    }

    createTargets() {
        this.targets = [];
        this.targetGroup = this.add.group();
        const startX = this.tableWidth * 0.58;
        const startY = this.tableHeight * 0.5;
        for (let i = 0; i < 4; i++) {
            const targetX = startX + i * 52;
            const target = this.matter.add.rectangle(targetX, startY, 42, 18, { isStatic: true, label: 'target', chamfer: 4 });
            target.alive = true;
            this.targets.push(target);
            const sprite = this.add.image(targetX, startY, 'target').setOrigin(0.5);
            this.targetGroup.add(sprite);
        }
    }

    createLanes() {
        this.lanes = [
            this.matter.add.rectangle(this.tableWidth * 0.3, 90, 50, 12, { isStatic: true, isSensor: true, label: 'lane0' }),
            this.matter.add.rectangle(this.tableWidth * 0.5, 70, 50, 12, { isStatic: true, isSensor: true, label: 'lane1' }),
            this.matter.add.rectangle(this.tableWidth * 0.7, 90, 50, 12, { isStatic: true, isSensor: true, label: 'lane2' })
        ];
        this.laneLights = [
            this.add.image(this.tableWidth * 0.3, 62, 'laneLight').setAlpha(0.2),
            this.add.image(this.tableWidth * 0.5, 42, 'laneLight').setAlpha(0.2),
            this.add.image(this.tableWidth * 0.7, 62, 'laneLight').setAlpha(0.2)
        ];
    }

    createRamps() {
        this.leftRamp = this.matter.add.rectangle(this.tableWidth * 0.23, this.tableHeight * 0.6, 70, 34, { isStatic: true, isSensor: true, label: 'leftRamp' });
        this.rightRamp = this.matter.add.rectangle(this.tableWidth * 0.77, this.tableHeight * 0.58, 70, 34, { isStatic: true, isSensor: true, label: 'rightRamp' });
        this.itemRamp = this.matter.add.rectangle(this.tableWidth * 0.5, this.tableHeight * 0.46, 70, 34, { isStatic: true, isSensor: true, label: 'itemRamp' });

        this.addTriangle(this.tableWidth * 0.23, this.tableHeight * 0.59, 0xffb85b);
        this.addTriangle(this.tableWidth * 0.77, this.tableHeight * 0.57, 0x5ce1ff);
        this.addTriangle(this.tableWidth * 0.5, this.tableHeight * 0.45, 0x9dff7a);
    }

    createLocksAndTunnel() {
        this.lockSaucer = this.matter.add.circle(this.tableWidth * 0.18, this.tableHeight * 0.36, 20, { isStatic: true, isSensor: true, label: 'lock' });
        this.add.circle(this.tableWidth * 0.18, this.tableHeight * 0.36, 22, 0x28e0ff, 0.4)
            .setStrokeStyle(2, 0xffffff, 0.6);

        this.tunnel = this.matter.add.rectangle(this.tableWidth * 0.66, this.tableHeight * 0.38, 90, 46, { isStatic: true, isSensor: true, label: 'tunnel' });
        this.tunnelGate = this.matter.add.rectangle(this.tableWidth * 0.66, this.tableHeight * 0.42, 130, 14, { isStatic: true, label: 'tunnelGate' });
        this.tunnelIndicator = this.add.rectangle(this.tableWidth * 0.66, this.tableHeight * 0.38, 90, 46, 0x182030, 0.35).setStrokeStyle(2, 0xffd700, 0);
    }

    addTriangle(x, y, color) {
        const tri = this.add.triangle(x, y, 0, 32, 34, -32, -34, -32, color, 0.75);
        tri.setStrokeStyle(2, color);
    }

    setupInput() {
        this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }

    setupCollisions() {
        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach((pair) => {
                const bodies = [pair.bodyA, pair.bodyB];
                const ballBody = bodies.find((b) => b.label === 'ball');
                const other = bodies.find((b) => b !== ballBody);
                if (!ballBody || !other) return;
                this.handleCollision(other, ballBody);
            });
        });
    }

    spawnBall(spawnX = null, spawnY = null) {
        const laneX = this.tableWidth - 70;
        const laneY = this.tableHeight - 170;
        const ball = this.matter.add.image(spawnX ?? laneX, spawnY ?? laneY, 'ball');
        ball.setCircle(12);
        ball.setBounce(0.86);
        ball.setFriction(0.004);
        ball.setFrictionAir(0.001);
        ball.body.label = 'ball';
        ball.setDepth(3);
        if (!this.balls) this.balls = [];
        this.balls.push(ball);
        return ball;
    }

    handleCollision(body, ballBody) {
        switch (body.label) {
            case 'bumper':
                this.addScore(160);
                break;
            case 'slingshot':
                this.addScore(90);
                break;
            case 'target':
                this.hitTarget(body);
                break;
            case 'lane0':
            case 'lane1':
            case 'lane2':
                this.lightLane(body.label);
                break;
            case 'leftOrbit':
            case 'rightOrbit':
                this.collectClue('orbit');
                this.addScore(120);
                break;
            case 'leftInlane':
            case 'rightInlane':
                this.addScore(60);
                break;
            case 'spinner':
                this.spinnerHits++;
                if (this.spinnerHits % 6 === 0) this.collectClue('spinner');
                this.addScore(60);
                break;
            case 'leftRamp':
            case 'rightRamp':
                this.collectClue('ramp');
                this.addScore(220);
                break;
            case 'itemRamp':
                this.tryAwardItem();
                break;
            case 'lock':
                this.lockBall(ballBody);
                break;
            case 'tunnel':
                if (this.tunnelOpen) this.launchMiniTable();
                break;
            case 'drain':
                this.onDrain(ballBody);
                break;
            case 'leftOutlane':
                this.triggerKickback(ballBody);
                break;
            case 'rightOutlane':
                this.onDrain(ballBody);
                break;
            default:
                break;
        }
    }

    hitTarget(target) {
        if (target.alive === false) return;
        target.alive = false;
        target.isSensor = true;
        this.targetDrops++;
        this.addScore(260);
        const sprite = this.targetGroup.getChildren()[this.targets.indexOf(target)];
        if (sprite) sprite.setVisible(false);
        if (this.targetDrops >= this.targets.length) {
            this.collectClue('targets');
            this.time.delayedCall(1200, () => this.resetTargets());
        }
    }

    resetTargets() {
        this.targetDrops = 0;
        this.targets.forEach((target, i) => {
            target.alive = true;
            target.isSensor = false;
            const sprite = this.targetGroup.getChildren()[i];
            if (sprite) sprite.setVisible(true);
        });
    }

    lightLane(label) {
        const idx = Number(label.replace('lane', ''));
        this.laneStates[idx] = true;
        this.addScore(70);
        if (this.laneLights?.[idx]) this.laneLights[idx].setAlpha(1);
        if (this.laneStates.every(Boolean)) {
            this.collectClue('lanes');
            this.laneStates = [false, false, false];
            this.laneLights.forEach((light) => light.setAlpha(0.2));
        }
    }

    collectClue() {
        if (!this.activeMission) return;
        this.clueCount += 1;
        this.registry.set('clues', this.clueCount);
        if (this.clueCount >= this.activeMission.requiredClues && this.hasRequiredItems()) {
            this.openTunnel();
        }
    }

    tryAwardItem() {
        if (!this.activeMission) return;
        if (this.clueCount < this.activeMission.requiredClues) {
            this.addScore(70);
            return;
        }
        const missing = this.itemPool.filter((item) => !this.items.includes(item));
        if (missing.length === 0) return;
        const item = Phaser.Utils.Array.GetRandom(missing);
        this.items.push(item);
        this.registry.set('items', this.items);
        this.addScore(340);
        if (this.hasRequiredItems() && this.clueCount >= this.activeMission.requiredClues) {
            this.openTunnel();
        }
    }

    hasRequiredItems() {
        if (!this.activeMission) return false;
        return this.activeMission.requiredItems.every((req) => this.items.includes(req));
    }

    openTunnel() {
        if (this.tunnelOpen) return;
        this.tunnelOpen = true;
        this.tunnelGate.isSensor = true;
        this.tunnelGate.renderVisible = false;
        this.tunnelIndicator.setStrokeStyle(3, 0xffd700, 1);
    }

    closeTunnel() {
        if (!this.tunnelGate) return;
        this.tunnelOpen = false;
        this.tunnelGate.isSensor = false;
        this.tunnelIndicator.setStrokeStyle(2, 0xffd700, 0);
    }

    lockBall(ball) {
        if (this.lockedBalls.find((b) => b === ball)) return;
        this.lockedBalls.push(ball);
        MatterBody.setPosition(ball.body, { x: -100, y: -100 });
        MatterBody.setVelocity(ball.body, { x: 0, y: 0 });
        if (this.lockedBalls.length >= 2) {
            this.releaseLockedBalls();
        } else {
            if (this.balls.filter((b) => b.active !== false && b.body.position.y < 1400).length === 0) {
                this.spawnBall();
            }
        }
    }

    releaseLockedBalls() {
        const releasePoint = { x: this.tableWidth * 0.32, y: this.tableHeight * 0.45 };
        this.lockedBalls.forEach((ball) => {
            MatterBody.setPosition(ball.body, releasePoint);
            MatterBody.setVelocity(ball.body, { x: Phaser.Math.Between(-8, 8), y: -12 });
        });
        this.lockedBalls = [];
    }

    launchMiniTable() {
        if (this.miniTableActive) return;
        this.miniTableActive = true;
        this.closeTunnel();
        this.cameras.main.setAlpha(0.15);
        this.scene.launch('MiniTable', {
            theme: this.activeMission.id,
            onComplete: (win) => {
                this.cameras.main.setAlpha(1);
                this.miniTableActive = false;
                this.scene.resume();
                if (win) {
                    this.finishMission();
                } else {
                    this.clueCount = Math.max(0, this.clueCount - 1);
                    this.registry.set('clues', this.clueCount);
                }
            }
        });
        this.scene.pause();
    }

    finishMission() {
        if (!this.treasures.includes(this.activeMission.treasure)) {
            this.treasures.push(this.activeMission.treasure);
            this.registry.set('treasures', this.treasures);
            this.addScore(2500);
        }
        this.clueCount = 0;
        this.registry.set('clues', 0);
        this.startNextMission();
    }

    startNextMission() {
        if (this.availableMissions.length === 0) {
            this.activeMission = null;
            this.registry.set('mission', 'All lab modules cleared!');
            this.registry.set('clueTarget', 0);
            this.registry.set('requiredItems', 'None');
            return;
        }
        this.activeMission = this.availableMissions.shift();
        this.registry.set('mission', `${this.activeMission.name}`);
        this.registry.set('clueTarget', this.activeMission.requiredClues);
        this.registry.set('requiredItems', this.activeMission.requiredItems.join(', '));
        this.closeTunnel();
    }

    onDrain(ball) {
        const idx = this.balls.indexOf(ball);
        if (idx >= 0) this.balls.splice(idx, 1);
        ball.destroy();
        this.loseLife();
    }

    triggerKickback(ball) {
        MatterBody.setVelocity(ball.body, { x: 4, y: -16 });
    }

    loseLife() {
        const lives = (this.registry.get('lives') || 1) - 1;
        this.registry.set('lives', lives);
        if (lives <= 0) {
            this.resetGame();
            return;
        }
        this.time.delayedCall(600, () => this.spawnBall());
    }

    resetGame() {
        this.registry.set('lives', 3);
        this.registry.set('score', 0);
        this.registry.set('items', []);
        this.registry.set('treasures', []);
        this.items = [];
        this.treasures = [];
        this.availableMissions = Phaser.Utils.Array.Shuffle([...this.missions]);
        this.startNextMission();
        this.clueCount = 0;
        this.registry.set('clues', 0);
        this.spawnBall();
    }

    addScore(amount) {
        const score = (this.registry.get('score') || 0) + amount;
        this.registry.set('score', score);
    }

    update() {
        const leftTarget = this.leftKey.isDown ? this.flippers.left.activeAngle : this.flippers.left.restAngle;
        const rightTarget = this.rightKey.isDown ? this.flippers.right.activeAngle : this.flippers.right.restAngle;
        this.rotateFlipper(this.flippers.left, leftTarget);
        this.rotateFlipper(this.flippers.right, rightTarget);

        const plungerKeyDown = this.spaceKey.isDown || this.enterKey.isDown;
        if (plungerKeyDown) {
            this.plungerPull = Phaser.Math.Clamp(this.plungerPull + 0.45, 0, 22);
            MatterBody.setPosition(this.plunger, { x: this.plunger.position.x, y: this.plungerRestY + this.plungerPull });
            if (this.plungerSprite) this.plungerSprite.setPosition(this.plunger.position.x, this.plungerRestY + this.plungerPull);
        } else if (Phaser.Input.Keyboard.JustUp(this.spaceKey) || Phaser.Input.Keyboard.JustUp(this.enterKey)) {
            const launchBall = this.balls.find((b) => b.body && b.body.position.x > this.tableWidth - 110 && b.body.position.y > this.tableHeight - 280);
            if (launchBall) {
                MatterBody.setVelocity(launchBall.body, { x: -0.4, y: -12 - this.plungerPull * 0.62 });
            }
            this.plungerPull = 0;
            MatterBody.setPosition(this.plunger, { x: this.plunger.position.x, y: this.plungerRestY });
            if (this.plungerSprite) this.plungerSprite.setPosition(this.plunger.position.x, this.plungerRestY);
        } else {
            this.plungerPull = Phaser.Math.Clamp(this.plungerPull - 0.6, 0, 22);
            MatterBody.setPosition(this.plunger, { x: this.plunger.position.x, y: this.plungerRestY + this.plungerPull });
            if (this.plungerSprite) this.plungerSprite.setPosition(this.plunger.position.x, this.plungerRestY + this.plungerPull);
        }

        this.balls = this.balls.filter((b) => b.body);
        if (!this.miniTableActive && this.balls.length === 0) {
            this.time.delayedCall(400, () => this.spawnBall());
        }
    }

    rotateFlipper(flipper, target) {
        const step = 0.32;
        const newAngle = Phaser.Math.Angle.RotateTo(flipper.angle, target, step);
        MatterBody.setAngle(flipper, newAngle);
        MatterBody.setAngularVelocity(flipper, 0);
        if (flipper.sprite) {
            flipper.sprite.setPosition(flipper.position.x, flipper.position.y);
            flipper.sprite.setRotation(newAngle);
        }
    }
}

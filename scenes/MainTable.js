const MatterBody = Phaser.Physics.Matter.Matter.Body;

export class MainTable extends Phaser.Scene {
    constructor() {
        super({ key: 'MainTable' });
        this.tableWidth = 600;
        this.tableHeight = 800;
    }

    preload() {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffd700, 1);
        g.fillCircle(10, 10, 10);
        g.generateTexture('ball', 20, 20);
        g.clear();

        g.fillStyle(0xff4444, 1);
        g.fillCircle(20, 20, 20);
        g.generateTexture('bumper', 40, 40);
        g.clear();

        g.fillStyle(0x8b4513, 1);
        g.fillRect(0, 0, 15, 40);
        g.generateTexture('book', 15, 40);
        g.clear();

        // Simple vertical gradient playfield (using Phaser fillGradientStyle)
        const bg = this.make.graphics({ x: 0, y: 0, add: false });
        bg.fillGradientStyle(0x1e2a38, 0x1e2a38, 0x0a0d14, 0x0a0d14, 1);
        bg.fillRect(0, 0, this.tableWidth, this.tableHeight);
        bg.generateTexture('playfield', this.tableWidth, this.tableHeight);
    }

    create() {
        this.add.image(this.tableWidth / 2, this.tableHeight / 2, 'playfield').setTint(0x0f1115);

        // Launch UI scene in parallel
        if (!this.scene.isActive('UI')) this.scene.launch('UI');

        this.matter.world.setBounds(0, 0, this.tableWidth, this.tableHeight);
        this.matter.world.setGravity(0, 0.8);

        this.defineMissions();
        this.initState();

        this.createTable();
        this.createFlippers();
        this.createPlunger();
        this.createBumpers();
        this.createSlingshots();
        this.createClueObjects();
        this.createRampsAndSpinners();
        this.createLocksAndTunnel();

        // After core geometry is ready, select mission
        this.startNextMission();

        this.setupCollisions();
        this.setupInput();

        this.spawnBall();
        // Ensure lives start at a playable value each load
        this.registry.set('lives', 3);
    }

    defineMissions() {
        this.missions = [
            { id: 'egypt', name: "Pharaoh's Scepter", treasure: 'Scepter of Dawn', requiredClues: 3, requiredItems: ['Ancient Map', 'Sun Talisman'] },
            { id: 'atlantis', name: "Neptune's Trident", treasure: "Neptune's Trident", requiredClues: 4, requiredItems: ['Ancient Map', 'Pearl Compass'] },
            { id: 'jungle', name: 'Jungle Idol', treasure: 'Emerald Idol', requiredClues: 4, requiredItems: ['Secret Journal', 'Jungle Totem'] },
            { id: 'pirate', name: 'Pirate Chest', treasure: "Captain's Chest", requiredClues: 3, requiredItems: ['Captain\'s Coin', 'Pearl Compass'] },
            { id: 'space', name: 'Astral Artifact', treasure: 'Starborn Relic', requiredClues: 5, requiredItems: ['Astral Key', 'Secret Journal'] }
        ];
        this.itemPool = ['Ancient Map', 'Sun Talisman', 'Pearl Compass', 'Secret Journal', 'Jungle Totem', 'Astral Key', "Captain's Coin"];
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
        this.bookDrops = 0;
        this.laneStates = [false, false, false];
        this.spinnerHits = 0;
        this.lockedBalls = [];
        this.miniTableActive = false;
    }

    createTable() {
        const wallOptions = { isStatic: true, restitution: 0.8, label: 'wall' };
        this.matter.add.rectangle(10, this.tableHeight / 2, 20, this.tableHeight, wallOptions);
        this.matter.add.rectangle(this.tableWidth - 10, this.tableHeight / 2, 20, this.tableHeight, wallOptions);
        this.matter.add.rectangle(this.tableWidth / 2, 10, this.tableWidth, 20, wallOptions);

        // Plunger lane divider
        this.matter.add.rectangle(520, 500, 12, 600, { ...wallOptions, label: 'divider' });

        // Drain sensors
        this.drain = this.matter.add.rectangle(this.tableWidth / 2, this.tableHeight + 10, this.tableWidth - 100, 20, { isStatic: true, isSensor: true, label: 'drain' });
        this.leftOutlane = this.matter.add.rectangle(80, this.tableHeight - 10, 60, 20, { isStatic: true, isSensor: true, label: 'leftOutlane' });
        this.kickback = this.matter.add.rectangle(80, this.tableHeight - 60, 20, 80, { isStatic: true, label: 'kickback' });

        // Side art for readability
        this.add.rectangle(520, 400, 20, 800, 0x0c1622, 0.7).setDepth(0);
        this.add.rectangle(300, 10, 600, 20, 0x22354d, 0.9).setDepth(0);
    }

    createFlippers() {
        this.flippers = {
            left: this.createFlipper(200, 700, 'left'),
            right: this.createFlipper(360, 700, 'right')
        };
    }

    createFlipper(x, y, side) {
        const width = 120;
        const height = 20;
        const body = this.matter.add.rectangle(x, y, width, height, {
            chamfer: 6,
            friction: 0,
            frictionAir: 0.01,
            label: `${side}Flipper`
        });
        const pivot = this.matter.add.circle(side === 'left' ? x - width * 0.45 : x + width * 0.45, y, 4, { isStatic: true, label: `${side}Pivot` });
        this.matter.add.constraint(body, pivot, 0, 1, { pointA: { x: side === 'left' ? -width * 0.45 : width * 0.45, y: 0 } });

        body.restAngle = side === 'left' ? Phaser.Math.DegToRad(-25) : Phaser.Math.DegToRad(25);
        body.activeAngle = side === 'left' ? Phaser.Math.DegToRad(35) : Phaser.Math.DegToRad(-35);
        MatterBody.setAngle(body, body.restAngle);
        const color = side === 'left' ? 0xff7f50 : 0x4fa8ff;
        body.sprite = this.add.rectangle(x, y, width, height, color, 0.9).setOrigin(0.5).setDepth(3);
        body.sprite.setStrokeStyle(2, 0xffffff, 0.6);
        return body;
    }

    createPlunger() {
        this.plunger = this.matter.add.rectangle(560, 740, 18, 70, { isStatic: true, label: 'plunger' });
        this.plungerPull = 0;
        this.plungerRestY = 740;
        this.matter.add.rectangle(560, 650, 30, 20, { isStatic: true, label: 'plungerStop' });
    }

    createBumpers() {
        const opts = { isStatic: true, restitution: 1.6, label: 'bumper' };
        this.bumpers = [
            this.matter.add.circle(300, 250, 24, opts),
            this.matter.add.circle(220, 320, 22, opts),
            this.matter.add.circle(380, 320, 22, opts)
        ];
        this.bumpers.forEach((b, i) => {
            const sprite = this.add.image(b.position.x, b.position.y, 'bumper').setScale(0.9 + i * 0.05);
            sprite.setTint(0xff5959);
        });
    }

    createSlingshots() {
        const opts = { isStatic: true, restitution: 1.3, label: 'slingshot' };
        this.slings = [];
        this.slings.push(this.matter.add.trapezoid(170, 620, 90, 40, 0.35, opts));
        this.slings.push(this.matter.add.trapezoid(430, 620, 90, 40, 0.35, opts));
        this.add.triangle(170, 620, 0, 30, 30, -30, -30, -30, 0xff69b4, 0.7).setStrokeStyle(2, 0xffffff, 0.5);
        this.add.triangle(430, 620, 0, 30, 30, -30, -30, -30, 0xff69b4, 0.7).setStrokeStyle(2, 0xffffff, 0.5);
    }

    createClueObjects() {
        // Bookcase
        this.books = [];
        this.bookGroup = this.add.group();
        for (let i = 0; i < 5; i++) {
            const bookX = 140 + i * 22;
            const book = this.matter.add.rectangle(bookX, 520, 15, 40, { isStatic: true, label: 'book', chamfer: 2 });
            book.alive = true;
            this.books.push(book);
            const sprite = this.add.image(bookX, 520, 'book').setOrigin(0.5, 0.5);
            this.bookGroup.add(sprite);
        }

        // Upper lanes for clue set
        this.lanes = [
            this.matter.add.rectangle(200, 120, 40, 10, { isStatic: true, isSensor: true, label: 'lane0' }),
            this.matter.add.rectangle(300, 100, 40, 10, { isStatic: true, isSensor: true, label: 'lane1' }),
            this.matter.add.rectangle(400, 120, 40, 10, { isStatic: true, isSensor: true, label: 'lane2' })
        ];

        // Spinner lane sensor
        this.spinner = this.matter.add.rectangle(480, 200, 16, 90, { isStatic: true, isSensor: true, label: 'spinner' });
    }

    createRampsAndSpinners() {
        // Ramps as sensors to award clues/items
        this.leftRamp = this.matter.add.rectangle(120, 620, 60, 30, { isStatic: true, isSensor: true, label: 'leftRamp' });
        this.rightRamp = this.matter.add.rectangle(470, 520, 60, 30, { isStatic: true, isSensor: true, label: 'rightRamp' });
        this.itemRamp = this.matter.add.rectangle(330, 460, 60, 30, { isStatic: true, isSensor: true, label: 'itemRamp' });

        // Decorative ramp arrows
        this.addTriangle(120, 610, 0xb8860b);
        this.addTriangle(470, 510, 0x00b7ff);
        this.addTriangle(330, 450, 0xfff07a);
    }

    createLocksAndTunnel() {
        this.lockSaucer = this.matter.add.circle(70, 430, 18, { isStatic: true, isSensor: true, label: 'lock' });
        this.tunnel = this.matter.add.rectangle(160, 440, 80, 40, { isStatic: true, isSensor: true, label: 'tunnel' });
        this.tunnelGate = this.matter.add.rectangle(160, 480, 120, 12, { isStatic: true, label: 'tunnelGate' });
        this.tunnelIndicator = this.add.rectangle(160, 440, 70, 40, 0x1c1f2b, 0.35).setStrokeStyle(2, 0xffd700, 0);
        this.add.text(120, 415, 'Secret Tunnel', { fontSize: '12px', fill: '#ffd700' });
    }

    addTriangle(x, y, color) {
        const tri = this.add.triangle(x, y, 0, 30, 30, -30, -30, -30, color, 0.7);
        tri.setStrokeStyle(2, color);
    }

    setupInput() {
        this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    setupCollisions() {
        this.matter.world.on('collisionstart', (event) => {
            event.pairs.forEach(pair => {
                const bodies = [pair.bodyA, pair.bodyB];
                const ballBody = bodies.find(b => b.label === 'ball');
                const other = bodies.find(b => b !== ballBody);
                if (!ballBody || !other) return;
                this.handleCollision(other, ballBody);
            });
        });
    }

    spawnBall(spawnX = 560, spawnY = 700) {
        const ball = this.matter.add.image(spawnX, spawnY, 'ball');
        ball.setCircle(10);
        ball.setBounce(0.88);
        ball.setFriction(0.005);
        ball.setFrictionAir(0.001);
        ball.body.label = 'ball';
        ball.setDepth(2);
        if (!this.balls) this.balls = [];
        this.balls.push(ball);
        return ball;
    }

    handleCollision(body, ballBody) {
        switch (body.label) {
            case 'bumper':
                this.addScore(120);
                break;
            case 'slingshot':
                this.addScore(60);
                break;
            case 'book':
                this.hitBook(body);
                break;
            case 'lane0':
            case 'lane1':
            case 'lane2':
                this.lightLane(body.label);
                break;
            case 'spinner':
                this.spinnerHits++;
                if (this.spinnerHits % 6 === 0) this.collectClue('spinner');
                this.addScore(40);
                break;
            case 'leftRamp':
            case 'rightRamp':
                this.collectClue('ramp');
                this.addScore(150);
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
            default:
                break;
        }
    }

    hitBook(book) {
        if (book.alive === false) return;
        book.alive = false;
        this.bookDrops++;
        this.addScore(200);
        // Hide the matching sprite
        const sprite = this.bookGroup.getChildren()[this.books.indexOf(book)];
        if (sprite) sprite.setVisible(false);
        if (this.bookDrops >= this.books.length) {
            this.collectClue('bookcase');
            this.time.delayedCall(1200, () => this.resetBooks());
        }
    }

    resetBooks() {
        this.bookDrops = 0;
        this.books.forEach((b, i) => {
            b.alive = true;
            b.isSensor = false;
            const sprite = this.bookGroup.getChildren()[i];
            if (sprite) sprite.setVisible(true);
        });
    }

    lightLane(label) {
        const idx = Number(label.replace('lane', ''));
        this.laneStates[idx] = true;
        this.addScore(50);
        if (this.laneStates.every(Boolean)) {
            this.collectClue('lanes');
            this.laneStates = [false, false, false];
        }
    }

    collectClue(source) {
        if (!this.activeMission) return;
        this.clueCount += 1;
        this.registry.set('clues', this.clueCount);
        // More than one path to the gate
        if (this.clueCount >= this.activeMission.requiredClues && this.hasRequiredItems()) {
            this.openTunnel();
        }
    }

    tryAwardItem() {
        if (!this.activeMission) return;
        if (this.clueCount < this.activeMission.requiredClues) {
            this.addScore(50);
            return;
        }
        const missing = this.itemPool.filter(item => !this.items.includes(item));
        if (missing.length === 0) return;
        const item = Phaser.Utils.Array.GetRandom(missing);
        this.items.push(item);
        this.registry.set('items', this.items);
        this.addScore(300);
        if (this.hasRequiredItems() && this.clueCount >= this.activeMission.requiredClues) {
            this.openTunnel();
        }
    }

    hasRequiredItems() {
        if (!this.activeMission) return false;
        return this.activeMission.requiredItems.every(req => this.items.includes(req));
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
        if (this.lockedBalls.find(b => b === ball)) return;
        this.lockedBalls.push(ball);
        MatterBody.setPosition(ball.body, { x: -100, y: -100 });
        MatterBody.setVelocity(ball.body, { x: 0, y: 0 });
        if (this.lockedBalls.length >= 2) {
            this.releaseLockedBalls();
        } else {
            // keep player going with a new ball if none remain
            if (this.balls.filter(b => b.active !== false && b.body.position.y < 1200).length === 0) {
                this.spawnBall(560, 700);
            }
        }
    }

    releaseLockedBalls() {
        const releasePoint = { x: 200, y: 400 };
        this.lockedBalls.forEach(ball => {
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
            this.addScore(2000);
        }
        this.clueCount = 0;
        this.registry.set('clues', 0);
        this.startNextMission();
    }

    startNextMission() {
        if (this.availableMissions.length === 0) {
            this.activeMission = null;
            this.registry.set('mission', 'All treasures recovered!');
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
        MatterBody.setVelocity(ball.body, { x: 4, y: -18 });
    }

    loseLife() {
        const lives = (this.registry.get('lives') || 1) - 1;
        this.registry.set('lives', lives);
        if (lives < 0) {
            this.resetGame();
            return;
        }
        this.time.delayedCall(600, () => this.spawnBall(560, 700));
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
        this.spawnBall(560, 700);
    }

    addScore(amount) {
        const score = (this.registry.get('score') || 0) + amount;
        this.registry.set('score', score);
    }

    update() {
        // Flippers swing toward target angles
        const leftTarget = this.leftKey.isDown ? this.flippers.left.activeAngle : this.flippers.left.restAngle;
        const rightTarget = this.rightKey.isDown ? this.flippers.right.activeAngle : this.flippers.right.restAngle;
        this.rotateFlipper(this.flippers.left, leftTarget);
        this.rotateFlipper(this.flippers.right, rightTarget);

        // Plunger charge/launch
        if (this.spaceKey.isDown) {
            this.plungerPull = Phaser.Math.Clamp(this.plungerPull + 0.7, 0, 35);
            MatterBody.setPosition(this.plunger, { x: this.plunger.position.x, y: this.plungerRestY + this.plungerPull });
        } else if (Phaser.Input.Keyboard.JustUp(this.spaceKey)) {
            const launchBall = this.balls.find(b => b.body && b.body.position.x > 520 && b.body.position.y > 620);
            if (launchBall) {
                MatterBody.setVelocity(launchBall.body, { x: 0, y: -20 - this.plungerPull * 0.5 });
            }
            this.plungerPull = 0;
            MatterBody.setPosition(this.plunger, { x: this.plunger.position.x, y: this.plungerRestY });
        } else {
            this.plungerPull = Phaser.Math.Clamp(this.plungerPull - 1, 0, 35);
            MatterBody.setPosition(this.plunger, { x: this.plunger.position.x, y: this.plungerRestY + this.plungerPull });
        }

        // Keep any stragglers alive
        this.balls = this.balls.filter(b => b.body);
        if (!this.miniTableActive && this.balls.length === 0) {
            this.time.delayedCall(400, () => this.spawnBall(560, 700));
        }
    }

    rotateFlipper(flipper, target) {
        const step = 0.28;
        const newAngle = Phaser.Math.Angle.RotateTo(flipper.angle, target, step);
        MatterBody.setAngle(flipper, newAngle);
        MatterBody.setAngularVelocity(flipper, 0);
        if (flipper.sprite) {
            flipper.sprite.setPosition(flipper.position.x, flipper.position.y);
            flipper.sprite.setRotation(newAngle);
        }
    }
}

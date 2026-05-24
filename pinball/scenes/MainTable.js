const MatterBody = Phaser.Physics.Matter.Matter.Body;

export class MainTable extends Phaser.Scene {
    constructor() {
        super({ key: 'MainTable' });
        this.baseWidth = 980;
        this.baseHeight = 1120;
    }

    preload() {
        this.tableWidth = this.scale.gameSize.width;
        this.tableHeight = this.scale.gameSize.height;

        const g = this.make.graphics({ x: 0, y: 0, add: false });

        this.load.svg('playfieldArt', 'assets/doctor-dude-playfield.svg', {
            width: Math.round(this.tableWidth),
            height: Math.round(this.tableHeight)
        });

        g.fillStyle(0xcfe7ff, 1);
        g.fillCircle(14, 14, 14);
        g.fillStyle(0xffffff, 0.9);
        g.fillCircle(9, 9, 5);
        g.lineStyle(2, 0x8acfff, 0.8);
        g.strokeCircle(14, 14, 13);
        g.generateTexture('ball', 28, 28);
        g.clear();

        g.fillStyle(0x34ddff, 1);
        g.fillCircle(36, 36, 34);
        g.fillStyle(0x17314e, 1);
        g.fillCircle(36, 36, 18);
        g.lineStyle(6, 0xe7ffff, 0.8);
        g.strokeCircle(36, 36, 29);
        g.lineStyle(2, 0xa9ffff, 0.7);
        g.strokeCircle(36, 36, 22);
        g.generateTexture('bumper', 72, 72);
        g.clear();

        g.fillStyle(0xe0f6ff, 1);
        g.fillCircle(8, 8, 8);
        g.fillStyle(0x15253e, 1);
        g.fillCircle(8, 8, 3);
        g.lineStyle(2, 0xffffff, 0.75);
        g.strokeCircle(8, 8, 7);
        g.generateTexture('post', 16, 16);
        g.clear();

        g.fillStyle(0xff8758, 1);
        g.fillRoundedRect(0, 0, 58, 22, 7);
        g.lineStyle(2, 0xfff3e6, 0.8);
        g.strokeRoundedRect(0, 0, 58, 22, 7);
        g.generateTexture('target', 58, 22);
        g.clear();

        g.fillStyle(0x9cf7ff, 1);
        g.fillCircle(12, 12, 12);
        g.fillStyle(0x081421, 1);
        g.fillCircle(12, 12, 5);
        g.lineStyle(2, 0xffffff, 0.65);
        g.strokeCircle(12, 12, 10);
        g.generateTexture('laneLight', 24, 24);
        g.clear();

        this.buildFlipperTexture('flipperL', 0xff9558, 1);
        this.buildFlipperTexture('flipperR', 0x5ab7ff, -1);
    }

    buildFlipperTexture(key, color, direction) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        const width = 148;
        const height = 30;
        const pivotX = direction === 1 ? 28 : width - 28;
        const tipX = direction === 1 ? width - 18 : 18;
        const left = Math.min(pivotX, tipX);
        const right = Math.max(pivotX, tipX);

        g.fillStyle(color, 1);
        g.fillCircle(pivotX, height / 2, 18);
        g.fillRoundedRect(left, 4, right - left, height - 8, 12);
        g.fillCircle(tipX, height / 2, 10);
        g.lineStyle(3, 0xffffff, 0.35);
        g.strokeCircle(pivotX, height / 2, 15);
        g.strokeRoundedRect(left, 4, right - left, height - 8, 12);
        g.strokeCircle(tipX, height / 2, 8);
        g.fillStyle(0xffffff, 0.12);
        g.fillRoundedRect(left + 8, 8, Math.max(24, right - left - 18), 5, 3);
        g.generateTexture(key, width, height);
    }

    create() {
        this.tableWidth = this.scale.gameSize.width;
        this.tableHeight = this.scale.gameSize.height;
        this.scaleX = this.tableWidth / this.baseWidth;
        this.scaleY = this.tableHeight / this.baseHeight;

        this.drawBackdrop();
        this.add.image(this.tableWidth / 2, this.tableHeight / 2, 'playfieldArt').setDepth(-5);
        this.drawTableShell();

        if (!this.scene.isActive('UI')) this.scene.launch('UI');

        this.matter.world.setBounds(0, 0, this.tableWidth, this.tableHeight, 42, true, true, true, false);
        this.matter.world.setGravity(0, 0.82);

        this.defineMissions();
        this.initState();

        this.createTable();
        this.createFlippers();
        this.createPlunger();
        this.createBumpers();
        this.createSlingshots();
        this.createTargets();
        this.createTopLanes();
        this.createRamps();
        this.createLocksAndTunnel();
        this.createSkillShot();
        this.setupInput();
        this.setupCollisions();

        this.registry.set('lives', 3);
        this.registry.set('score', this.registry.get('score') || 0);
        this.registry.set('combo', 0);
        this.registry.set('reactorCharge', 0);
        this.registry.set('status', 'Charge the plunger and open with the reactor lane.');
        this.startNextMission();
        this.spawnBall();

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
    }

    drawBackdrop() {
        const bg = this.add.graphics().setDepth(-20);
        bg.fillStyle(0x09101a, 1);
        bg.fillRect(0, 0, this.tableWidth, this.tableHeight);

        for (let i = 0; i < 12; i++) {
            const x = this.tableWidth * (0.08 + (i % 4) * 0.23);
            const y = this.tableHeight * (0.1 + Math.floor(i / 4) * 0.26);
            const radius = this.tableWidth * (0.05 + (i % 3) * 0.02);
            const tint = [0x37e1ff, 0xff8d4e, 0x82ff9d, 0xc295ff][i % 4];
            bg.fillStyle(tint, 0.1);
            bg.fillCircle(x, y, radius);
        }
    }

    drawTableShell() {
        const frame = this.add.graphics().setDepth(-10);
        frame.fillStyle(0x09101a, 0.82);
        frame.fillRoundedRect(10, 10, this.tableWidth - 20, this.tableHeight - 20, 28);
        frame.lineStyle(4, 0x63e3ff, 0.3);
        frame.strokeRoundedRect(10, 10, this.tableWidth - 20, this.tableHeight - 20, 28);
        frame.lineStyle(1, 0xffffff, 0.08);
        frame.strokeRoundedRect(22, 22, this.tableWidth - 44, this.tableHeight - 44, 22);

        const apronHeight = this.sy(112);
        const apronY = this.tableHeight - apronHeight - this.sy(14);
        frame.fillStyle(0x08111e, 0.68);
        frame.fillRoundedRect(this.sx(108), apronY, this.tableWidth - this.sx(216), apronHeight, 24);
        frame.lineStyle(2, 0x68e6ff, 0.12);
        frame.strokeRoundedRect(this.sx(108), apronY, this.tableWidth - this.sx(216), apronHeight, 24);

        this.add.text(this.tableWidth / 2, apronY + apronHeight * 0.38, 'DOCTOR DUDE LAB', {
            fontFamily: 'Space Grotesk',
            fontSize: `${Math.round(this.sy(42))}px`,
            fontStyle: '700',
            color: '#e9fbff',
            letterSpacing: 6
        }).setOrigin(0.5).setAlpha(0.98).setDepth(-8);

        this.add.text(this.tableWidth / 2, apronY + apronHeight * 0.72, 'Fast loops. Clean catches. Reactor surge multiball.', {
            fontFamily: 'Space Grotesk',
            fontSize: `${Math.round(this.sy(16))}px`,
            color: '#84edff'
        }).setOrigin(0.5).setAlpha(0.95).setDepth(-8);
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

        this.items = [...this.registry.get('items')];
        this.treasures = [...this.registry.get('treasures')];
        this.clueCount = 0;
        this.targetDrops = 0;
        this.spinnerHits = 0;
        this.reactorCharge = 0;
        this.tunnelOpen = false;
        this.skillShotLit = true;
        this.comboCount = 0;
        this.lastShotType = null;
        this.ballSerial = 0;
        this.pendingRespawn = null;
        this.comboWindowEvent = null;
        this.miniTableActive = false;
        this.lockedBalls = [];
        this.balls = [];
        this.laneStates = [false, false, false];

        this.registry.set('clues', 0);
        this.registry.set('combo', 0);
        this.registry.set('reactorCharge', 0);
        this.registry.set('items', this.items);
        this.registry.set('treasures', this.treasures);
    }

    createTable() {
        const wallOptions = { isStatic: true, restitution: 0.82, friction: 0, label: 'wall' };
        const addWall = (x, y, w, h, angle = 0, color = 0x111a29, alpha = 0.25, label = 'wall') => {
            const body = this.matter.add.rectangle(x, y, w, h, { ...wallOptions, angle, label });
            this.add.rectangle(x, y, w, h, color, alpha).setRotation(angle).setDepth(0);
            return body;
        };

        const leftRail = this.sx(88);
        const topY = this.sy(90);
        const shooterInnerX = this.tableWidth - this.sx(168);
        const shooterOuterX = this.tableWidth - this.sx(70);

        addWall(leftRail - this.sx(46), this.tableHeight * 0.5, this.sx(24), this.tableHeight * 0.96, 0, 0x132136, 0.7);
        addWall(this.tableWidth - leftRail + this.sx(46), this.tableHeight * 0.5, this.sx(24), this.tableHeight * 0.96, 0, 0x132136, 0.7);
        addWall((leftRail + shooterInnerX) / 2, this.sy(48), shooterInnerX - leftRail, this.sy(24), 0, 0x132136, 0.55);

        addWall(shooterInnerX, this.tableHeight * 0.52, this.sx(14), this.tableHeight * 0.92, 0, 0x1b2940, 0.75, 'shooterWall');
        addWall(shooterOuterX + this.sx(22), this.tableHeight * 0.52, this.sx(12), this.tableHeight * 0.92, 0, 0x1b2940, 0.75, 'shooterWall');

        this.addGuideWall(addWall, { x: this.sx(142), y: this.tableHeight - this.sy(94) }, { x: this.sx(166), y: topY + this.sy(62) }, this.sx(24), 0x24344b, 0.95);
        this.addGuideWall(addWall, { x: this.tableWidth - this.sx(142), y: this.tableHeight - this.sy(94) }, { x: this.tableWidth - this.sx(166), y: topY + this.sy(70) }, this.sx(24), 0x24344b, 0.95);

        this.addGuideWall(addWall, { x: this.sx(176), y: topY + this.sy(66) }, { x: this.sx(356), y: topY + this.sy(18) }, this.sx(16), 0x314467, 0.85);
        this.addGuideWall(addWall, { x: this.tableWidth - this.sx(176), y: topY + this.sy(66) }, { x: this.tableWidth - this.sx(356), y: topY + this.sy(18) }, this.sx(16), 0x314467, 0.85);

        this.addGuideWall(addWall, { x: shooterInnerX - this.sx(20), y: this.sy(160) }, { x: this.tableWidth - this.sx(198), y: this.sy(132) }, this.sx(12), 0x573f21, 0.9);
        this.addGuideWall(addWall, { x: this.tableWidth - this.sx(204), y: this.sy(145) }, { x: this.tableWidth - this.sx(286), y: this.sy(196) }, this.sx(10), 0x573f21, 0.75);

        this.leftOrbit = this.matter.add.rectangle(this.sx(132), this.sy(296), this.sx(26), this.sy(174), { isStatic: true, isSensor: true, label: 'leftOrbit' });
        this.rightOrbit = this.matter.add.rectangle(this.tableWidth - this.sx(214), this.sy(282), this.sx(26), this.sy(174), { isStatic: true, isSensor: true, label: 'rightOrbit' });
        this.spinner = this.matter.add.rectangle(this.tableWidth * 0.5, this.sy(232), this.sx(16), this.sy(96), { isStatic: true, isSensor: true, label: 'spinner' });
        this.spinnerArm = this.add.rectangle(this.tableWidth * 0.5, this.sy(232), this.sx(10), this.sy(84), 0x8fefff, 0.4)
            .setStrokeStyle(2, 0xffffff, 0.28)
            .setDepth(2);

        this.createLowerGuides(addWall);

        this.leftOutlane = this.matter.add.rectangle(this.sx(92), this.tableHeight - this.sy(142), this.sx(42), this.sy(154), { isStatic: true, isSensor: true, label: 'leftOutlane' });
        this.leftInlane = this.matter.add.rectangle(this.sx(214), this.tableHeight - this.sy(174), this.sx(46), this.sy(110), { isStatic: true, isSensor: true, label: 'leftInlane' });
        this.rightInlane = this.matter.add.rectangle(this.tableWidth - this.sx(214), this.tableHeight - this.sy(174), this.sx(46), this.sy(110), { isStatic: true, isSensor: true, label: 'rightInlane' });
        this.rightOutlane = this.matter.add.rectangle(this.tableWidth - this.sx(92), this.tableHeight - this.sy(142), this.sx(42), this.sy(154), { isStatic: true, isSensor: true, label: 'rightOutlane' });
        this.drain = this.matter.add.rectangle(this.tableWidth / 2, this.tableHeight + this.sy(8), this.tableWidth - this.sx(220), this.sy(20), { isStatic: true, isSensor: true, label: 'drain' });

        this.shooterExit = this.matter.add.rectangle(this.tableWidth - this.sx(112), this.sy(178), this.sx(46), this.sy(132), { isStatic: true, isSensor: true, label: 'shooterExit' });
        this.ballSaveGuide = this.add.rectangle(this.sx(74), this.tableHeight - this.sy(120), this.sx(16), this.sy(118), 0x3ce8ff, 0.08)
            .setStrokeStyle(2, 0x8ff7ff, 0.25)
            .setDepth(1);
    }

    createLowerGuides(addWall) {
        const outerLeftTop = { x: this.sx(146), y: this.tableHeight - this.sy(334) };
        const outerLeftBottom = { x: this.sx(98), y: this.tableHeight - this.sy(104) };
        const innerLeftTop = { x: this.sx(258), y: this.tableHeight - this.sy(340) };
        const innerLeftBottom = { x: this.sx(184), y: this.tableHeight - this.sy(138) };
        const slingLeftTop = { x: this.sx(306), y: this.tableHeight - this.sy(270) };
        const slingLeftBottom = { x: this.sx(224), y: this.tableHeight - this.sy(204) };

        const outerRightTop = { x: this.tableWidth - outerLeftTop.x, y: outerLeftTop.y };
        const outerRightBottom = { x: this.tableWidth - outerLeftBottom.x, y: outerLeftBottom.y };
        const innerRightTop = { x: this.tableWidth - innerLeftTop.x, y: innerLeftTop.y };
        const innerRightBottom = { x: this.tableWidth - innerLeftBottom.x, y: innerLeftBottom.y };
        const slingRightTop = { x: this.tableWidth - slingLeftTop.x, y: slingLeftTop.y };
        const slingRightBottom = { x: this.tableWidth - slingLeftBottom.x, y: slingLeftBottom.y };

        this.addGuideWall(addWall, outerLeftTop, outerLeftBottom, this.sx(18), 0x42315a, 0.95);
        this.addGuideWall(addWall, innerLeftTop, innerLeftBottom, this.sx(16), 0x35264d, 0.95);
        this.addGuideWall(addWall, slingLeftTop, slingLeftBottom, this.sx(18), 0x342341, 1);

        this.addGuideWall(addWall, outerRightTop, outerRightBottom, this.sx(18), 0x42315a, 0.95);
        this.addGuideWall(addWall, innerRightTop, innerRightBottom, this.sx(16), 0x35264d, 0.95);
        this.addGuideWall(addWall, slingRightTop, slingRightBottom, this.sx(18), 0x342341, 1);

        this.addPost(outerLeftTop.x - this.sx(8), outerLeftTop.y + this.sy(20));
        this.addPost(innerLeftBottom.x + this.sx(14), innerLeftBottom.y + this.sy(14));
        this.addPost(outerRightTop.x + this.sx(8), outerRightTop.y + this.sy(20));
        this.addPost(innerRightBottom.x - this.sx(14), innerRightBottom.y + this.sy(14));

        this.add.text(this.sx(126), this.tableHeight - this.sy(236), 'SAVE', {
            fontFamily: 'Space Grotesk',
            fontSize: `${Math.round(this.sy(18))}px`,
            color: '#84f0ff'
        }).setAngle(-66).setAlpha(0.3).setDepth(1);
    }

    addGuideWall(addWall, start, end, thickness, color, alpha) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const length = Math.sqrt((dx * dx) + (dy * dy));
        const angle = Math.atan2(dy, dx);
        return addWall((start.x + end.x) / 2, (start.y + end.y) / 2, length, thickness, angle, color, alpha);
    }

    addPost(x, y) {
        this.matter.add.circle(x, y, this.sx(7), { isStatic: true, restitution: 1.15, label: 'post' });
        this.add.image(x, y, 'post').setScale(this.scaleX * 1.02).setDepth(2);
    }

    createFlippers() {
        const y = this.tableHeight - this.sy(128);
        this.flippers = {
            left: this.createFlipper(this.tableWidth * 0.402, y, 'left'),
            right: this.createFlipper(this.tableWidth * 0.598, y, 'right')
        };
    }

    createFlipper(x, y, side) {
        const width = this.sx(136);
        const height = this.sy(24);
        const pivotOffset = width * 0.39;
        const body = this.matter.add.rectangle(x, y, width, height, {
            chamfer: { radius: 10 },
            friction: 0,
            frictionAir: 0.008,
            restitution: 0.2,
            label: `${side}Flipper`
        });
        const pivotX = side === 'left' ? x - pivotOffset : x + pivotOffset;
        const pivot = this.matter.add.circle(pivotX, y, this.sx(6), { isStatic: true, label: `${side}Pivot` });
        this.matter.add.constraint(body, pivot, 0, 1, { pointA: { x: side === 'left' ? -pivotOffset : pivotOffset, y: 0 } });

        body.restAngle = side === 'left' ? Phaser.Math.DegToRad(25) : Phaser.Math.DegToRad(-25);
        body.activeAngle = side === 'left' ? Phaser.Math.DegToRad(-33) : Phaser.Math.DegToRad(33);
        MatterBody.setAngle(body, body.restAngle);
        body.pivotPoint = { x: pivotX, y };
        body.maxStep = 0.44;
        body.sprite = this.add.image(pivotX, y, side === 'left' ? 'flipperL' : 'flipperR')
            .setOrigin(side === 'left' ? 28 / 148 : (148 - 28) / 148, 0.5)
            .setScale(this.scaleX, this.scaleY)
            .setDepth(5);
        return body;
    }

    createPlunger() {
        const x = this.tableWidth - this.sx(112);
        const y = this.tableHeight - this.sy(122);
        this.plunger = this.matter.add.rectangle(x, y, this.sx(18), this.sy(84), { isStatic: true, label: 'plunger' });
        this.plungerRestY = y;
        this.plungerPull = 0;
        this.plungerGlow = this.add.rectangle(x, y, this.sx(28), this.sy(92), 0xaed0ff, 0.7)
            .setStrokeStyle(2, 0xffffff, 0.7)
            .setDepth(3);
        this.launchMeter = this.add.rectangle(x + this.sx(34), y + this.sy(36), this.sx(10), 0, 0xffdd6b, 0.9)
            .setOrigin(0.5, 1)
            .setDepth(3);
    }

    createBumpers() {
        const positions = [
            { x: this.tableWidth * 0.5, y: this.sy(332), tint: 0x35ddff },
            { x: this.tableWidth * 0.36, y: this.sy(392), tint: 0xff9862 },
            { x: this.tableWidth * 0.64, y: this.sy(392), tint: 0x76ffab }
        ];
        this.bumpers = positions.map((cfg) => {
            const body = this.matter.add.circle(cfg.x, cfg.y, this.sx(28), { isStatic: true, restitution: 1.38, label: 'bumper' });
            body.sprite = this.add.image(cfg.x, cfg.y, 'bumper').setTint(cfg.tint).setScale(this.scaleX * 0.96).setDepth(2);
            body.glow = this.add.circle(cfg.x, cfg.y, this.sx(42), cfg.tint, 0.08).setDepth(1);
            return body;
        });
    }

    createSlingshots() {
        const leftX = this.tableWidth * 0.29;
        const rightX = this.tableWidth * 0.71;
        const y = this.tableHeight - this.sy(248);
        this.slings = [
            this.matter.add.trapezoid(leftX, y, this.sx(112), this.sy(44), 0.35, { isStatic: true, restitution: 1.24, label: 'slingshot' }),
            this.matter.add.trapezoid(rightX, y, this.sx(112), this.sy(44), 0.35, { isStatic: true, restitution: 1.24, label: 'slingshot' })
        ];
        this.slingSprites = this.slings.map((sling, index) => {
            const tint = index === 0 ? 0xffbf8b : 0x8bcfff;
            return this.add.triangle(sling.position.x, sling.position.y, 0, this.sy(30), this.sx(42), -this.sy(24), -this.sx(42), -this.sy(24), tint, 0.86)
                .setStrokeStyle(2, 0xffffff, 0.36)
                .setDepth(3);
        });
    }

    createTargets() {
        const x = this.sx(230);
        const startY = this.tableHeight * 0.54;
        this.targetGroup = this.add.group();
        this.targets = [];
        this.targetIndicators = [];

        for (let i = 0; i < 3; i++) {
            const y = startY + i * this.sy(48);
            const target = this.matter.add.rectangle(x, y, this.sx(42), this.sy(20), { isStatic: true, label: 'target', chamfer: { radius: 4 } });
            target.alive = true;
            this.targets.push(target);
            const sprite = this.add.image(x, y, 'target').setAngle(-90).setScale(this.scaleX, this.scaleY).setDepth(2);
            this.targetGroup.add(sprite);
            this.targetIndicators.push(this.add.circle(x + this.sx(34), y, this.sx(6), 0xff8758, 0.28).setDepth(2));
        }
    }

    createTopLanes() {
        const laneData = [
            { x: this.tableWidth * 0.27, y: this.sy(98), label: 'lane0', text: 'A' },
            { x: this.tableWidth * 0.48, y: this.sy(74), label: 'lane1', text: 'B' },
            { x: this.tableWidth * 0.67, y: this.sy(98), label: 'lane2', text: 'C' }
        ];
        this.lanes = laneData.map((lane) => this.matter.add.rectangle(lane.x, lane.y, this.sx(56), this.sy(14), {
            isStatic: true,
            isSensor: true,
            label: lane.label
        }));
        this.laneLights = laneData.map((lane) => this.add.image(lane.x, lane.y - this.sy(26), 'laneLight').setScale(this.scaleX * 0.92).setAlpha(0.22).setDepth(2));
        this.laneLabels = laneData.map((lane) => this.add.text(lane.x, lane.y - this.sy(54), lane.text, {
            fontFamily: 'Space Grotesk',
            fontSize: `${Math.round(this.sy(24))}px`,
            fontStyle: '700',
            color: '#dffcff'
        }).setOrigin(0.5).setAlpha(0.38).setDepth(2));
    }

    createRamps() {
        this.leftRamp = this.matter.add.rectangle(this.tableWidth * 0.24, this.tableHeight * 0.71, this.sx(72), this.sy(24), { isStatic: true, isSensor: true, label: 'leftRamp' });
        this.rightRamp = this.matter.add.rectangle(this.tableWidth * 0.76, this.tableHeight * 0.71, this.sx(72), this.sy(24), { isStatic: true, isSensor: true, label: 'rightRamp' });
        this.itemRamp = this.matter.add.rectangle(this.tableWidth * 0.5, this.tableHeight * 0.515, this.sx(74), this.sy(24), { isStatic: true, isSensor: true, label: 'itemRamp' });

        this.leftRampLamp = this.addChevron(this.tableWidth * 0.24, this.tableHeight * 0.71, 0xffb85b);
        this.rightRampLamp = this.addChevron(this.tableWidth * 0.76, this.tableHeight * 0.71, 0x5ce1ff);
        this.itemRampLamp = this.addChevron(this.tableWidth * 0.5, this.tableHeight * 0.515, 0xa0ff7a);
    }

    createLocksAndTunnel() {
        this.lockSaucer = this.matter.add.circle(this.sx(148), this.tableHeight * 0.5, this.sx(18), { isStatic: true, isSensor: true, label: 'lock' });
        this.lockGlow = this.add.circle(this.sx(148), this.tableHeight * 0.5, this.sx(26), 0x31ddff, 0.18)
            .setStrokeStyle(2, 0xffffff, 0.45)
            .setDepth(2);

        this.tunnel = this.matter.add.rectangle(this.tableWidth * 0.66, this.tableHeight * 0.418, this.sx(96), this.sy(54), { isStatic: true, isSensor: true, label: 'tunnel' });
        this.tunnelGate = this.matter.add.rectangle(this.tableWidth * 0.66, this.tableHeight * 0.462, this.sx(126), this.sy(14), { isStatic: true, label: 'tunnelGate' });
        this.tunnelIndicator = this.add.rectangle(this.tableWidth * 0.66, this.tableHeight * 0.418, this.sx(96), this.sy(54), 0x182030, 0.22)
            .setStrokeStyle(2, 0xffd86b, 0)
            .setDepth(2);
        this.tunnelLabel = this.add.text(this.tableWidth * 0.66, this.tableHeight * 0.372, 'PORTAL', {
            fontFamily: 'Space Grotesk',
            fontSize: `${Math.round(this.sy(24))}px`,
            fontStyle: '700',
            color: '#ffe48b'
        }).setOrigin(0.5).setAlpha(0.36).setDepth(2);
    }

    createSkillShot() {
        const x = this.tableWidth - this.sx(116);
        const y = this.tableHeight - this.sy(406);
        this.skillShot = this.matter.add.rectangle(x, y, this.sx(28), this.sy(106), {
            isStatic: true,
            isSensor: true,
            label: 'skillShot'
        });
        this.skillShotLamp = this.add.rectangle(x, y, this.sx(30), this.sy(110), 0xffde59, 0.16)
            .setStrokeStyle(2, 0xfff2b3, 0.42)
            .setDepth(2);
        this.skillShotLabel = this.add.text(x - this.sx(28), y - this.sy(118), 'SKILL', {
            fontFamily: 'Space Grotesk',
            fontSize: `${Math.round(this.sy(20))}px`,
            fontStyle: '700',
            color: '#ffdf70'
        }).setOrigin(0.5).setAngle(68).setAlpha(0.34).setDepth(2);
    }

    addChevron(x, y, color) {
        const chevron = this.add.graphics().setDepth(2);
        chevron.lineStyle(3, color, 0.58);
        chevron.beginPath();
        chevron.moveTo(x - this.sx(34), y + this.sy(16));
        chevron.lineTo(x, y - this.sy(20));
        chevron.lineTo(x + this.sx(34), y + this.sy(16));
        chevron.strokePath();
        chevron.lineStyle(1, 0xffffff, 0.2);
        chevron.beginPath();
        chevron.moveTo(x - this.sx(18), y + this.sy(10));
        chevron.lineTo(x, y - this.sy(8));
        chevron.lineTo(x + this.sx(18), y + this.sy(10));
        chevron.strokePath();
        return chevron;
    }

    setupInput() {
        this.leftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
        this.rightKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
        this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
    }

    setupCollisions() {
        this.collisionHandler = (event) => {
            event.pairs.forEach((pair) => {
                const bodies = [pair.bodyA, pair.bodyB];
                const ballBody = bodies.find((b) => b.label === 'ball');
                const other = bodies.find((b) => b !== ballBody);
                if (!ballBody || !other) return;
                this.handleCollision(other, ballBody.gameObject || ballBody);
            });
        };
        this.matter.world.on('collisionstart', this.collisionHandler);
    }

    spawnBall(spawnX = null, spawnY = null, options = {}) {
        const laneX = this.tableWidth - this.sx(112);
        const laneY = this.tableHeight - this.sy(194);
        const ball = this.matter.add.image(spawnX ?? laneX, spawnY ?? laneY, 'ball');
        ball.setCircle(this.sx(12));
        ball.setBounce(0.92);
        ball.setFriction(0.002);
        ball.setFrictionAir(0.0008);
        ball.setDepth(6);
        ball.body.label = 'ball';
        ball.ballId = ++this.ballSerial;
        ball.isLocked = false;
        ball.hasExitedShooterLane = false;
        ball.isInShooterLane = spawnX == null && spawnY == null;
        ball.isReadyToLaunch = ball.isInShooterLane;
        if (ball.isReadyToLaunch) {
            ball.setStatic(true);
            MatterBody.setPosition(ball.body, { x: laneX, y: laneY });
        }
        if (options.velocity) {
            MatterBody.setVelocity(ball.body, options.velocity);
            ball.isReadyToLaunch = false;
        }
        this.balls.push(ball);
        return ball;
    }

    handleCollision(body, ball) {
        switch (body.label) {
            case 'bumper':
                this.flashBumper(body);
                this.addScore(180);
                break;
            case 'slingshot':
                this.flashSling(body.position.x);
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
                this.registerShot(body.label);
                this.collectClue();
                this.addScore(140);
                break;
            case 'leftInlane':
            case 'rightInlane':
                this.addScore(70);
                this.advanceReactor(3);
                break;
            case 'spinner':
                this.hitSpinner();
                break;
            case 'leftRamp':
            case 'rightRamp':
                this.registerShot(body.label);
                this.collectClue();
                this.addScore(240);
                break;
            case 'itemRamp':
                this.registerShot('itemRamp');
                this.tryAwardItem();
                break;
            case 'skillShot':
                this.handleSkillShot();
                break;
            case 'lock':
                this.lockBall(ball);
                break;
            case 'shooterExit':
                this.exitShooterLane(ball);
                break;
            case 'tunnel':
                if (this.tunnelOpen) this.launchMiniTable();
                break;
            case 'leftOutlane':
                this.triggerKickback(ball);
                break;
            case 'rightOutlane':
            case 'drain':
                this.onDrain(ball);
                break;
            default:
                break;
        }
    }

    flashBumper(body) {
        if (!body?.glow || !body?.sprite) return;
        body.glow.setAlpha(0.24);
        body.sprite.setScale(this.scaleX * 1.08);
        this.tweens.add({
            targets: [body.glow, body.sprite],
            alpha: { from: 0.24, to: 0.08 },
            scaleX: this.scaleX * 0.96,
            scaleY: this.scaleY * 0.96,
            duration: 120,
            yoyo: true
        });
    }

    flashSling(x) {
        const idx = x < this.tableWidth / 2 ? 0 : 1;
        const sprite = this.slingSprites[idx];
        if (!sprite) return;
        sprite.setAlpha(1);
        this.tweens.add({ targets: sprite, alpha: 0.86, duration: 90, yoyo: true });
    }

    hitSpinner() {
        this.spinnerHits += 1;
        if (this.spinnerArm) this.spinnerArm.rotation += Phaser.Math.DegToRad(40);
        if (this.spinnerHits % 6 === 0) this.collectClue();
        this.registerShot('spinner');
        this.addScore(70);
    }

    handleSkillShot() {
        if (!this.skillShotLit) return;
        this.skillShotLit = false;
        this.skillShotLamp.setFillStyle(0xffde59, 0.04);
        this.skillShotLabel.setAlpha(0.16);
        this.registry.set('status', 'Skill shot lit the reactor feed.');
        this.advanceReactor(20);
        this.addScore(1400);
    }

    exitShooterLane(ball) {
        if (!ball?.body || ball.isLocked || ball.hasExitedShooterLane) return;
        if (ball.body.position.x < this.tableWidth - this.sx(154)) return;
        ball.hasExitedShooterLane = true;
        ball.isInShooterLane = false;
        ball.isReadyToLaunch = false;
        MatterBody.setPosition(ball.body, {
            x: this.tableWidth - this.sx(224),
            y: this.sy(164)
        });
        MatterBody.setVelocity(ball.body, { x: -7.2, y: 1.2 });
        this.time.delayedCall(700, () => {
        if (ball?.body) ball.hasExitedShooterLane = false;
        });
    }

    findShooterLaneBall() {
        return this.balls.find((ball) => {
            if (!ball?.body || ball.isLocked) return false;
            const { x, y } = ball.body.position;
            return ball.isInShooterLane || (x > this.tableWidth - this.sx(190) && y > this.tableHeight - this.sy(420));
        });
    }

    hitTarget(target) {
        if (target.alive === false) return;
        target.alive = false;
        target.isSensor = true;
        this.targetDrops += 1;
        this.addScore(280);
        const idx = this.targets.indexOf(target);
        const sprite = this.targetGroup.getChildren()[idx];
        if (sprite) sprite.setVisible(false);
        if (this.targetIndicators[idx]) this.targetIndicators[idx].setAlpha(0.06);
        if (this.targetDrops >= this.targets.length) {
            this.collectClue();
            this.registry.set('status', 'Target bank cleared. Resetting bank.');
            this.time.delayedCall(950, () => this.resetTargets());
        }
    }

    resetTargets() {
        this.targetDrops = 0;
        this.targets.forEach((target, i) => {
            target.alive = true;
            target.isSensor = false;
            const sprite = this.targetGroup.getChildren()[i];
            if (sprite) sprite.setVisible(true);
            if (this.targetIndicators[i]) this.targetIndicators[i].setAlpha(0.28);
        });
    }

    lightLane(label) {
        const idx = Number(label.replace('lane', ''));
        if (this.laneStates[idx]) return;
        this.laneStates[idx] = true;
        this.addScore(90);
        this.registerShot(label);
        if (this.laneLights[idx]) this.laneLights[idx].setAlpha(1);
        if (this.laneLabels[idx]) this.laneLabels[idx].setAlpha(0.92);
        if (this.laneStates.every(Boolean)) {
            this.collectClue();
            this.laneStates = [false, false, false];
            this.laneLights.forEach((light) => light.setAlpha(0.22));
            this.laneLabels.forEach((labelText) => labelText.setAlpha(0.38));
            this.registry.set('status', 'Top lanes completed. Clue secured.');
        }
    }

    collectClue() {
        if (!this.activeMission) return;
        this.clueCount += 1;
        this.registry.set('clues', this.clueCount);
        this.registry.set('status', `${this.activeMission.name}: clue ${this.clueCount}/${this.activeMission.requiredClues}`);
        this.advanceReactor(7);
        if (this.clueCount >= this.activeMission.requiredClues && this.hasRequiredItems()) {
            this.openTunnel();
        }
    }

    tryAwardItem() {
        if (!this.activeMission) return;
        if (this.clueCount < this.activeMission.requiredClues) {
            this.registry.set('status', 'Item lane is live after enough clues.');
            this.addScore(90);
            return;
        }
        const missing = this.itemPool.filter((item) => !this.items.includes(item));
        if (!missing.length) {
            this.addScore(100);
            return;
        }
        const item = Phaser.Utils.Array.GetRandom(missing);
        this.items.push(item);
        this.registry.set('items', [...this.items]);
        this.registry.set('status', `Recovered ${item}.`);
        this.advanceReactor(12);
        this.addScore(360);
        if (this.hasRequiredItems() && this.clueCount >= this.activeMission.requiredClues) {
            this.openTunnel();
        }
    }

    hasRequiredItems() {
        if (!this.activeMission) return false;
        return this.activeMission.requiredItems.every((required) => this.items.includes(required));
    }

    openTunnel() {
        if (this.tunnelOpen) return;
        this.tunnelOpen = true;
        this.tunnelGate.isSensor = true;
        this.tunnelIndicator.setStrokeStyle(3, 0xffd86b, 1).setFillStyle(0x4a3814, 0.18);
        this.tunnelLabel.setAlpha(0.9);
        this.registry.set('status', 'Portal open. Shoot the tunnel.');
    }

    closeTunnel() {
        this.tunnelOpen = false;
        if (!this.tunnelGate) return;
        this.tunnelGate.isSensor = false;
        this.tunnelIndicator.setStrokeStyle(2, 0xffd86b, 0).setFillStyle(0x182030, 0.22);
        this.tunnelLabel.setAlpha(0.36);
    }

    lockBall(ball) {
        if (!ball?.body || this.lockedBalls.includes(ball)) return;
        this.lockedBalls.push(ball);
        ball.isLocked = true;
        ball.setVisible(false);
        MatterBody.setPosition(ball.body, { x: -200, y: -200 });
        MatterBody.setVelocity(ball.body, { x: 0, y: 0 });
        this.lockGlow.setAlpha(0.34 + this.lockedBalls.length * 0.12);
        this.registry.set('status', `Ball lock ${this.lockedBalls.length}/2.`);
        this.advanceReactor(14);
        if (this.lockedBalls.length >= 2) {
            this.releaseLockedBalls();
        } else if (this.getActiveBalls().length === 0) {
            this.spawnBall();
        }
    }

    releaseLockedBalls() {
        const releasePoint = { x: this.tableWidth * 0.32, y: this.tableHeight * 0.46 };
        this.lockedBalls.forEach((ball, index) => {
            ball.isLocked = false;
            ball.setVisible(true);
            MatterBody.setPosition(ball.body, releasePoint);
            MatterBody.setVelocity(ball.body, { x: index === 0 ? -4 : 4, y: -13 });
        });
        this.lockedBalls = [];
        this.lockGlow.setAlpha(0.18);
        this.registry.set('status', 'Core surge multiball.');
        this.advanceReactor(24);
        this.addScore(2200);
    }

    launchMiniTable() {
        if (this.miniTableActive || !this.activeMission) return;
        this.miniTableActive = true;
        this.closeTunnel();
        this.cameras.main.setAlpha(0.12);
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
                    this.registry.set('status', 'Portal challenge failed. One clue lost.');
                }
            }
        });
        this.scene.pause();
    }

    finishMission() {
        if (this.activeMission && !this.treasures.includes(this.activeMission.treasure)) {
            this.treasures.push(this.activeMission.treasure);
            this.registry.set('treasures', [...this.treasures]);
            this.addScore(2600);
        }
        this.clueCount = 0;
        this.registry.set('clues', 0);
        this.registry.set('status', `${this.activeMission.name} cleared.`);
        this.advanceReactor(22);
        this.startNextMission();
    }

    startNextMission() {
        if (this.availableMissions.length === 0) {
            this.activeMission = null;
            this.registry.set('mission', 'All lab modules cleared');
            this.registry.set('clueTarget', 0);
            this.registry.set('requiredItems', 'None');
            this.registry.set('status', 'All missions cleared. Keep stacking multiballs.');
            return;
        }
        this.activeMission = this.availableMissions.shift();
        this.registry.set('mission', this.activeMission.name);
        this.registry.set('clueTarget', this.activeMission.requiredClues);
        this.registry.set('requiredItems', this.activeMission.requiredItems.join(', '));
        this.registry.set('status', `Mode ready: ${this.activeMission.name}`);
        this.closeTunnel();
    }

    onDrain(ball) {
        if (!ball?.body) return;
        this.destroyBall(ball);
        this.skillShotLit = true;
        this.skillShotLamp.setFillStyle(0xffde59, 0.16);
        this.skillShotLabel.setAlpha(0.34);
        this.comboCount = 0;
        this.lastShotType = null;
        this.registry.set('combo', 0);
        this.registry.set('status', 'Ball drained.');
        this.loseLife();
    }

    triggerKickback(ball) {
        if (!ball?.body || ball.isLocked) return;
        MatterBody.setVelocity(ball.body, { x: 5.4, y: -17 });
        this.registry.set('status', 'Kickback save.');
        this.addScore(120);
    }

    loseLife() {
        const lives = (this.registry.get('lives') || 1) - 1;
        this.registry.set('lives', lives);
        if (lives <= 0) {
            this.resetGame();
            return;
        }
        this.scheduleRespawn(700);
    }

    resetGame() {
        this.clearPendingRespawn();
        this.clearComboWindow();
        this.balls.slice().forEach((ball) => this.destroyBall(ball));
        this.lockedBalls = [];
        this.items = [];
        this.treasures = [];
        this.clueCount = 0;
        this.targetDrops = 0;
        this.spinnerHits = 0;
        this.reactorCharge = 0;
        this.comboCount = 0;
        this.lastShotType = null;
        this.laneStates = [false, false, false];
        this.availableMissions = Phaser.Utils.Array.Shuffle([...this.missions]);
        this.registry.set('lives', 3);
        this.registry.set('score', 0);
        this.registry.set('items', []);
        this.registry.set('treasures', []);
        this.registry.set('clues', 0);
        this.registry.set('combo', 0);
        this.registry.set('reactorCharge', 0);
        this.lockGlow.setAlpha(0.18);
        this.resetTargets();
        this.laneLights.forEach((light) => light.setAlpha(0.22));
        this.laneLabels.forEach((labelText) => labelText.setAlpha(0.38));
        this.skillShotLit = true;
        this.skillShotLamp.setFillStyle(0xffde59, 0.16);
        this.skillShotLabel.setAlpha(0.34);
        this.startNextMission();
        this.registry.set('status', 'New game. Shoot the reactor lane.');
        this.spawnBall();
    }

    addScore(amount) {
        const score = (this.registry.get('score') || 0) + amount;
        this.registry.set('score', score);
    }

    registerShot(shotType) {
        if (this.lastShotType && this.lastShotType !== shotType) {
            this.comboCount += 1;
        } else if (this.lastShotType === shotType) {
            this.comboCount = Math.max(1, this.comboCount);
        } else {
            this.comboCount = 1;
        }
        this.lastShotType = shotType;
        this.registry.set('combo', this.comboCount);
        if (this.comboCount > 1) {
            this.addScore(110 * this.comboCount);
            this.registry.set('status', `${this.comboCount}x combo on ${shotType}.`);
        }
        this.advanceReactor(4 + this.comboCount);
        this.clearComboWindow();
        this.comboWindowEvent = this.time.delayedCall(2400, () => {
            this.comboCount = 0;
            this.lastShotType = null;
            this.registry.set('combo', 0);
            this.comboWindowEvent = null;
        });
    }

    advanceReactor(amount) {
        this.reactorCharge = Phaser.Math.Clamp(this.reactorCharge + amount, 0, 100);
        this.registry.set('reactorCharge', this.reactorCharge);
        if (this.reactorCharge >= 100) {
            this.reactorCharge = 0;
            this.registry.set('reactorCharge', 0);
            this.registry.set('status', 'Reactor overload. Multiball armed.');
            this.spawnBall(this.tableWidth * 0.48, this.tableHeight * 0.42, { velocity: { x: -2.5, y: -11 } });
            this.spawnBall(this.tableWidth * 0.52, this.tableHeight * 0.42, { velocity: { x: 2.5, y: -11 } });
            this.addScore(2400);
        }
    }

    clearComboWindow() {
        if (this.comboWindowEvent) {
            this.comboWindowEvent.remove(false);
            this.comboWindowEvent = null;
        }
    }

    clearPendingRespawn() {
        if (this.pendingRespawn) {
            this.pendingRespawn.remove(false);
            this.pendingRespawn = null;
        }
    }

    scheduleRespawn(delay = 450) {
        if (this.pendingRespawn || this.miniTableActive) return;
        this.pendingRespawn = this.time.delayedCall(delay, () => {
            this.pendingRespawn = null;
            if (!this.miniTableActive && this.getActiveBalls().length === 0) {
                this.spawnBall();
            }
        });
    }

    getActiveBalls() {
        return this.balls.filter((ball) => ball?.body && !ball.isLocked);
    }

    destroyBall(ball) {
        if (!ball) return;
        const index = this.balls.indexOf(ball);
        if (index >= 0) this.balls.splice(index, 1);
        const lockIndex = this.lockedBalls.indexOf(ball);
        if (lockIndex >= 0) this.lockedBalls.splice(lockIndex, 1);
        if (ball.body) ball.destroy();
    }

    update() {
        const controlState = window.pinballControls || {};
        const leftActive = this.leftKey.isDown || !!controlState.left;
        const rightActive = this.rightKey.isDown || !!controlState.right;
        const launchHeld = this.spaceKey.isDown || this.enterKey.isDown || !!controlState.launch;
        const launchReleased = Phaser.Input.Keyboard.JustUp(this.spaceKey)
            || Phaser.Input.Keyboard.JustUp(this.enterKey)
            || !!controlState.launchReleased;

        const leftTarget = leftActive ? this.flippers.left.activeAngle : this.flippers.left.restAngle;
        const rightTarget = rightActive ? this.flippers.right.activeAngle : this.flippers.right.restAngle;
        this.rotateFlipper(this.flippers.left, leftTarget);
        this.rotateFlipper(this.flippers.right, rightTarget);

        if (launchHeld) {
            this.plungerPull = Phaser.Math.Clamp(this.plungerPull + 0.58, 0, this.sy(28));
        } else if (launchReleased) {
            const launchBall = this.findShooterLaneBall();
            if (launchBall) {
                if (launchBall.isReadyToLaunch) {
                    launchBall.setStatic(false);
                    MatterBody.setPosition(launchBall.body, {
                        x: this.tableWidth - this.sx(112),
                        y: this.tableHeight - this.sy(210)
                    });
                }
                launchBall.isInShooterLane = false;
                launchBall.isReadyToLaunch = false;
                MatterBody.setVelocity(launchBall.body, { x: 0, y: -24 - (this.plungerPull / this.sy(28)) * 14 });
            }
            this.plungerPull = 0;
            if (controlState) controlState.launchReleased = false;
        } else {
            this.plungerPull = Phaser.Math.Clamp(this.plungerPull - 0.7, 0, this.sy(28));
        }

        MatterBody.setPosition(this.plunger, { x: this.plunger.position.x, y: this.plungerRestY + this.plungerPull });
        this.plungerGlow.setPosition(this.plunger.position.x, this.plungerRestY + this.plungerPull);
        this.launchMeter.height = this.sy(78) * (this.plungerPull / this.sy(28));
        this.launchMeter.setAlpha(this.plungerPull > 0 ? 0.95 : 0.35);

        this.balls = this.balls.filter((ball) => ball?.body);
        this.balls.forEach((ball) => {
            if (!ball.body || ball.isLocked) return;

             if (ball.isReadyToLaunch) {
                MatterBody.setPosition(ball.body, {
                    x: this.tableWidth - this.sx(112),
                    y: this.tableHeight - this.sy(194)
                });
                MatterBody.setVelocity(ball.body, { x: 0, y: 0 });
                return;
            }

            if (ball.isInShooterLane && ball.body.position.y < this.sy(210)) {
                this.exitShooterLane(ball);
                return;
            }

            if (ball.body.position.x > this.tableWidth - this.sx(156) && ball.body.position.y < this.sy(220)) {
                MatterBody.setVelocity(ball.body, {
                    x: Math.min(ball.body.velocity.x, 0),
                    y: Math.max(ball.body.velocity.y, -8)
                });
            }

            const speed = Math.sqrt(ball.body.velocity.x ** 2 + ball.body.velocity.y ** 2);
            if (speed < 1.2 && ball.body.position.y < this.tableHeight - this.sy(140)) {
                MatterBody.applyForce(ball.body, ball.body.position, { x: 0, y: 0.0007 });
            }
        });

        if (this.spinnerArm) this.spinnerArm.rotation *= 0.92;

        if (this.skillShotLit) {
            const pulse = 0.13 + ((Math.sin(this.time.now * 0.012) + 1) * 0.09);
            this.skillShotLamp.setAlpha(pulse + 0.05);
        }
        if (this.tunnelOpen) {
            const pulse = 0.28 + ((Math.sin(this.time.now * 0.01) + 1) * 0.14);
            this.tunnelIndicator.setAlpha(pulse);
            this.tunnelLabel.setAlpha(0.6 + pulse * 0.5);
        }

        if (!this.miniTableActive && this.getActiveBalls().length === 0) {
            this.scheduleRespawn(500);
        }
    }

    rotateFlipper(flipper, target) {
        const newAngle = Phaser.Math.Angle.RotateTo(flipper.angle, target, flipper.maxStep || 0.42);
        MatterBody.setAngle(flipper, newAngle);
        MatterBody.setAngularVelocity(flipper, 0);
        if (flipper.sprite) {
            flipper.sprite.setPosition(flipper.pivotPoint.x, flipper.pivotPoint.y);
            flipper.sprite.setRotation(newAngle);
        }
    }

    handleShutdown() {
        this.clearPendingRespawn();
        this.clearComboWindow();
        if (this.collisionHandler) this.matter.world.off('collisionstart', this.collisionHandler);
    }

    sx(value) {
        return value * this.scaleX;
    }

    sy(value) {
        return value * this.scaleY;
    }
}

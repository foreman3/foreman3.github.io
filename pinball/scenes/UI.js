export class UI extends Phaser.Scene {
    constructor() {
        super({ key: 'UI' });
    }

    create() {
        const width = this.scale.gameSize.width;
        const compactMode = width < 760;
        const panelWidth = compactMode ? Math.min(width - 24, 280) : Math.min(width - 32, 286);
        const panelX = 12;
        const panelY = 12;
        const statsHeight = compactMode ? 154 : 148;
        const statusY = panelY + statsHeight + 8;
        const statusHeight = compactMode ? 50 : 44;

        this.add.rectangle(panelX, panelY, panelWidth, statsHeight, 0x07111d, 0.42)
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0x69e8ff, 0.14)
            .setDepth(100);
        this.add.rectangle(panelX, statusY, panelWidth, statusHeight, 0x07111d, 0.34)
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0x69e8ff, 0.12)
            .setDepth(100);

        const titleStyle = { fontSize: compactMode ? '16px' : '17px', fill: '#7ef0ff', fontFamily: 'Space Grotesk', fontStyle: '700' };
        const style = { fontSize: compactMode ? '14px' : '15px', fill: '#f3fbff', fontFamily: 'Space Grotesk' };
        const minor = { fontSize: compactMode ? '12px' : '13px', fill: '#b8d6f3', fontFamily: 'Space Grotesk' };
        const accent = { fontSize: compactMode ? '13px' : '14px', fill: '#ffd58a', fontFamily: 'Space Grotesk', fontStyle: '700' };

        this.titleText = this.add.text(panelX + 12, panelY + 10, 'DOCTOR DUDE LAB', titleStyle).setDepth(101);
        this.scoreText = this.add.text(panelX + 12, panelY + 34, 'Score 0', style).setDepth(101);
        this.livesText = this.add.text(panelX + 160, panelY + 34, 'Balls 3', style).setDepth(101);
        this.missionText = this.add.text(panelX + 12, panelY + 56, 'Mission: None', minor).setDepth(101);
        this.requirementsText = this.add.text(panelX + 12, panelY + 76, 'Need: --', { ...minor, wordWrap: { width: panelWidth - 24 } }).setDepth(101);
        this.clueText = this.add.text(panelX + 12, panelY + 104, 'Clues 0', accent).setDepth(101);
        this.comboText = this.add.text(panelX + 128, panelY + 104, 'Combo 0x', accent).setDepth(101);
        this.itemsText = this.add.text(panelX + 12, panelY + 126, 'Items: None', { ...minor, wordWrap: { width: panelWidth - 24 } }).setDepth(101);
        this.treasureText = this.add.text(panelX + 12, panelY + (compactMode ? 144 : 144), 'Treasures: None', { ...minor, wordWrap: { width: panelWidth - 24 } }).setDepth(101);

        this.reactorLabel = this.add.text(panelX + 12, statusY + 8, 'Reactor', minor).setDepth(101);
        this.reactorBarBg = this.add.rectangle(panelX + 72, statusY + 18, panelWidth - 96, 12, 0x102235, 0.9)
            .setOrigin(0, 0.5)
            .setStrokeStyle(1, 0x87f1ff, 0.18)
            .setDepth(101);
        this.reactorBar = this.add.rectangle(panelX + 72, statusY + 18, 0, 12, 0x86ff9b, 0.95)
            .setOrigin(0, 0.5)
            .setDepth(102);
        this.statusText = this.add.text(panelX + 12, statusY + 28, 'Status: Stand by', {
            fontSize: compactMode ? '11px' : '12px',
            fill: '#89eeff',
            fontFamily: 'Space Grotesk',
            wordWrap: { width: panelWidth - 24 }
        }).setDepth(101);

        this.clueTarget = 0;
        this.registry.events.on('changedata', this.updateData, this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.registry.events.off('changedata', this.updateData, this);
        });
        this.refreshAll();
    }

    updateData(parent, key, data) {
        if (key === 'score') {
            this.scoreText.setText(`Score ${data}`);
        } else if (key === 'lives') {
            this.livesText.setText(`Balls ${data}`);
        } else if (key === 'mission') {
            this.missionText.setText(`Mission: ${data}`);
        } else if (key === 'requiredItems') {
            this.requirementsText.setText(`Need: ${data}`);
        } else if (key === 'clues' || key === 'clueTarget') {
            if (key === 'clueTarget') this.clueTarget = data;
            const targetText = this.clueTarget > 0 ? ` / ${this.clueTarget}` : '';
            this.clueText.setText(`Clues ${this.registry.get('clues') || 0}${targetText}`);
        } else if (key === 'items') {
            const items = Array.isArray(data) && data.length ? data.join(', ') : 'None';
            this.itemsText.setText(`Items: ${items}`);
        } else if (key === 'treasures') {
            const treasures = Array.isArray(data) && data.length ? data.join(', ') : 'None';
            this.treasureText.setText(`Treasures: ${treasures}`);
        } else if (key === 'combo') {
            this.comboText.setText(`Combo ${data || 0}x`);
        } else if (key === 'reactorCharge') {
            const progress = Phaser.Math.Clamp(data || 0, 0, 100);
            const maxWidth = this.reactorBarBg.width;
            this.reactorBar.width = maxWidth * (progress / 100);
            const color = progress >= 70 ? 0xffb15c : progress >= 35 ? 0xa0ff7a : 0x69e8ff;
            this.reactorBar.setFillStyle(color, 0.95);
        } else if (key === 'status') {
            this.statusText.setText(`Status: ${data || 'Stand by'}`);
        }
    }

    refreshAll() {
        this.updateData(null, 'score', this.registry.get('score') || 0);
        this.updateData(null, 'lives', this.registry.get('lives') || 3);
        this.updateData(null, 'mission', this.registry.get('mission') || 'None');
        this.updateData(null, 'requiredItems', this.registry.get('requiredItems') || '--');
        this.updateData(null, 'clueTarget', this.registry.get('clueTarget') || 0);
        this.updateData(null, 'clues', this.registry.get('clues') || 0);
        this.updateData(null, 'items', this.registry.get('items') || []);
        this.updateData(null, 'treasures', this.registry.get('treasures') || []);
        this.updateData(null, 'combo', this.registry.get('combo') || 0);
        this.updateData(null, 'reactorCharge', this.registry.get('reactorCharge') || 0);
        this.updateData(null, 'status', this.registry.get('status') || 'Stand by');
    }
}

export class UI extends Phaser.Scene {
    constructor() {
        super({ key: 'UI' });
    }

    create() {
        const panelX = 12;
        const panelY = 12;
        const panelWidth = 360;
        const panelHeight = 156;
        this.add.rectangle(panelX, panelY, panelWidth, panelHeight, 0x0a1424, 0.7)
            .setOrigin(0, 0)
            .setStrokeStyle(2, 0x5ce1ff, 0.35);

        const style = { fontSize: '16px', fill: '#e8f6ff', fontFamily: 'Trebuchet MS' };
        const minor = { fontSize: '13px', fill: '#a8c9ff', fontFamily: 'Trebuchet MS' };
        const accent = { fontSize: '15px', fill: '#ffd58a', fontFamily: 'Trebuchet MS' };

        this.titleText = this.add.text(panelX + 12, panelY + 10, 'Doctor Dude Lab', { fontSize: '18px', fill: '#8af7ff', fontFamily: 'Trebuchet MS' });
        this.scoreText = this.add.text(panelX + 12, panelY + 36, 'Score: 0', style);
        this.livesText = this.add.text(panelX + 220, panelY + 36, 'Lives: 3', style);
        this.missionText = this.add.text(panelX + 12, panelY + 62, 'Mission: None', minor);
        this.requirementsText = this.add.text(panelX + 12, panelY + 82, 'Needed: --', minor);
        this.clueText = this.add.text(panelX + 12, panelY + 102, 'Clues: 0', accent);
        this.itemsText = this.add.text(panelX + 12, panelY + 120, 'Items: None', minor);
        this.treasureText = this.add.text(panelX + 12, panelY + 138, 'Treasures: None', minor);

        this.registry.events.on('changedata', this.updateData, this);
        this.clueTarget = 0;
    }

    updateData(parent, key, data) {
        if (key === 'score') {
            this.scoreText.setText(`Score: ${data}`);
        } else if (key === 'lives') {
            this.livesText.setText(`Lives: ${data}`);
        } else if (key === 'mission') {
            this.missionText.setText(`Mission: ${data}`);
        } else if (key === 'requiredItems') {
            this.requirementsText.setText(`Needed: ${data}`);
        } else if (key === 'clues' || key === 'clueTarget') {
            if (key === 'clueTarget') this.clueTarget = data;
            const targetText = this.clueTarget > 0 ? ` / ${this.clueTarget}` : '';
            this.clueText.setText(`Clues: ${this.registry.get('clues') || 0}${targetText}`);
        } else if (key === 'items') {
            const items = Array.isArray(data) && data.length ? data.join(', ') : 'None';
            this.itemsText.setText(`Items: ${items}`);
        } else if (key === 'treasures') {
            const treasures = Array.isArray(data) && data.length ? data.join(', ') : 'None';
            this.treasureText.setText(`Treasures: ${treasures}`);
        }
    }
}

export class UI extends Phaser.Scene {
    constructor() {
        super({ key: 'UI' });
    }

    create() {
        const shadow = { shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 0 } };
        this.scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '20px', fill: '#f0f0f0', ...shadow });
        this.livesText = this.add.text(500, 10, 'Lives: 3', { fontSize: '20px', fill: '#f0f0f0', ...shadow });
        this.missionText = this.add.text(10, 40, 'Mission: None', { fontSize: '16px', fill: '#d7e7ff', ...shadow });
        this.requirementsText = this.add.text(10, 60, 'Needed: --', { fontSize: '14px', fill: '#c8d1ff', ...shadow });
        this.clueText = this.add.text(10, 78, 'Clues: 0', { fontSize: '16px', fill: '#ffb347', ...shadow });
        this.itemsText = this.add.text(10, 98, 'Items: None', { fontSize: '14px', fill: '#a3ff8f', ...shadow });
        this.treasureText = this.add.text(10, 118, 'Treasures: None', { fontSize: '14px', fill: '#6ae8ff', ...shadow });

        // Listen to registry events
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

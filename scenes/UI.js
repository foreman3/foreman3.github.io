export class UI extends Phaser.Scene {
    constructor() {
        super({ key: 'UI' });
    }

    create() {
        this.scoreText = this.add.text(10, 10, 'Score: 0', { fontSize: '20px', fill: '#fff' });
        this.livesText = this.add.text(500, 10, 'Lives: 3', { fontSize: '20px', fill: '#fff' });
        this.missionText = this.add.text(10, 40, 'Mission: None', { fontSize: '16px', fill: '#aaa' });

        // Listen to registry events
        this.registry.events.on('changedata', this.updateData, this);
    }

    updateData(parent, key, data) {
        if (key === 'score') {
            this.scoreText.setText(`Score: ${data}`);
        } else if (key === 'lives') {
            this.livesText.setText(`Lives: ${data}`);
        } else if (key === 'mission') {
            this.missionText.setText(`Mission: ${data}`);
        }
    }
}

import { MainTable } from './scenes/MainTable.js';
import { MiniTable } from './scenes/MiniTable.js';
import { UI } from './scenes/UI.js';

const config = {
    type: Phaser.AUTO,
    width: 720,
    height: Math.floor(window.innerHeight * 0.8),
    backgroundColor: '#1a1a1a',
    parent: document.body,
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1.0 },
            debug: false // Turn off debug for smoother rendering
        }
    },
    scene: [MainTable, MiniTable, UI]
};

const game = new Phaser.Game(config);

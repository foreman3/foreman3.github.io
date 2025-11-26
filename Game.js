import { MainTable } from './scenes/MainTable.js';
import { MiniTable } from './scenes/MiniTable.js';
import { UI } from './scenes/UI.js';

const config = {
    type: Phaser.AUTO,
    width: 600, // Standard arcade ratio
    height: 800,
    backgroundColor: '#1a1a1a',
    parent: document.body,
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1.0 },
            debug: true // Enable debug to see physics bodies initially
        }
    },
    scene: [MainTable, MiniTable, UI]
};

const game = new Phaser.Game(config);
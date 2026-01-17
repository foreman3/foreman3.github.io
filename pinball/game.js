import { MainTable } from './scenes/MainTable.js';
import { MiniTable } from './scenes/MiniTable.js';
import { UI } from './scenes/UI.js';

const vw = window.innerWidth;
const vh = window.innerHeight;
const config = {
    type: Phaser.AUTO,
    width: Math.min(Math.floor(vw * 0.7), 900),
    height: Math.min(Math.floor(vh * 0.85), 1000),
    backgroundColor: '#0b0d11',
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

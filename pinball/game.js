import { MainTable } from './scenes/MainTable.js';
import { MiniTable } from './scenes/MiniTable.js';
import { UI } from './scenes/UI.js';

const computeSize = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return {
        width: Math.min(Math.floor(vw * 0.85), 980),
        height: Math.min(Math.floor(vh * 0.95), 1120)
    };
};

const { width, height } = computeSize();
const config = {
    type: Phaser.AUTO,
    width,
    height,
    backgroundColor: '#070b14',
    parent: 'game-container',
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

window.pinballGame = game;
window.pausePinball = () => {
    game.scene.pause('MainTable');
    game.scene.pause('MiniTable');
    game.scene.pause('UI');
};
window.resumePinball = () => {
    game.scene.resume('MainTable');
    game.scene.resume('MiniTable');
    game.scene.resume('UI');
};

window.addEventListener('resize', () => {
    const size = computeSize();
    game.scale.resize(size.width, size.height);
});

import { MainTable } from './scenes/MainTable.js';
import { MiniTable } from './scenes/MiniTable.js';
import { UI } from './scenes/UI.js';

const TABLE_RATIO = 980 / 1120;

window.pinballControls = window.pinballControls || {
    left: false,
    right: false,
    launch: false,
    launchReleased: false
};

const computeSize = () => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gutter = Math.max(8, Math.round(Math.min(vw, vh) * 0.015));
    const usableWidth = Math.max(320, vw - gutter * 2);
    const usableHeight = Math.max(520, vh - gutter * 2);

    let width = Math.min(usableWidth, Math.round(usableHeight * TABLE_RATIO));
    let height = Math.round(width / TABLE_RATIO);

    if (height > usableHeight) {
        height = usableHeight;
        width = Math.round(height * TABLE_RATIO);
    }

    return { width, height };
};

const { width, height } = computeSize();
const config = {
    type: Phaser.AUTO,
    width,
    height,
    backgroundColor: '#04070d',
    parent: 'game-container',
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1.0 },
            debug: false
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

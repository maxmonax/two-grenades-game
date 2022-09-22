import { FrontEvents } from './events/FrontEvents';
import { GameBoot } from './GameBoot';

window.addEventListener('load', () => {
    let gameStarter = new GameBoot();
    let event = new CustomEvent('gameStarterCreated', {
        detail: {
            gameStarter: gameStarter
        }
    });
    window.dispatchEvent(event);
}, false);

window.addEventListener('resize', () => {
    FrontEvents.onWindowResizeSignal.dispatch();
}, false);
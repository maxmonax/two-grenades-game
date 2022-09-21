import { FrontEvents } from './events/FrontEvents';
import { GameStarter } from './GameStarter';

window.addEventListener('load', () => {
    let gameStarter = new GameStarter();
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
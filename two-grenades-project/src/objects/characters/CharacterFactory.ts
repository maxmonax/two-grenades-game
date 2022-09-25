import { LoopOnce } from "three";
import { ModelAlias } from "../../data/ModelData";
import { Character, CharAnimation, CharAnimEvent } from "./Character";

export class CharacterFactory {

    static getPlayerCharacter(aScale: number): Character {

        let char = new Character();

        char.init({
            modelAlias: ModelAlias.charSwat,
            scale: aScale
        });

        char.addAnimation({
            animAlias: ModelAlias.charSwatIdleAnim,
            newKey: CharAnimation.idle
        });
        char.addAnimation({
            animAlias: ModelAlias.charSwatGrenadeAnim,
            newKey: CharAnimation.throw,
            repeat: 1,
            nextAnimAlias: CharAnimation.idle,
            timeEvents: [
                { time: 3.6, eventName: CharAnimEvent.throw }
            ]
        });
        char.addAnimation({
            animAlias: ModelAlias.charSwatDeathAnim,
            newKey: CharAnimation.death,
            repeat: 1
        });
        
        char.playAnimation(CharAnimation.idle);
        char.update(0.0);

        return char;

    }

    static getEnemyCharacter(aScale: number): Character {

        let char: Character;

        char = new Character();

        char.init({
            modelAlias: ModelAlias.charBot,
            scale: aScale
        });

        char.addAnimation({
            animAlias: ModelAlias.charBotIdleAnim,
            newKey: CharAnimation.idle
        });
        char.addAnimation({
            animAlias: ModelAlias.charBotGrenadeAnim,
            newKey: CharAnimation.throw
        });
        char.addAnimation({
            animAlias: ModelAlias.charBotDeathAnim,
            newKey: CharAnimation.death
        });

        char.playAnimation(CharAnimation.idle);
        char.update(0.0);

        return char;

    }

}
import { Character } from "./Character";

export class CharacterFactory {

    static getPlayerCharacter(aScale: number): Character {

        let char: Character;
        
        char = new Character();

        char.init({
            modelAlias: 'charSwat',
            scale: aScale
        });

        char.addAnimation({
            animAlias: 'charSwatIdleAnim',
            newKey: 'idle'
        });
        char.addAnimation({
            animAlias: 'charSwatGrenadeAnim',
            newKey: 'grenade'
        });
        char.addAnimation({
            animAlias: 'charSwatDeathAnim',
            newKey: 'death'
        });
        
        char.playAnimation('idle');
        char.update(0.0);

        return char;

    }

    static getEnemyCharacter(aScale: number): Character {

        let char: Character;

        char = new Character();

        char.init({
            modelAlias: 'charBot',
            scale: aScale
        });

        char.addAnimation({
            animAlias: 'charBotIdleAnim',
            newKey: 'idle'
        });
        char.addAnimation({
            animAlias: 'charBotGrenadeAnim',
            newKey: 'grenade'
        });
        char.addAnimation({
            animAlias: 'charBotDeathAnim',
            newKey: 'death'
        });

        char.playAnimation('idle');
        char.update(0.0);

        return char;

    }

}
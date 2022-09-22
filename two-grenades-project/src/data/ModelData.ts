
export enum ModelAlias {

    charBot = 'charBot',
    charBotIdleAnim = 'charBotIdleAnim',
    charBotGrenadeAnim = 'charBotGrenadeAnim',
    charBotDeathAnim = 'charBotDeathAnim',

    charSwat = 'charSwat',
    charSwatIdleAnim = 'charSwatIdleAnim',
    charSwatGrenadeAnim = 'charSwatGrenadeAnim',
    charSwatDeathAnim = 'charSwatDeathAnim',

};

export const MODEL_LOAD_LIST = [
    { alias: ModelAlias.charBot, file: 'characters/BotTPose.fbx' },
    { alias: ModelAlias.charBotIdleAnim, file: 'characters/Bot_Crouch_Idle_Anim.fbx' },
    { alias: ModelAlias.charBotGrenadeAnim, file: `characters/Bot_Grenade_Throw_Anim.fbx` },
    { alias: ModelAlias.charBotDeathAnim, file: `characters/Bot_Crouch_Death_Anim.fbx` },
    { alias: ModelAlias.charSwat, file: `characters/SwatTPose.fbx` },
    { alias: ModelAlias.charSwatIdleAnim, file: `characters/Swat_Crouch_Idle_Anim.fbx` },
    { alias: ModelAlias.charSwatGrenadeAnim, file: `characters/Swat_Grenade_Throw_Anim.fbx` },
    { alias: ModelAlias.charSwatDeathAnim, file: `characters/Swat_Crouch_Death_Anim.fbx` }
];

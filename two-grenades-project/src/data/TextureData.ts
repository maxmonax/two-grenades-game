
export enum TextureAlias {
    grass = 'grass',
    bricks = 'bricks',
    skybox = 'skybox',
};

export const TEXTURE_LOAD_DATA = [
    { alias: TextureAlias.grass, file: 'textures/Grass.png' },
    { alias: TextureAlias.bricks, file: 'textures/Bricks.png' },
    { alias: TextureAlias.skybox, file: `textures/skybox/Sky_Daytime_4k_128color.png` }
];

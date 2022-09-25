
export enum TextureAlias {
    grass = 'grass',
    bricks = 'bricks',
    skybox = 'skybox',
    particleCircle = 'particleCircle'
};

export const TEXTURE_LOAD_LIST = [
    { alias: TextureAlias.grass, file: 'textures/Grass.png' },
    { alias: TextureAlias.bricks, file: 'textures/Bricks.png' },
    { alias: TextureAlias.skybox, file: `textures/skybox/Sky_Daytime_4k_128color.png` },
    { alias: TextureAlias.particleCircle, file: `sprites/particles/circle.png` }
];


export enum GameState {
  START = 'START',
  CUSTOMIZE = 'CUSTOMIZE',
  PLAY = 'PLAY',
  PAUSE = 'PAUSE',
  CUTSCENE = 'CUTSCENE',
  END = 'END'
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Customization {
  name: string;
  gender: 'male' | 'female';
  hair: number; // Style index
  hairColor: number; // Color index
  skin: number;
  outfit: number;
  facialHair: number;
}

export interface Entity {
  pos: Vector2;
  vel: Vector2;
  width: number;
  height: number;
  type: string;
}

export interface Player extends Entity {
  onGround: boolean;
  facing: number; // 1 for right, -1 for left
  animFrame: number;
  hasBalloon: boolean;
  heartsCollected: number;
  flowersCollected: number;
  keysCollected: number;
  lives: number;
  customization: Customization;
  partnerCustomization: Customization;
}

export interface WorldObject extends Entity {
  collected: boolean;
  active: boolean;
  id: string;
}

export interface Dialogue {
  speaker: string;
  text: string;
}

export interface Level {
  width: number;
  height: number;
  platforms: { x: number; y: number; w: number; h: number; type: 'ground' | 'platform' | 'tunnel_top' }[];
  hearts: { x: number; y: number; type: 'heart' | 'box' | 'chest' | 'flower' }[];
  balloons: { x: number; y: number }[];
  keys: { x: number; y: number }[];
  decorations: { x: number; y: number; type: 'hill' | 'garden' }[];
  girlPos: Vector2;
}

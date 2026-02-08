import { Level } from './types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 450;
export const GRAVITY = 0.55; 
export const JUMP_FORCE = -12.5;
export const MOVE_SPEED = 4.2;
export const BALLOON_GRAVITY = 0.18;
export const BALLOON_LIFT = -3.5;

export const SKIN_COLORS = ['#ffdbac', '#f1c27d', '#8d5524', '#5c3816', '#ffead0'];
export const HAIR_COLORS = [
  '#4b3621', // Dark Brown
  '#1a1a1a', // Black
  '#ffeb3b', // Blonde
  '#e67e22', // Ginger
  '#9b59b6', // Purple
  '#3498db', // Blue
  '#ecf0f1'  // White/Grey
];

// Male: Blue, Red, Black
export const MALE_OUTFITS = ['#2196f3', '#e53935', '#212121'];
// Female: Pink, Yellow, Blue
export const FEMALE_OUTFITS = ['#f06292', '#fff176', '#64b5f6'];

export const COLORS = {
  SKY: '#bbdefb',
  GROUND: '#fff59d',
  GROUND_ACCENT: '#ffccbc',
  HEART: '#ff1744',
  FLOWER: '#ba68c8',
  BOX: '#ff8a80',
  BOX_INACTIVE: '#ef9a9a',
  BALLOON: '#f06292',
  CLOUD: '#ffffff',
  KEY: '#ffd700',
  CHEST: '#8d6e63',
  CHEST_TRIM: '#ffd700',
  HILL: '#81c784',
  GARDEN_FLOWER: '#f06292'
};

export const GAME_LEVEL: Level = {
  width: 4600, 
  height: 450,
  platforms: [
    { x: 0, y: 400, w: 900, h: 50, type: 'ground' },
    { x: 1000, y: 400, w: 800, h: 50, type: 'ground' },
    { x: 1950, y: 400, w: 1000, h: 50, type: 'ground' },
    { x: 3100, y: 400, w: 1500, h: 50, type: 'ground' },
    // Floating platforms - Adjusted positions to clear space under boxes
    { x: 400, y: 280, w: 120, h: 20, type: 'platform' },
    { x: 650, y: 190, w: 100, h: 20, type: 'platform' },
    { x: 1250, y: 300, w: 80, h: 20, type: 'platform' }, // Moved right from 1100 to clear Box 2
    { x: 2100, y: 260, w: 120, h: 20, type: 'platform' },
    { x: 2400, y: 160, w: 120, h: 20, type: 'platform' },
    { x: 2700, y: 250, w: 100, h: 20, type: 'platform' },
    { x: 3200, y: 280, w: 150, h: 20, type: 'platform' },
    { x: 3800, y: 220, w: 120, h: 20, type: 'platform' },
  ],
  decorations: [
    { x: 150, y: 400, type: 'hill' },
    { x: 500, y: 400, type: 'garden' },
    { x: 1300, y: 400, type: 'hill' },
    { x: 2200, y: 400, type: 'garden' },
    { x: 2800, y: 400, type: 'garden' },
    { x: 3300, y: 400, type: 'hill' },
    { x: 3700, y: 400, type: 'garden' },
    { x: 4200, y: 400, type: 'garden' },
  ],
  hearts: [
    { x: 440, y: 210, type: 'heart' }, 
    { x: 2750, y: 180, type: 'heart' }, 
    { x: 680, y: 120, type: 'flower' }, 
    { x: 3250, y: 210, type: 'flower' }, 
    // Floating Boxes - Elevated to ensure jump-from-below logic is clear
    { x: 250, y: 240, type: 'box' },   
    { x: 1100, y: 240, type: 'box' }, // Box 2: Clearance confirmed
    // Chest is on the ground near the end
    { x: 4100, y: 368, type: 'chest' }, 
  ],
  balloons: [
    { x: 800, y: 360 }
  ],
  keys: [
    { x: 700, y: 360 }, 
    { x: 2500, y: 100 }, 
    { x: 3500, y: 360 }
  ],
  girlPos: { x: 4400, y: 352 } 
};

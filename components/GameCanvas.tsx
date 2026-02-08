
import React, { useRef, useEffect } from 'react';
import { GameState, Player, WorldObject, Dialogue, Customization } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_LEVEL, GRAVITY, JUMP_FORCE, MOVE_SPEED, COLORS, BALLOON_GRAVITY, BALLOON_LIFT, HAIR_COLORS, SKIN_COLORS, MALE_OUTFITS, FEMALE_OUTFITS } from '../constants';
import { audio } from '../services/AudioManager';

interface GameCanvasProps {
  gameState: GameState;
  setGameState: (state: GameState) => void;
  customization: Customization;
  partnerCustomization: Customization;
  onHeartCollect: (hCount: number, fCount: number, kCount: number) => void;
  onLifeChange: (lives: number) => void;
}

interface SpawnedItem extends WorldObject { vel: { x: number, y: number }; itemType: 'heart' | 'flower' | 'bouquet' }
interface Particle { x: number; y: number; vx: number; vy: number; color: string; size: number; life: number; type?: 'heart' | 'flower' | 'confetti' | 'broken' | 'petal' | 'sparkle' };

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, setGameState, customization, partnerCustomization, onHeartCollect, onLifeChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<Player>({
    pos: { x: 50, y: 350 }, vel: { x: 0, y: 0 }, width: 28, height: 36, type: 'player', onGround: false,
    facing: 1, animFrame: 0, hasBalloon: true,
    heartsCollected: 0, flowersCollected: 0, keysCollected: 0, lives: 3, customization, partnerCustomization
  });

  const worldRef = useRef<{ 
    items: WorldObject[], balloons: WorldObject[], keys: WorldObject[], spawnedItems: SpawnedItem[],
    particles: Particle[], cameraX: number, cameraZoom: number, cameraTargetZoom: number,
    cameraTargetX: number, cameraTargetY: number, cameraCurrentX: number, cameraCurrentY: number,
    cutsceneStep: number, ringPos: { x: number, y: number },
    ringVisible: boolean, ringOwner: 'girl' | 'guy', finalChoice: 'yes' | 'no' | null,
    chestButtonRect: { x: number, y: number, w: number, h: number } | null,
    cryTimer: number, 
    cloudsFar: {x: number, y: number, sc: number}[],
    cloudsNear: {x: number, y: number, sc: number}[],
    time: number
  }>({
    items: GAME_LEVEL.hearts.map((h, i) => ({ id: `item-${i}`, pos: { x: h.x, y: h.y }, vel: { x: 0, y: 0 }, width: 32, height: 32, type: h.type, collected: false, active: true })),
    balloons: GAME_LEVEL.balloons.map((b, i) => ({ id: `balloon-${i}`, pos: { x: b.x, y: b.y }, vel: { x: 0, y: 0 }, width: 24, height: 32, type: 'balloon', collected: false, active: true })),
    keys: GAME_LEVEL.keys.map((k, i) => ({ id: `key-${i}`, pos: { x: k.x, y: k.y }, vel: { x: 0, y: 0 }, width: 24, height: 24, type: 'key', collected: false, active: true })),
    spawnedItems: [], particles: [], cameraX: 0, cameraZoom: 1, cameraTargetZoom: 1, cameraTargetX: 0, cameraTargetY: 0, cameraCurrentX: 0, cameraCurrentY: 0,
    cutsceneStep: 0, ringPos: { x: GAME_LEVEL.girlPos.x, y: GAME_LEVEL.girlPos.y + 10 },
    ringVisible: false, ringOwner: 'girl', finalChoice: null, chestButtonRect: null, cryTimer: 0,
    cloudsFar: Array(15).fill(0).map((_, i) => ({ x: i * 500 + Math.random() * 200, y: 20 + Math.random() * 50, sc: 0.5 + Math.random() * 0.3 })),
    cloudsNear: Array(15).fill(0).map((_, i) => ({ x: i * 400 + Math.random() * 200, y: 70 + Math.random() * 80, sc: 0.8 + Math.random() * 0.4 })),
    time: 0
  });

  const keysRef = useRef<{ [key: string]: boolean }>({});
  const dialogueRef = useRef<{ index: number, dialogues: Dialogue[], active: boolean, textProgress: number }>({
    index: 0, active: false, textProgress: 0, dialogues: []
  });

  useEffect(() => {
    dialogueRef.current.dialogues = [
      { speaker: partnerCustomization.name, text: "Ohh you're finally here" },
      { speaker: partnerCustomization.name, text: "I've been waiting for you" },
      { speaker: customization.name, text: "I've collected all these gifts with utmost love" },
      { speaker: partnerCustomization.name, text: "I'm so happy with your efforts, I need to ask you something..." },
    ];
  }, [customization, partnerCustomization]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      keysRef.current[e.code] = true;
      if (gameState === GameState.CUTSCENE && worldRef.current.cutsceneStep === 0 && (e.code === 'Space' || e.code === 'Enter')) {
        const d = dialogueRef.current;
        if (d.textProgress < d.dialogues[d.index].text.length) d.textProgress = d.dialogues[d.index].text.length; else nextDialogue();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => { window.removeEventListener('keydown', handleKeyDown); window.removeEventListener('keyup', handleKeyUp); };
  }, [gameState]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
    const x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width); const y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
    const w = worldRef.current;
    if (gameState === GameState.END && w.finalChoice === null) {
      if (x >= 300 && x <= 380 && y >= 200 && y <= 245) { 
        w.finalChoice = 'yes'; 
        audio.startBGM('celebration'); 
        audio.playVictory(); 
        audio.playDramatic();
        for (let j = 0; j < 18; j++) {
            setTimeout(() => {
                const fx = CANVAS_WIDTH * 0.1 + Math.random() * CANVAS_WIDTH * 0.8;
                const fy = CANVAS_HEIGHT * 0.1 + Math.random() * CANVAS_HEIGHT * 0.4;
                audio.playFirework();
                for (let i = 0; i < 60; i++) {
                    const a = (Math.PI * 2 / 60) * i;
                    w.particles.push({ 
                      x: fx, y: fy, 
                      vx: Math.cos(a) * (7 + Math.random() * 11), 
                      vy: Math.sin(a) * (7 + Math.random() * 11), 
                      color: ['#ffeb3b', '#f48fb1', '#00e676', '#29b6f6', '#ff1744', '#ffffff', '#ff4081'][Math.floor(Math.random() * 7)], 
                      size: 5, life: 120, type: 'confetti' 
                    });
                }
            }, j * 110);
        }
      }
      if (x >= 420 && x <= 500 && y >= 200 && y <= 245) { w.finalChoice = 'no'; audio.startBGM('sad'); audio.playDramatic(); }
    }
    const cb = w.chestButtonRect;
    if (gameState === GameState.PLAY && cb) {
      if (x >= cb.x && x <= cb.x + cb.w && y >= cb.y && y <= cb.y + cb.h) {
        const chest = w.items.find(h => h.type === 'chest' && !h.collected);
        if (chest && playerRef.current.keysCollected >= 3) { chest.collected = true; audio.playBoxHit(); spawnChestRewards(chest); }
      }
    }
  };

  const nextDialogue = () => {
    const d = dialogueRef.current;
    if (d.index < d.dialogues.length - 1) { 
      d.index++; d.textProgress = 0;
      const speakerName = d.dialogues[d.index].speaker;
      const isFemale = speakerName === customization.name ? (customization.gender === 'female') : (partnerCustomization.gender === 'female');
      audio.playDialogue(isFemale);
      if (d.index === 2) { worldRef.current.cutsceneStep = 1; startGiftsTransfer(); }
    } else { 
      worldRef.current.cutsceneStep = 2; 
      worldRef.current.ringVisible = true; 
      audio.playDialogue(partnerCustomization.gender === 'female'); 
    }
  };

  const startGiftsTransfer = () => {
    const p = playerRef.current; const w = worldRef.current; const total = p.heartsCollected + p.flowersCollected;
    for (let i = 0; i < total; i++) {
      setTimeout(() => {
        const type = i < p.heartsCollected ? 'heart' : 'flower';
        w.particles.push({ x: p.pos.x + 14, y: p.pos.y + 10, vx: (GAME_LEVEL.girlPos.x - p.pos.x) / 40 + (Math.random() - 0.5) * 6, vy: -5 - Math.random() * 5, color: type === 'heart' ? COLORS.HEART : COLORS.FLOWER, size: 6, life: 75, type });
        audio.playCollect();
      }, i * 110);
    }
    setTimeout(() => { worldRef.current.cutsceneStep = 0; }, total * 110 + 800);
  };

  const spawnChestRewards = (chest: WorldObject) => {
    for(let i=0; i<2; i++) {
       worldRef.current.spawnedItems.push({ id: `chest-h-${i}`, pos: { x: chest.pos.x + 10, y: chest.pos.y - 30 }, vel: { x: 2 - i*4, y: -8 }, width: 24, height: 24, type: 'heart', collected: false, active: true, itemType: 'heart' });
       worldRef.current.spawnedItems.push({ id: `chest-f-${i}`, pos: { x: chest.pos.x + 10, y: chest.pos.y - 30 }, vel: { x: 4 - i*8, y: -7 }, width: 24, height: 24, type: 'flower', collected: false, active: true, itemType: 'flower' });
    }
  };

  const update = () => {
    const w = worldRef.current; const p = playerRef.current;
    w.time++;
    if (gameState === GameState.CUTSCENE || gameState === GameState.END) {
        const midX = (p.pos.x + GAME_LEVEL.girlPos.x) / 2; const midY = (p.pos.y + GAME_LEVEL.girlPos.y) / 2;
        w.cameraTargetX = midX - (CANVAS_WIDTH / 2) / w.cameraZoom; w.cameraTargetY = midY - (CANVAS_HEIGHT / 2) / w.cameraZoom;
        w.cameraTargetZoom = gameState === GameState.END ? (w.finalChoice === 'yes' ? 1.7 : 1.3) : 1.15;
    } else { 
        w.cameraTargetX = Math.max(0, Math.min(p.pos.x - CANVAS_WIDTH / 2, GAME_LEVEL.width - CANVAS_WIDTH)); 
        w.cameraTargetY = 0; w.cameraTargetZoom = 1; 
    }
    w.cameraCurrentX += (w.cameraTargetX - w.cameraCurrentX) * 0.08; 
    w.cameraCurrentY += (w.cameraTargetY - w.cameraCurrentY) * 0.08; 
    w.cameraZoom += (w.cameraTargetZoom - w.cameraZoom) * 0.03;
    w.particles = w.particles.filter(pt => { pt.x += pt.vx; pt.y += pt.vy; pt.life--; if (pt.type === 'confetti' || pt.type === 'petal') pt.vy += 0.04; return pt.life > 0; });
    
    if (w.finalChoice === 'no') { w.cryTimer++; if (w.cryTimer % 40 === 0) audio.playCrying(); }
    if (w.finalChoice === 'yes') {
      if (Math.random() < 0.4) { 
        const fx = Math.random() * CANVAS_WIDTH; const fy = Math.random() * CANVAS_HEIGHT * 0.5; audio.playFirework();
        for (let i = 0; i < 45; i++) { 
            const a = (Math.PI * 2 / 45) * i; 
            w.particles.push({ x: fx, y: fy, vx: Math.cos(a) * (8 + Math.random() * 6), vy: Math.sin(a) * (8 + Math.random() * 6), color: ['#ffeb3b', '#f48fb1', '#00e676', '#29b6f6', '#ff1744', '#ffffff', '#ff4081'][Math.floor(Math.random() * 7)], size: 4, life: 90, type: 'confetti' }); 
        }
      }
      if (Math.random() < 0.75) {
        w.particles.push({ 
          x: Math.random() * CANVAS_WIDTH, y: -20, vx: (Math.random() - 0.5) * 6, vy: 4 + Math.random() * 5, 
          color: ['#f48fb1', '#ce93d8', '#90caf9', '#a5d6a7', '#ff80ab'][Math.floor(Math.random() * 5)], 
          size: 7, life: 200, type: 'petal' 
        });
      }
    }

    if (w.ringVisible && !w.finalChoice) {
        if (Math.random() < 0.15) w.particles.push({ x: w.ringPos.x + Math.random() * 25, y: w.ringPos.y + Math.random() * 25, vx: (Math.random() - 0.5), vy: (Math.random() - 0.5), color: '#ffffff', size: 3, life: 35, type: 'sparkle' });
    }

    if (gameState === GameState.CUTSCENE) {
        const d = dialogueRef.current;
        if (d.active && d.textProgress < d.dialogues[d.index].text.length) { 
            d.textProgress += 0.45; 
            if (Math.floor(d.textProgress) % 5 === 0) {
               const speakerName = d.dialogues[d.index].speaker;
               const isFemale = speakerName === customization.name ? (customization.gender === 'female') : (partnerCustomization.gender === 'female');
               audio.playDialogue(isFemale);
            }
        }
        if (w.cutsceneStep === 2) {
            const tx = p.pos.x + 22; const ty = p.pos.y + 12; w.ringPos.x += (tx - w.ringPos.x) * 0.06; w.ringPos.y += (ty - w.ringPos.y) * 0.06;
            if (Math.hypot(w.ringPos.x - tx, w.ringPos.y - ty) < 4) { w.ringOwner = 'guy'; w.cutsceneStep = 3; setTimeout(() => setGameState(GameState.END), 1500); }
        }
        return;
    }
    if (gameState !== GameState.PLAY) return;
    if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) { p.vel.x = MOVE_SPEED; p.facing = 1; } else if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) { p.vel.x = -MOVE_SPEED; p.facing = -1; } else { p.vel.x *= 0.8; }
    if ((keysRef.current['ArrowUp'] || keysRef.current['KeyW'] || keysRef.current['Space']) && p.onGround) { p.vel.y = JUMP_FORCE; p.onGround = false; audio.playJump(); }
    const effG = p.hasBalloon ? BALLOON_GRAVITY : GRAVITY;
    if (p.hasBalloon && (keysRef.current['ArrowUp'] || keysRef.current['KeyW'] || keysRef.current['Space'])) p.vel.y = BALLOON_LIFT;
    p.vel.y += effG; p.pos.x += p.vel.x; p.pos.y += p.vel.y; p.onGround = false;
    GAME_LEVEL.platforms.forEach(plat => checkCollision(p, plat.x, plat.y, plat.w, plat.h, false, undefined, plat.type));
    
    w.items.forEach(it => { 
        if (!it.collected) {
            if (it.type === 'box' || it.type === 'chest') {
                checkCollision(p, it.pos.x, it.pos.y, it.width, it.height, true, it);
            } else if (rectIntersect(p.pos.x, p.pos.y, p.width, p.height, it.pos.x, it.pos.y, it.width, it.height)) {
                it.collected = true;
                if (it.type === 'heart') p.heartsCollected++; else if (it.type === 'flower') p.flowersCollected++;
                audio.playCollect();
                onHeartCollect(p.heartsCollected, p.flowersCollected, p.keysCollected);
            }
        }
    });

    w.spawnedItems.forEach(si => { if (!si.collected) { si.vel.y += GRAVITY; si.pos.y += si.vel.y; si.pos.x += si.vel.x; si.vel.x *= 0.98; GAME_LEVEL.platforms.forEach(plat => { if (rectIntersect(si.pos.x, si.pos.y, si.width, si.height, plat.x, plat.y, plat.w, plat.h)) { if (si.vel.y > 0) { si.pos.y = plat.y - si.height; si.vel.y = -si.vel.y * 0.4; } } }); if (rectIntersect(p.pos.x, p.pos.y, p.width, p.height, si.pos.x, si.pos.y, si.width, si.height)) { si.collected = true; if (si.itemType === 'heart') p.heartsCollected++; else if (si.itemType === 'flower') p.flowersCollected++; audio.playCollect(); onHeartCollect(p.heartsCollected, p.flowersCollected, p.keysCollected); } } });
    w.balloons.forEach(b => { if (b.active && !p.hasBalloon && rectIntersect(p.pos.x, p.pos.y, p.width, p.height, b.pos.x, b.pos.y, b.width, b.height)) { b.active = false; p.hasBalloon = true; audio.playBalloon(); } });
    w.keys.forEach(k => { if (!k.collected && rectIntersect(p.pos.x, p.pos.y, p.width, p.height, k.pos.x, k.pos.y, k.width, k.height)) { k.collected = true; p.keysCollected++; audio.playCollect(); onHeartCollect(p.heartsCollected, p.flowersCollected, p.keysCollected); } });
    
    if (p.pos.y > GAME_LEVEL.height) { 
        p.lives--; 
        onLifeChange(p.lives); 
        if (p.lives > 0) { 
            p.pos = { x: Math.max(0, p.pos.x - 300), y: 250 }; 
            p.vel = { x: 0, y: 0 }; 
            p.hasBalloon = true;
            audio.playBoxHit(); 
        } 
    }
    if (p.pos.x > GAME_LEVEL.girlPos.x - 80 && p.heartsCollected >= 5 && p.flowersCollected >= 5) { setGameState(GameState.CUTSCENE); p.vel.x = 0; dialogueRef.current.active = true; }
    if (Math.abs(p.vel.x) > 0.5) p.animFrame += 0.28;
  };

  const checkCollision = (p: Player, ox: number, oy: number, ow: number, oh: number, inter: boolean, obj?: WorldObject, pT?: string) => {
    if (p.pos.x < ox + ow && p.pos.x + p.width > ox && p.pos.y < oy + oh && p.pos.y + p.height > oy) {
      const oX = Math.min(p.pos.x + p.width - ox, ox + ow - p.pos.x); const oY = Math.min(p.pos.y + p.height - oy, oy + oh - p.pos.y);
      if (oX > oY) {
        if (p.vel.y >= 0 && p.pos.y < oy) { p.pos.y = oy - p.height; p.vel.y = 0; p.onGround = true; }
        else if (p.vel.y < 0 && p.pos.y + p.height > oy + oh) {
          p.pos.y = oy + oh; p.vel.y = 0;
          if (inter && obj && !obj.collected) {
            if (obj.type === 'box') { 
                obj.collected = true; 
                audio.playBoxHit(); 
                const boxIdx = worldRef.current.items.filter(it => it.type === 'box').indexOf(obj);
                const type = boxIdx === 0 ? 'heart' : 'flower';
                worldRef.current.spawnedItems.push({ id: `boxspawn-${Date.now()}`, pos: { x: obj.pos.x, y: obj.pos.y - 40 }, vel: { x: (Math.random()-0.5)*3, y: -7 }, width: 24, height: 24, type, collected: false, active: true, itemType: type as any });
            }
          }
        }
      } else { if (p.vel.x > 0) p.pos.x = ox - p.width; else if (p.vel.x < 0) p.pos.x = ox + ow; }
    }
  };

  const rectIntersect = (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) => x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;

  const drawChar = (ctx: CanvasRenderingContext2D, x: number, y: number, facing: number, anim: number, custom: Customization, crying = false, pObj?: Player) => {
    ctx.save(); 
    // Idle bobbing
    let bob = 0;
    if (Math.abs(pObj?.vel.x || 0) < 0.2 && pObj?.onGround) bob = Math.sin(worldRef.current.time * 0.1) * 2;
    ctx.translate(x + 14, y + bob); 
    if (facing === -1) ctx.scale(-1, 1); 
    ctx.translate(-14, 0);

    const px = 2; const outline = '#2d2d44'; const skin = SKIN_COLORS[custom.skin]; const hairC = HAIR_COLORS[custom.hairColor % HAIR_COLORS.length];
    const isFemale = custom.gender === 'female';
    const outfitColors = isFemale ? FEMALE_OUTFITS : MALE_OUTFITS;
    const outfit = outfitColors[custom.outfit % outfitColors.length];
    const drawP = (pxX: number, pxY: number, color: string, w = 1, h = 1) => { ctx.fillStyle = color; ctx.fillRect(pxX * px, pxY * px, w * px, h * px); };
    
    // Hair
    if (isFemale && custom.hair === 2) { drawP(2, 6, hairC, 11, 12); }
    drawP(3, 1, outline, 9, 13); drawP(2, 14, outline, 11, 8); 
    drawP(3, 1, skin, 9, 13);
    if (isFemale) {
      if (custom.hair === 0) { drawP(3, 1, hairC, 9, 5); drawP(12, 4, hairC, 3, 5); }
      else if (custom.hair === 1) { drawP(3, 1, hairC, 9, 4); }
      else if (custom.hair === 2) { drawP(2, 1, hairC, 11, 5); }
    } else {
      if (custom.hair === 0) { drawP(3, 0, hairC, 9, 2); drawP(2, 1, hairC, 11, 4); }
      else if (custom.hair === 1) { drawP(3, 1, hairC, 9, 4); }
    }
    // Eyes
    drawP(3, 6, skin, 9, 7); drawP(8, 8, outline, 1, 2); drawP(11, 8, outline, 1, 2);
    // Beard
    if (!isFemale) {
      if (custom.facialHair === 1) drawP(4, 11, hairC, 7, 3); else if (custom.facialHair === 2) drawP(6, 11, hairC, 3, 1);
    }
    // Legs Animation
    let legOff = Math.sin(anim) * 2;
    if (pObj && !pObj.onGround) legOff = 3; // Jumping pose
    if (isFemale) {
      drawP(4, 14, outfit, 7, 3); drawP(2, 17, outfit, 11, 7); 
      drawP(4, 24, skin, 2, 3 + legOff); drawP(9, 24, skin, 2, 3 - legOff);
    } else {
      drawP(2, 14, outfit, 11, 5); drawP(3, 19, '#333', 9, 4); 
      drawP(4, 23, outline, 2, 4 + legOff); drawP(9, 23, outline, 2, 4 - legOff);
    }
    if (crying) { 
        ctx.fillStyle = '#40c4ff'; 
        const cryOff = Math.sin(Date.now() / 80) * 2;
        ctx.fillRect(7*px, (11+cryOff)*px, px, 2*px); 
        ctx.fillRect(10*px, (11-cryOff)*px, px, 2*px); 
    }
    ctx.restore();
  };

  const drawChest = (ctx: CanvasRenderingContext2D, x: number, y: number, collected: boolean) => {
    const px = 2;
    const body = COLORS.CHEST;
    const trim = COLORS.CHEST_TRIM;
    const drawP = (pxX: number, pxY: number, color: string, w = 1, h = 1) => { ctx.fillStyle = color; ctx.fillRect(x + pxX * px, y + pxY * px, w * px, h * px); };
    if (!collected) {
        drawP(0, 4, body, 16, 12); drawP(0, 4, '#000', 16, 1); drawP(1, 1, body, 14, 4); 
        drawP(0, 4, trim, 1, 12); drawP(15, 4, trim, 1, 12); drawP(1, 1, trim, 1, 4);
        drawP(14, 1, trim, 1, 4); drawP(1, 1, trim, 14, 1); drawP(7, 4, trim, 2, 3); drawP(7, 5, '#000', 2, 1);
    } else {
        drawP(0, 8, body, 16, 8); drawP(0, 8, trim, 1, 8); drawP(15, 8, trim, 1, 8);
        drawP(0, 0, body, 16, 6); drawP(0, 0, trim, 16, 1); drawP(0, 5, '#000', 16, 2); 
    }
  };

  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, s = 1, broken = false) => { 
    ctx.save(); ctx.translate(x+16, y+16); ctx.scale(s, s); ctx.translate(-16, -16); 
    ctx.fillStyle = COLORS.HEART; ctx.beginPath(); ctx.moveTo(16, 26); 
    ctx.bezierCurveTo(4, 16, 4, 4, 16, 10); ctx.bezierCurveTo(28, 4, 28, 16, 16, 26); ctx.fill(); 
    if (broken) {
        ctx.strokeStyle = '#000'; ctx.lineWidth = 2.0; ctx.beginPath();
        ctx.moveTo(16, 6); ctx.lineTo(13, 11); ctx.lineTo(19, 15); ctx.lineTo(13, 20); ctx.lineTo(16, 26);
        ctx.stroke();
    }
    ctx.restore(); 
  };

  const drawFlower = (ctx: CanvasRenderingContext2D, x: number, y: number, s = 1) => { ctx.save(); ctx.translate(x+16, y+16); ctx.scale(s, s); ctx.translate(-16,-16); ctx.fillStyle = COLORS.FLOWER; for(let i=0; i<5; i++){ ctx.beginPath(); const a = (i*Math.PI*2)/5; ctx.ellipse(16+Math.cos(a)*8, 16+Math.sin(a)*8, 6, 6, 0, 0, Math.PI*2); ctx.fill(); } ctx.fillStyle = '#fff176'; ctx.beginPath(); ctx.arc(16, 16, 5, 0, Math.PI*2); ctx.fill(); ctx.restore(); };
  const drawCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, sc: number) => { ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.fillStyle = COLORS.CLOUD; ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.arc(24, -10, 26, 0, Math.PI*2); ctx.arc(48, 0, 22, 0, Math.PI*2); ctx.arc(24, 12, 20, 0, Math.PI*2); ctx.fill(); ctx.restore(); };

  const drawRing = (ctx: CanvasRenderingContext2D, x: number, y: number, big = false) => {
    const scale = big ? 3.8 : 1.3;
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(4, 6, 4, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#e1f5fe'; ctx.beginPath();
    ctx.moveTo(4, 0); ctx.lineTo(7, 3); ctx.lineTo(4, 6); ctx.lineTo(1, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(3, 1, 2, 2);
    ctx.restore();
  };

  const draw = () => {
    const canvas = canvasRef.current; if (!canvas) return; const ctx = canvas.getContext('2d'); if (!ctx) return;
    const p = playerRef.current; const w = worldRef.current;
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT); ctx.save();
    ctx.translate(CANVAS_WIDTH/2, CANVAS_HEIGHT/2); ctx.scale(w.cameraZoom, w.cameraZoom); ctx.translate(-CANVAS_WIDTH/2 - w.cameraCurrentX, -CANVAS_HEIGHT/2 - w.cameraCurrentY);
    
    // Parallax Layers
    w.cloudsFar.forEach(c => drawCloud(ctx, c.x + w.cameraCurrentX * 0.25, c.y, c.sc));
    w.cloudsNear.forEach(c => drawCloud(ctx, c.x + w.cameraCurrentX * 0.1, c.y, c.sc));
    GAME_LEVEL.decorations.forEach(dec => { 
        const x = dec.x + w.cameraCurrentX * 0.05;
        if (dec.type === 'hill') { ctx.fillStyle = COLORS.HILL; ctx.beginPath(); ctx.moveTo(x, dec.y); ctx.quadraticCurveTo(x + 60, dec.y - 90, x + 120, dec.y); ctx.fill(); } 
        else { ctx.fillStyle = '#4caf50'; ctx.fillRect(x, dec.y-12, 2, 12); ctx.fillStyle = '#f06292'; ctx.beginPath(); ctx.arc(x, dec.y-12, 4, 0, Math.PI*2); ctx.fill(); } 
    });

    GAME_LEVEL.platforms.forEach(plat => { 
        ctx.fillStyle = plat.type === 'ground' ? COLORS.GROUND : COLORS.BOX; 
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h); ctx.strokeStyle = '#2d2d44'; ctx.strokeRect(plat.x, plat.y, plat.w, plat.h); 
    });
    
    w.chestButtonRect = null;
    w.items.forEach(it => { if (!it.collected) { if (it.type === 'heart') drawHeart(ctx, it.pos.x, it.pos.y); else if (it.type === 'flower') drawFlower(ctx, it.pos.x, it.pos.y); else if (it.type === 'chest') { drawChest(ctx, it.pos.x, it.pos.y, false); if (Math.hypot(p.pos.x - it.pos.x, p.pos.y - it.pos.y) < 90 && p.keysCollected >= 3) { const bX = it.pos.x-10, bY = it.pos.y-50; ctx.fillStyle = '#4caf50'; ctx.fillRect(bX, bY, 50, 28); ctx.fillStyle='white'; ctx.font='8px "Press Start 2P"'; ctx.fillText("OPEN", bX+5, bY+18); w.chestButtonRect = { x: bX - w.cameraCurrentX, y: bY - w.cameraCurrentY, w: 50, h: 28 }; } } else { ctx.fillStyle = COLORS.BOX; ctx.fillRect(it.pos.x, it.pos.y, 32, 32); ctx.fillStyle = 'white'; ctx.font = '12px "Press Start 2P"'; ctx.fillText('?', it.pos.x+10, it.pos.y+22); } } else if (it.type==='box'){ ctx.fillStyle = COLORS.BOX_INACTIVE; ctx.fillRect(it.pos.x, it.pos.y, 32, 32); } else if (it.type === 'chest') { drawChest(ctx, it.pos.x, it.pos.y, true); } });
    w.spawnedItems.forEach(si => { if (!si.collected) { if (si.itemType === 'heart') drawHeart(ctx, si.pos.x, si.pos.y); else if (si.itemType === 'flower') drawFlower(ctx, si.pos.x, si.pos.y); else drawFlower(ctx, si.pos.x, si.pos.y); } });
    w.keys.forEach((k, i) => { if (!w.keys[i].collected) { ctx.fillStyle = COLORS.KEY; ctx.fillRect(k.pos.x, k.pos.y, 14, 8); ctx.fillRect(k.pos.x+10, k.pos.y+8, 4, 12); } });
    w.balloons.forEach(b => { if (b.active) { ctx.fillStyle = COLORS.BALLOON; ctx.beginPath(); ctx.ellipse(b.pos.x+12, b.pos.y+12, 10, 14, 0, 0, Math.PI*2); ctx.fill(); } });
    
    let px = p.pos.x, py = p.pos.y, gx = GAME_LEVEL.girlPos.x, gy = GAME_LEVEL.girlPos.y;
    if (gameState === GameState.END) { px = CANVAS_WIDTH/2 - 75 + w.cameraCurrentX; gx = CANVAS_WIDTH/2 + 45 + w.cameraCurrentX; py = 352; gy = 352; }
    drawChar(ctx, px, py, p.facing, p.animFrame, customization, false, p);
    drawChar(ctx, gx, gy, -1, 0, partnerCustomization, w.finalChoice === 'no');

    if (w.ringVisible) { 
        let rX = w.ringPos.x, rY = w.ringPos.y; 
        if (gameState === GameState.END) { rX = gx - 55; rY = gy + 15; } 
        drawRing(ctx, rX, rY, gameState === GameState.END);
    }

    if (p.hasBalloon && (gameState === GameState.PLAY || gameState === GameState.CUTSCENE)) { 
        const bX = p.pos.x + (p.facing === 1 ? -14 : 38), bY = p.pos.y - 15 + Math.sin(w.time * 0.1) * 3; 
        ctx.fillStyle = COLORS.BALLOON; ctx.beginPath(); ctx.ellipse(bX, bY, 12, 16, 0, 0, Math.PI*2); ctx.fill(); 
        ctx.beginPath(); ctx.moveTo(bX, bY+12); ctx.lineTo(p.pos.x+14, p.pos.y+15); ctx.stroke(); 
    }
    w.particles.forEach(pt => { if (pt.type === 'heart') drawHeart(ctx, pt.x, pt.y, 0.6); else if (pt.type === 'flower') drawFlower(ctx, pt.x, pt.y, 0.6); else { ctx.fillStyle = pt.color; ctx.fillRect(pt.x, pt.y, pt.size, pt.size); } });
    ctx.restore();

    if (gameState === GameState.CUTSCENE && dialogueRef.current.active && w.cutsceneStep === 0) {
      const d = dialogueRef.current; const activeD = d.dialogues[d.index]; const text = activeD.text.substring(0, Math.floor(d.textProgress));
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'; ctx.fillRect(50, 20, 700, 110); 
      ctx.lineWidth = 4; ctx.strokeStyle = '#000'; ctx.strokeRect(50, 20, 700, 110);
      ctx.fillStyle = '#2d2d44'; ctx.font = '10px "Press Start 2P"'; ctx.fillText(`${activeD.speaker}:`, 75, 55); 
      ctx.font = '9px "Press Start 2P"'; ctx.fillText(text, 75, 90);
    }
    if (gameState === GameState.END) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 100, CANVAS_WIDTH, 200); 
        ctx.textAlign = 'center'; ctx.fillStyle = 'white'; ctx.font = '16px "Press Start 2P"'; 
        ctx.fillText("Will you be my Valentine?", CANVAS_WIDTH/2, 150);
        if (w.finalChoice === null) { 
            ctx.fillStyle = 'white'; ctx.fillRect(300, 200, 80, 45); ctx.fillStyle = '#4caf50'; ctx.fillText("YES", 340, 230); 
            ctx.fillStyle = 'white'; ctx.fillRect(420, 200, 80, 45); ctx.fillStyle = '#e53935'; ctx.fillText("NO", 460, 230); 
        } else if (w.finalChoice === 'no') { 
            ctx.fillStyle = 'white'; ctx.font = '12px "Press Start 2P"'; ctx.fillText("Heartbroken...", CANVAS_WIDTH/2, 260); 
            drawHeart(ctx, CANVAS_WIDTH/2 - 60, 0, 7, true); 
        } else { 
            ctx.fillStyle = '#ff4081'; ctx.font = '14px "Press Start 2P"'; ctx.fillText("Forever Together! ♥", CANVAS_WIDTH/2, 260); 
            drawHeart(ctx, CANVAS_WIDTH/2 - 60, 0, 8, false); 
        }
    }
  };

  useEffect(() => { let f: number; const loop = () => { update(); draw(); f = requestAnimationFrame(loop); }; if (gameState !== GameState.PAUSE) f = requestAnimationFrame(loop); return () => cancelAnimationFrame(f); }, [gameState]);

  return <canvas ref={canvasRef} onClick={handleCanvasClick} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="max-w-full h-auto cursor-pointer shadow-2xl" />;
};

export default GameCanvas;


import React, { useState, useEffect, useRef } from 'react';
import { GameState, Customization } from './types';
import GameCanvas from './components/GameCanvas';
import { audio } from './services/AudioManager';
import { SKIN_COLORS, HAIR_COLORS, MALE_OUTFITS, FEMALE_OUTFITS } from './constants';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [customizeStep, setCustomizeStep] = useState<'player' | 'partner'>('player');
  const [hearts, setHearts] = useState(0);
  const [flowers, setFlowers] = useState(0);
  const [keys, setKeys] = useState(0);
  const [lives, setLives] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [gameKey, setGameKey] = useState(0); 
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const [playerCustom, setPlayerCustom] = useState<Customization>({
    name: 'HERO',
    gender: 'male',
    hair: 1, 
    hairColor: 0,
    skin: 0,
    outfit: 0,
    facialHair: 0
  });

  const [partnerCustom, setPartnerCustom] = useState<Customization>({
    name: 'SWEETIE',
    gender: 'female',
    hair: 2, 
    hairColor: 1,
    skin: 0,
    outfit: 0,
    facialHair: 0
  });

  const handleGoToCustomize = () => {
    audio.init();
    setGameState(GameState.CUSTOMIZE);
    setCustomizeStep('player');
  };

  const handleNextStep = () => {
    if (customizeStep === 'player') {
      setCustomizeStep('partner');
    } else {
      handleStart();
    }
  };

  const handleStart = () => {
    audio.resume();
    audio.startBGM();
    setGameState(GameState.PLAY);
    setLives(3);
  };

  const handlePause = () => {
    if (gameState !== GameState.PLAY && gameState !== GameState.PAUSE) return;
    const newState = !isPaused;
    setIsPaused(newState);
    setGameState(newState ? GameState.PAUSE : GameState.PLAY);
    if (newState) audio.suspend(); else audio.resume();
  };

  const handleRestart = () => {
    audio.stopBGM();
    setHearts(0); setFlowers(0); setKeys(0); setLives(3);
    setGameState(GameState.START);
    setIsPaused(false);
    setGameKey(prev => prev + 1); 
    audio.resume();
  };

  useEffect(() => {
    if (gameState !== GameState.CUSTOMIZE || !previewCanvasRef.current) return;
    const ctx = previewCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const currentCustom = customizeStep === 'player' ? playerCustom : partnerCustom;

    const drawCharPreview = (x: number, y: number, custom: Customization) => {
      const px = 6; 
      const outline = '#2d2d44'; 
      const skin = SKIN_COLORS[custom.skin]; 
      const hairC = HAIR_COLORS[custom.hairColor % HAIR_COLORS.length]; 
      const isFemale = custom.gender === 'female';
      const outfitColors = isFemale ? FEMALE_OUTFITS : MALE_OUTFITS;
      const outfit = outfitColors[custom.outfit % outfitColors.length];
      
      const drawP = (pxX: number, pxY: number, color: string, w = 1, h = 1) => { 
        ctx.fillStyle = color; 
        ctx.fillRect(x + pxX * px, y + pxY * px, w * px, h * px); 
      };

      if (isFemale && custom.hair === 2) {
        drawP(2, 6, hairC, 11, 14);
      }

      drawP(3, 1, outline, 9, 13); 
      drawP(2, 14, outline, 11, 8); 
      drawP(3, 1, skin, 9, 13); 

      if (isFemale) {
        if (custom.hair === 0) {
          drawP(3, 1, hairC, 9, 5); 
          drawP(12, 4, hairC, 3, 5); 
        } else if (custom.hair === 1) {
          drawP(3, 1, hairC, 9, 4);
          drawP(11, 4, hairC, 1, 2);
        } else {
          drawP(2, 1, hairC, 11, 5);
        }
      } else {
        if (custom.hair === 0) {
          drawP(3, 0, hairC, 9, 2);
          drawP(2, 1, hairC, 11, 4);
          drawP(4, -1, hairC, 2, 1);
          drawP(8, -1, hairC, 2, 1);
        } else if (custom.hair === 1) {
          drawP(3, 1, hairC, 9, 4);
        }
      }

      drawP(3, 6, skin, 9, 7); 
      drawP(8, 8, outline, 1, 2); 
      drawP(11, 8, outline, 1, 2);

      if (!isFemale) {
        if (custom.facialHair === 1) drawP(4, 11, hairC, 7, 3); 
        else if (custom.facialHair === 2) drawP(6, 11, hairC, 3, 1);
      }

      if (isFemale) {
        drawP(4, 14, outfit, 7, 3); 
        drawP(2, 17, outfit, 11, 8); 
        drawP(4, 25, skin, 2, 3); 
        drawP(9, 25, skin, 2, 3);
      } else {
        drawP(2, 14, outfit, 11, 5); 
        drawP(3, 19, '#333', 9, 5); 
        drawP(4, 24, outline, 2, 4); 
        drawP(9, 24, outline, 2, 4);
      }
    };

    ctx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
    drawCharPreview(80, 20, currentCustom);

    ctx.fillStyle = '#2d2d44';
    ctx.font = '10px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.fillText((customizeStep === 'player' ? "YOU" : "PARTNER"), 170, 25);
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText(currentCustom.name.toUpperCase() || "NAME", 170, 215);
  }, [gameState, customizeStep, playerCustom, partnerCustom]);

  const renderCustomizer = (custom: Customization, setCustom: React.Dispatch<React.SetStateAction<Customization>>) => {
    const isFemale = custom.gender === 'female';
    const hairStyles = isFemale ? ['PONY', 'PIXIE', 'LONG'] : ['CURLY', 'SHORT', 'BALD'];
    const beards = ['NO BEARD', 'FULL BEARD', 'STACHE'];

    return (
      <div className="space-y-4 bg-white/95 p-6 pixel-border w-full max-w-lg mx-auto shadow-xl overflow-y-auto max-h-[360px] custom-scrollbar">
        <style>{`.custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #f06292; border: 2px solid black; }`}</style>
        <div>
          <label className="block text-[8px] text-pink-600 font-bold mb-2">NAME:</label>
          <input 
            type="text" 
            value={custom.name} 
            onKeyDown={(e) => e.stopPropagation()}
            onChange={e => setCustom({...custom, name: e.target.value.toUpperCase()})} 
            className="border-4 border-black p-2 w-full font-['Press Start 2P'] text-[10px] bg-pink-50 focus:bg-white outline-none" 
            maxLength={10}
          />
        </div>
        
        <div className="flex gap-2">
          <button onClick={()=>setCustom({...custom, gender: 'male'})} className={`flex-1 py-2 border-4 transition-all ${custom.gender==='male'?'bg-blue-400 text-white scale-105':'bg-gray-100 hover:bg-gray-200'} border-black text-[8px]`}>MALE</button>
          <button onClick={()=>setCustom({...custom, gender: 'female'})} className={`flex-1 py-2 border-4 transition-all ${custom.gender==='female'?'bg-pink-400 text-white scale-105':'bg-gray-100 hover:bg-gray-200'} border-black text-[8px]`}>FEMALE</button>
        </div>

        <div className="text-[8px] font-bold text-gray-700">SKIN TONE:</div>
        <div className="flex flex-wrap gap-2">
          {SKIN_COLORS.map((c, i) => (
            <button key={i} onClick={()=>setCustom({...custom, skin: i})} className={`w-8 h-8 border-4 transition-transform ${custom.skin===i?'border-pink-500 scale-125 z-10 shadow-lg':'border-black opacity-60 hover:opacity-100'}`} style={{backgroundColor: c}}/>
          ))}
        </div>

        <div className="text-[8px] font-bold text-gray-700">HAIR STYLE:</div>
        <div className="flex flex-wrap gap-2">
          {hairStyles.map((style, i) => (
            <button key={i} onClick={()=>setCustom({...custom, hair: i})} className={`px-2 py-1 border-4 transition-all ${custom.hair===i?'bg-yellow-200 border-yellow-600 scale-110 shadow-md font-bold':'bg-gray-100 border-black hover:bg-gray-200'} text-[7px]`}>
              {style}
            </button>
          ))}
        </div>

        <div className="text-[8px] font-bold text-gray-700">HAIR COLOR:</div>
        <div className="flex flex-wrap gap-2">
          {HAIR_COLORS.map((c, i) => (
            <button key={i} onClick={()=>setCustom({...custom, hairColor: i})} className={`w-8 h-8 border-4 transition-transform ${custom.hairColor===i?'border-pink-500 scale-125 z-10 shadow-lg':'border-black opacity-60 hover:opacity-100'}`} style={{backgroundColor: c}}/>
          ))}
        </div>

        <div className="text-[8px] font-bold text-gray-700">OUTFIT:</div>
        <div className="flex flex-wrap gap-2">
          {(isFemale ? FEMALE_OUTFITS : MALE_OUTFITS).map((c, i) => (
            <button key={i} onClick={()=>setCustom({...custom, outfit: i})} className={`w-8 h-8 border-4 transition-transform ${custom.outfit===i?'border-pink-500 scale-125 z-10 shadow-lg':'border-black opacity-60 hover:opacity-100'}`} style={{backgroundColor: c}}/>
          ))}
        </div>

        {!isFemale && (
          <>
            <div className="text-[8px] font-bold text-gray-700">FACIAL HAIR:</div>
            <div className="flex flex-wrap gap-2">
              {beards.map((b, i) => (
                <button key={i} onClick={()=>setCustom({...custom, facialHair: i})} className={`px-2 py-1 border-4 transition-all ${custom.facialHair===i?'bg-orange-200 border-orange-600 scale-110 font-bold':'bg-gray-100 border-black hover:bg-gray-200'} text-[7px]`}>{b}</button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-screen h-screen flex items-center justify-center bg-[#fce4ec] overflow-hidden select-none">
      <div className="relative pixel-border bg-[#bbdefb] overflow-hidden shadow-2xl" style={{ width: '800px', height: '450px' }}>
        <GameCanvas 
          key={gameKey}
          gameState={gameState} 
          setGameState={setGameState} 
          customization={playerCustom}
          partnerCustomization={partnerCustom}
          onHeartCollect={(hCount, fCount, kCount) => {
            setHearts(hCount); setFlowers(fCount); setKeys(kCount);
          }}
          onLifeChange={(l) => {
            setLives(l);
            if (l <= 0) { 
              audio.stopBGM(); 
              audio.playDramatic(); 
              alert("GAME OVER! TRUE LOVE REQUIRES PERSEVERANCE."); 
              handleRestart(); 
            }
          }}
        />

        {(gameState === GameState.PLAY || gameState === GameState.PAUSE) && (
          <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none z-10 scale-90 origin-top-left transition-opacity duration-300">
            <div className="flex items-center gap-2 bg-white/90 p-2 pixel-border">
              <span className="text-red-600 text-[8px] font-bold">LIVES: {lives}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/90 p-2 pixel-border">
              <span className="text-red-500 text-lg">♥</span>
              <span className="text-[8px] font-bold text-gray-800">{hearts} / 5</span>
            </div>
            <div className="flex items-center gap-2 bg-white/90 p-2 pixel-border">
              <span className="text-purple-500 text-lg">✿</span>
              <span className="text-[8px] font-bold text-gray-800">{flowers} / 5</span>
            </div>
            <div className="flex items-center gap-2 bg-white/90 p-2 pixel-border">
              <span className="text-yellow-500 text-lg">🔑</span>
              <span className="text-[8px] font-bold text-gray-800">{keys} / 3</span>
            </div>
          </div>
        )}

        {gameState === GameState.START && (
          <div className="absolute inset-0 bg-pink-100/95 flex flex-col items-center justify-center p-8 text-center z-20 transition-all duration-700 animate-in fade-in">
            <div className="mb-8 scale-110 transform hover:scale-115 transition-transform duration-500">
               <h1 className="text-2xl text-pink-600 drop-shadow-md mb-2 font-bold tracking-widest">THE CONQUEST FOR LOVE</h1>
               <h2 className="text-lg text-pink-400 drop-shadow-sm italic">Where there's love there's way</h2>
            </div>
            <div className="bg-white p-6 pixel-border mb-6 max-w-md shadow-lg border-pink-400">
              <p className="text-[10px] leading-relaxed text-gray-700 mb-4 font-bold uppercase tracking-tight">Collect 5 Hearts & 5 Flowers to prove your devotion!</p>
              <ul className="text-[8px] text-left space-y-3 text-gray-600 border-t pt-4 font-bold">
                <li><span className="text-pink-500">⬅ ➡</span> : Movement</li>
                <li><span className="text-pink-500">⬆</span> : Jump / Float</li>
                <li><span className="text-yellow-600">🔑</span> : Collect 3 keys for the chest</li>
                <li><span className="text-red-600">📦</span> : Head-butt boxes for items!</li>
              </ul>
            </div>
            <button onClick={handleGoToCustomize} className="px-10 py-5 bg-pink-500 hover:bg-pink-600 text-white pixel-border text-xs active:scale-95 transition-all shadow-xl hover:-translate-y-1 font-bold">START QUEST</button>
          </div>
        )}

        {gameState === GameState.CUSTOMIZE && (
          <div className="absolute inset-0 bg-[#bbdefb] flex z-20 overflow-hidden animate-in slide-in-from-right duration-500">
            <div className="flex-1 flex flex-col items-center justify-center bg-pink-100/30 p-4 border-r-8 border-black shadow-inner">
              <h2 className="text-[10px] text-pink-600 mb-4 font-bold uppercase underline tracking-widest">PREVIEW</h2>
              <div className="bg-white p-4 pixel-border shadow-xl transform hover:scale-105 transition-transform">
                <canvas ref={previewCanvasRef} width={340} height={240} className="pixelated" />
              </div>
              <div className="mt-4 text-[8px] text-gray-600 font-bold uppercase tracking-tighter">DESIGNING: {customizeStep === 'player' ? 'YOU' : 'PARTNER'}</div>
            </div>
            <div className="flex-[1.4] flex flex-col items-center justify-center p-6 bg-pink-50/50">
               <h2 className="text-[12px] text-pink-600 mb-4 font-bold uppercase tracking-[0.2em]">
                {customizeStep === 'player' ? '1: HERO PROFILE' : '2: SOULMATE PROFILE'}
               </h2>
               {customizeStep === 'player' ? renderCustomizer(playerCustom, setPlayerCustom) : renderCustomizer(partnerCustom, setPartnerCustom)}
               <button onClick={handleNextStep} className="mt-6 px-14 py-4 bg-pink-500 hover:bg-pink-600 text-white pixel-border text-[10px] active:scale-95 transition-all shadow-xl font-bold hover:scale-105">
                 {customizeStep === 'player' ? 'PROCEED TO PARTNER ➜' : 'BEGIN JOURNEY ➜'}
               </button>
            </div>
          </div>
        )}

        {gameState === GameState.PAUSE && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-in zoom-in duration-300">
            <h2 className="text-white text-3xl mb-10 drop-shadow-lg tracking-[0.3em] font-bold">PAUSED</h2>
            <button onClick={handlePause} className="px-12 py-5 bg-pink-500 hover:bg-pink-600 text-white pixel-border text-xs active:scale-95 transition-all shadow-2xl font-bold tracking-widest">RESUME GAME</button>
          </div>
        )}
      </div>

      <div className="fixed bottom-4 right-4 flex gap-4 pointer-events-auto z-50">
        <button onClick={handlePause} className="w-12 h-12 flex items-center justify-center bg-white pixel-border hover:bg-gray-100 text-lg active:scale-90 transition-all shadow-md">{isPaused ? '▶' : '||'}</button>
        <button onClick={handleRestart} className="px-6 h-12 bg-white pixel-border hover:bg-gray-100 text-[8px] active:scale-90 transition-all shadow-md font-bold uppercase tracking-tighter">RESTART</button>
      </div>
    </div>
  );
};

export default App;

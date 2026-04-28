import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { HelpCircle, MapPin, Target, ChevronRight, Play, QrCode, Trophy, Eye } from 'lucide-react';
import { App as CapApp } from '@capacitor/app';
import { Scanner } from './components/Scanner';
import { MarkersDemo } from './components/MarkersDemo';
import { ARObjectOverlay } from './components/ARObjectOverlay';
import { playClickSound, playSuccessChime, playErrorSound } from './lib/audio';
import { TREASURE_HUNT_STEPS } from './constants';
import { Leaderboard } from './components/Leaderboard';

import { SplashScreen } from './components/SplashScreen';

type View = 'splash' | 'home' | 'playing' | 'completed' | 'markers' | 'leaderboard' | 'name_input';
type GameState = 'scanning' | 'found' | 'clue';

export default function App() {
  const [view, setView] = useState<View>('splash');
  const [stepIndex, setStepIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState>('scanning');
  const [showHelp, setShowHelp] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [score, setScore] = useState(0);
  const [stepStartTime, setStepStartTime] = useState(0);
  const [totalStartTime, setTotalStartTime] = useState(0);
  const lastScannedRef = useRef<number>(0);

  // Handle Back Navigation
  useEffect(() => {
    const backListener = CapApp.addListener('backButton', () => {
      handleBack();
    });

    return () => {
      backListener.then(l => l.remove());
    };
  }, [view]);

  const handleBack = () => {
    if (view === 'home') {
      if (window.confirm('Do you want to exit the app?')) {
        CapApp.exitApp();
      }
    } else if (view === 'name_input' || view === 'markers' || view === 'leaderboard') {
      setView('home');
    } else if (view === 'playing') {
      if (window.confirm('Quit the current quest and return home?')) {
        setView('home');
      }
    } else if (view === 'completed') {
      setView('home');
    }
  };

  const currentStep = TREASURE_HUNT_STEPS[stepIndex];
  
  // Confetti effect for completion
  useEffect(() => {
    if (view === 'completed') {
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f59e0b', '#fbbf24', '#d97706']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f59e0b', '#fbbf24', '#d97706']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      playSuccessChime(); // Make sure audio context is initiated by now
      frame();
    }
  }, [view]);

  const handleStart = () => {
    playClickSound();
    setView('name_input');
  };

  const startAdventure = (name: string) => {
    setPlayerName(name);
    setStepIndex(0);
    setScore(0);
    setStepStartTime(Date.now());
    setTotalStartTime(Date.now());
    setGameState('scanning');
    setView('playing');
  };

  const handleScan = (data: string) => {
    if (gameState !== 'scanning') return;
    
    const now = Date.now();
    // Debounce scans slightly
    if (now - lastScannedRef.current < 1500) return;
    lastScannedRef.current = now;

    if (data === currentStep.id) {
      playSuccessChime();
      setGameState('found');
    } else if (TREASURE_HUNT_STEPS.some(s => s.id === data)) {
      // Scanned a valid marker, but wrong sequence
      playErrorSound();
      alert("You found a marker, but it's not the right one for this clue! Keep looking.");
    }
  };

  const handleInteractWithObject = () => {
    playClickSound();
    setGameState('clue');
  };

  const handleNextClue = () => {
    playClickSound();
    
    // Calculate score for the step just completed
    const timeTaken = Math.floor((Date.now() - stepStartTime) / 1000);
    const stepScore = 100 + Math.max(0, 100 - timeTaken);
    setScore(prev => prev + stepScore);

    if (stepIndex === TREASURE_HUNT_STEPS.length - 1) {
      const totalTime = Math.floor((Date.now() - totalStartTime) / 1000);
      const finalScore = score + stepScore;
      
      // Import and save score
      import('./lib/leaderboard').then(({ saveScore }) => {
        saveScore({
          name: playerName,
          score: finalScore,
          time: totalTime,
          date: new Date().toISOString()
        });
      });
      
      setView('completed');
    } else {
      setStepIndex(stepIndex + 1);
      setStepStartTime(Date.now());
      setGameState('scanning');
    }
  };

  if (view === 'markers') return <MarkersDemo onBack={() => setView('home')} />;
  if (view === 'leaderboard') return <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-6"><Leaderboard onBack={() => setView('home')} /></div>;

  const NameInput = () => {
    const [name, setName] = useState('');
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center p-8 max-w-md w-full bg-slate-900 rounded-[40px] border border-white/10 shadow-2xl"
      >
        <h2 className="text-2xl font-bold text-white mb-6 italic text-center">Identity Yourself, Explorer</h2>
        <input 
          autoFocus
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-lg focus:outline-none focus:border-cyan-500 transition-all mb-6"
          onKeyDown={(e) => e.key === 'Enter' && name.trim() && startAdventure(name)}
        />
        <button 
          disabled={!name.trim()}
          onClick={() => startAdventure(name)}
          className="w-full py-4 bg-cyan-500 text-white rounded-2xl font-bold uppercase tracking-widest text-sm shadow-lg shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
        >
          Begin Quest
        </button>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950 text-slate-100 font-sans overflow-hidden flex flex-col items-center justify-center">
      
      {/* SPLASH SCREEN */}
      {view === 'splash' && <SplashScreen onComplete={() => setView('home')} />}

      {/* HOME VIEW */}
      <AnimatePresence mode="wait">
        {view === 'home' && (
          <motion.div 
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center p-8 max-w-md w-full"
          >
             <div className="w-32 h-32 mb-8 relative">
               <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
               <img 
                 src="/assets/logo.png" 
                 alt="AR Treasure Hunt Logo" 
                 className="w-full h-full object-cover rounded-[2.5rem] shadow-[0_0_30px_rgba(34,211,238,0.3)] border border-white/10 relative z-10"
               />
             </div>
             
             <h1 className="text-4xl font-bold text-center text-cyan-400 mb-4 italic">
               AR Treasure Hunt
             </h1>
             <p className="text-slate-400 text-sm text-center mb-12 leading-relaxed">
               Experience the next generation of treasure hunting. Scan, solve, and discover hidden digital artifacts in your physical environment.
             </p>
             
             <div className="space-y-4 w-full">
               <button 
                 onClick={handleStart}
                 className="w-full flex items-center justify-center gap-2 bg-white text-black py-4 px-8 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all active:scale-95"
               >
                 <Play className="w-5 h-5 fill-current" /> Start Adventure
               </button>
                              <button 
                  onClick={() => setView('markers')}
                  className="w-full flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-sm uppercase tracking-widest py-4 px-8 rounded-2xl transition-all active:scale-95 hover:bg-white/20"
                >
                  <QrCode className="w-5 h-5" /> Print Demo Markers
                </button>

                <button 
                  onClick={() => setView('leaderboard')}
                  className="w-full flex items-center justify-center gap-2 bg-cyan-500/10 backdrop-blur-md border border-cyan-500/20 text-cyan-400 font-bold text-sm uppercase tracking-widest py-4 px-8 rounded-2xl transition-all active:scale-95 hover:bg-cyan-500/20"
                >
                  <Trophy className="w-5 h-5" /> Leaderboard
                </button>
              </div>
          </motion.div>
        )}

        {/* NAME INPUT VIEW */}
        {view === 'name_input' && <NameInput />}

        {/* PLAYING VIEW */}
        {view === 'playing' && (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
             {/* THE CAMERA LAYER */}
             <div className="absolute inset-0 bg-black">
               <Scanner 
                 isActive={gameState === 'scanning'} 
                 onScan={handleScan}
                 className="rounded-none border-none shadow-none" 
               />
             </div>
             
             {/* TOP HUD */}
             <div className="absolute top-0 left-0 right-0 p-6 pt-safe z-40 flex justify-between items-center pointer-events-none">
                 <div className="flex items-center space-x-2 bg-black/40 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10 pointer-events-auto">
                    <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                      {score} PTS
                    </span>
                 </div>
                
                <button 
                  onClick={() => { playClickSound(); setShowHelp(true); }}
                  className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all pointer-events-auto shadow-lg"
                >
                  <HelpCircle className="w-5 h-5 text-white" />
                </button>
             </div>
             
             {/* OBJECTIVE HUD */}
             <div className="absolute top-20 left-0 right-0 px-6 z-40 pointer-events-none">
               <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl pointer-events-auto">
                 <div className="flex items-center space-x-3 mb-3">
                   <div className="p-2 bg-cyan-500/20 rounded-lg text-cyan-400">
                     <Target className="w-5 h-5" />
                   </div>
                   <h3 className="text-lg font-semibold tracking-tight text-white mb-0">Current Objective</h3>
                 </div>
                 <p className="text-slate-300 text-sm leading-relaxed mb-4">
                   {gameState === 'scanning' ? currentStep.clueToFindThis : 'Target found! Tap to interact.'}
                 </p>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500" style={{ width: `${((stepIndex + (gameState === 'scanning' ? 0 : 0.5)) / TREASURE_HUNT_STEPS.length) * 100}%` }}></div>
                 </div>
               </div>
             </div>
             
             {/* AR OVERLAY LAYER (Appears when marker found) */}
             {gameState === 'found' && (
               <ARObjectOverlay type={currentStep.arObject} onInteract={handleInteractWithObject} />
             )}

             {/* CLUE MODAL */}
             <AnimatePresence>
                {gameState === 'clue' && (
                  <motion.div 
                    initial={{ opacity: 0, y: "100%" }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-3xl rounded-t-[48px] border-t border-white/10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] p-8 max-h-[80vh] overflow-y-auto"
                  >
                     <div className="w-16 h-1.5 bg-white/20 rounded-full mx-auto mb-8" />
                     
                     <div className="text-center mb-8">
                       <div className="inline-flex p-4 rounded-full bg-cyan-500/20 text-cyan-400 mb-4 border border-cyan-500/30">
                         <Target className="w-10 h-10" />
                       </div>
                       <h2 className="text-2xl font-bold mb-2 text-white">Item Collected!</h2>
                       <p className="text-slate-300">
                         {currentStep.successMessage}
                       </p>
                     </div>
                     
                     {stepIndex < TREASURE_HUNT_STEPS.length - 1 && (
                       <div className="bg-white/5 backdrop-blur-md p-6 rounded-3xl mb-8 border border-white/10 shadow-inner">
                          <p className="text-xs text-cyan-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Eye className="w-4 h-4"/> Next Clue</p>
                          <p className="text-sm text-slate-300 leading-relaxed font-medium">{TREASURE_HUNT_STEPS[stepIndex + 1].clueToFindThis}</p>
                       </div>
                     )}
                     
                     <button 
                       onClick={handleNextClue}
                       className="w-full py-4 bg-white text-black rounded-2xl font-bold text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
                     >
                       {stepIndex === TREASURE_HUNT_STEPS.length - 1 ? 'Reveal Treasure' : 'Continue Hunt'}
                       <ChevronRight className="w-4 h-4" />
                     </button>
                  </motion.div>
                )}
             </AnimatePresence>
          </motion.div>
        )}

        {/* COMPLETED VIEW */}
        {view === 'completed' && (
          <motion.div 
            key="completed"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center w-full max-w-sm p-8 text-center"
          >
             <div className="relative mb-8">
               <div className="absolute inset-0 bg-amber-500 blur-3xl opacity-40 rounded-full animate-pulse"></div>
               <Trophy className="w-40 h-40 text-amber-400 drop-shadow-2xl relative z-10" />
             </div>
              <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-500">
                Quest Complete!
              </h1>
              <p className="text-cyan-400 font-black text-5xl mb-4 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                {score}
              </p>
              <p className="text-slate-400 text-sm uppercase tracking-[0.2em] font-bold mb-8">
                Final Score
              </p>
              <p className="text-slate-300 text-base mb-12">
                Congratulations <span className="text-white font-bold">{playerName}</span>! You've successfully retrieved the artifacts.
              </p>
             
             <button 
               onClick={() => { playClickSound(); setView('home'); }}
               className="w-full bg-white text-black font-bold py-4 px-8 rounded-2xl text-sm uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
             >
               Play Again
             </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* HELP OVERLAY */}
      <AnimatePresence>
        {showHelp && (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="absolute inset-0 z-[100] bg-black/80 backdrop-blur flex items-center justify-center p-4"
           >
              <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
                 <h3 className="text-2xl font-bold mb-6 text-white text-center italic">How to Play</h3>
                 <ul className="space-y-4 mb-8">
                   <li className="flex gap-4 items-start">
                     <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">01</div>
                     <p className="text-slate-300 text-sm">Read the <span className="text-cyan-400 font-bold">Current Objective</span> at the top of your screen.</p>
                   </li>
                   <li className="flex gap-4 items-start">
                     <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">02</div>
                     <p className="text-slate-300 text-sm">Point your camera at the physical marker (QR code) corresponding to the clue.</p>
                   </li>
                   <li className="flex gap-4 items-start">
                     <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">03</div>
                     <p className="text-slate-300 text-sm">When the virtual object appears, tap it to collect your item and receive the next clue!</p>
                   </li>
                 </ul>
                 
                 <button 
                   onClick={() => { playClickSound(); setShowHelp(false); }}
                   className="w-full bg-white text-black font-bold py-4 rounded-2xl transition-all active:scale-95 text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                 >
                   Got it!
                 </button>
              </div>
           </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

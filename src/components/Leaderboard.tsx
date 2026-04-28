import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Clock, Star, ArrowLeft } from 'lucide-react';
import { getLeaderboard, LeaderboardEntry } from '../lib/leaderboard';

interface LeaderboardProps {
  onBack: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ onBack }) => {
  const scores = getLeaderboard();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="flex flex-col w-full max-w-md p-6 bg-slate-900/50 backdrop-blur-xl rounded-[40px] border border-white/10 shadow-2xl overflow-hidden"
    >
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
          <Trophy className="w-6 h-6 text-amber-400" />
          Hall of Fame
        </h2>
        <div className="w-11" /> {/* Spacer */}
      </div>

      <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
        {scores.length === 0 ? (
          <div className="py-12 text-center text-slate-500 italic">
            No legends yet. Be the first!
          </div>
        ) : (
          scores.map((entry, index) => (
            <motion.div
              key={`${entry.name}-${entry.date}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                index === 0 
                  ? 'bg-amber-500/10 border-amber-500/30' 
                  : index === 1 
                  ? 'bg-slate-300/10 border-slate-300/30'
                  : index === 2
                  ? 'bg-orange-500/10 border-orange-500/30'
                  : 'bg-white/5 border-white/5'
              }`}
            >
              <div className="flex items-center gap-4">
                <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                  index === 0 ? 'bg-amber-500 text-black' : 
                  index === 1 ? 'bg-slate-300 text-black' :
                  index === 2 ? 'bg-orange-500 text-black' :
                  'bg-white/10 text-white'
                }`}>
                  {index + 1}
                </span>
                <div>
                  <p className="font-bold text-white">{entry.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {entry.time}s • {new Date(entry.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-cyan-400 leading-none">{entry.score}</p>
                <p className="text-[10px] font-bold text-cyan-400/50 uppercase tracking-widest">Points</p>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <button
        onClick={onBack}
        className="mt-8 w-full py-4 bg-white text-black rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl active:scale-95 transition-all"
      >
        Back to Home
      </button>
    </motion.div>
  );
};

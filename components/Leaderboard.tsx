
import React from 'react';
import { Patrol, AttributeType, TroopName } from '../types';
import { XP_PER_LEVEL } from '../constants';
import { Trophy, Medal, Crown, Star, ShieldCheck, Flame, Award } from 'lucide-react';

interface LeaderboardProps {
  patrols: Patrol[];
}

const Leaderboard: React.FC<LeaderboardProps> = ({ patrols }) => {
  const getPatrolScore = (p: Patrol) => {
    const xpValues = [
      p.attributes[AttributeType.PRONTIDAO].totalXP,
      p.attributes[AttributeType.PROFICIENCIA].totalXP,
      p.attributes[AttributeType.FRATERNIDADE].totalXP
    ];
    const totalXP = xpValues.reduce((a, b) => a + b, 0);
    if (totalXP === 0) return 0;
    const levels = xpValues.map(xp => Math.floor(xp / XP_PER_LEVEL));
    const diff = Math.max(...levels) - Math.min(...levels);
    const balanceMultiplier = 1 + (1 / (1 + diff));
    // Multiplicado por 10 conforme solicitado para desempatar e motivar
    return Math.floor((totalXP / 10) * balanceMultiplier);
  };

  const getTier = (score: number) => {
    if (score >= 5000) return { name: 'Lendário', color: 'text-purple-400', icon: <Crown className="w-3 h-3"/> };
    if (score >= 3000) return { name: 'Mestre', color: 'text-red-400', icon: <Flame className="w-3 h-3"/> };
    if (score >= 1500) return { name: 'Elite', color: 'text-gold', icon: <Star className="w-3 h-3"/> };
    if (score >= 500) return { name: 'Veterano', color: 'text-blue-400', icon: <ShieldCheck className="w-3 h-3"/> };
    return { name: 'Novato', color: 'text-slate-400', icon: null };
  };

  return (
    <div className="space-y-10">
      <div className="flex items-center gap-2 mb-4 border-b border-gold/20 pb-2">
        <Trophy className="text-gold w-6 h-6" />
        <h2 className="rpg-font text-2xl text-gold uppercase tracking-tighter">Hall da Fama</h2>
      </div>

      {Object.values(TroopName).map(troop => {
        const troopPatrols = patrols
          .filter(p => p.troop === troop)
          .sort((a, b) => getPatrolScore(b) - getPatrolScore(a));

        return (
          <section key={troop} className="space-y-4">
            <h3 className="rpg-font text-lg text-slate-400 border-l-4 border-slate-700 pl-3 uppercase tracking-[0.2em] mb-4">
              Tropa {troop}
            </h3>
            
            <div className="space-y-4">
              {troopPatrols.map((patrol, index) => {
                const score = getPatrolScore(patrol);
                const tier = getTier(score);
                const hasPoints = score > 0;
                
                // DESTAQUE PARA OS DOIS PRIMEIROS LUGARES
                const isFirst = index === 0 && hasPoints;
                const isSecond = index === 1 && hasPoints;
                const isTopTier = isFirst || isSecond;
                
                return (
                  <div 
                    key={patrol.id} 
                    className={`rpg-panel flex items-center p-3 rounded-md transition-all relative overflow-hidden 
                      ${isFirst 
                        ? 'border-gold ring-2 ring-gold/40 bg-gradient-to-r from-gold/20 via-forest-green/20 to-transparent scale-[1.04] z-20 shadow-[0_0_20px_rgba(255,183,3,0.3)]' 
                        : isSecond
                        ? 'border-gold/80 ring-1 ring-gold/20 bg-gradient-to-r from-gold/10 via-forest-green/10 to-transparent scale-[1.01] z-10 shadow-[0_0_10px_rgba(255,183,3,0.15)]'
                        : 'opacity-90'}`}
                  >
                    {/* Medalha de Posição */}
                    <div className="w-12 flex flex-col justify-center items-center mr-3 border-r border-slate-700/50">
                      <span className={`rpg-font leading-none ${isFirst ? 'text-3xl text-gold' : isSecond ? 'text-2xl text-gold/80' : 'text-xl text-slate-500'}`}>
                        {index + 1}º
                      </span>
                      {isFirst && <Medal className="w-4 h-4 text-gold mt-1 animate-pulse" />}
                      {isSecond && <Medal className="w-3.5 h-3.5 text-slate-300 mt-1 opacity-80" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {isFirst && (
                        <div className="flex items-center gap-1 text-[7px] font-black text-gold uppercase tracking-[0.2em] mb-1">
                          <Award className="w-2.5 h-2.5" /> Campeão da Tropa
                        </div>
                      )}
                      {isSecond && (
                        <div className="flex items-center gap-1 text-[7px] font-black text-slate-300 uppercase tracking-[0.2em] mb-1">
                          <Star className="w-2.5 h-2.5" /> Destaque de Honra
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className={`font-bold truncate ${isTopTier ? 'text-white text-base' : 'text-slate-300'}`}>
                          {patrol.name}
                        </span>
                        <div className={`flex items-center gap-1 text-[7px] font-black uppercase px-1.5 py-0.5 rounded bg-black/40 border border-white/5 ${tier.color}`}>
                          {tier.icon} {tier.name}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right pl-3">
                      <div className="text-[7px] text-slate-500 font-black uppercase tracking-tighter">Poder</div>
                      <div className={`rpg-font leading-none ${isFirst ? 'text-3xl text-gold' : isSecond ? 'text-2xl text-gold/80' : 'text-xl text-white'}`}>
                        {score}
                      </div>
                    </div>

                    {/* Efeito Visual de Liderança - Brilho Inferior */}
                    {isFirst && (
                      <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-gold via-gold/50 to-transparent w-full" />
                    )}
                    {isSecond && (
                      <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-gold/40 via-transparent to-transparent w-full opacity-50" />
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="mt-8 p-4 bg-black/30 rounded-lg border border-slate-800/50 shadow-inner">
        <h4 className="text-[8px] font-black uppercase text-slate-500 mb-2 tracking-widest flex items-center gap-1">
          <Star className="w-2 h-2" /> Glória e Eficiência
        </h4>
        <p className="text-[9px] text-slate-400 italic leading-relaxed">
          O Poder de Patrulha (x10) garante maior precisão no ranking. As duas primeiras patrulhas de cada tropa são honradas com o status de Elite por seu desempenho superior.
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;

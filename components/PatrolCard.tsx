import React from 'react';
import { Patrol, AttributeType, PatrolName } from '../types';
import { XP_PER_LEVEL } from '../constants';
import { Leaf, Bird, ShieldAlert, Medal, Star } from 'lucide-react';

interface PatrolCardProps {
  patrol: Patrol;
  rank: number;
  score: number;
}

const PatrolCard: React.FC<PatrolCardProps> = ({ patrol, rank, score }) => {
  const getLevel = (xp: number) => Math.floor(xp / XP_PER_LEVEL);
  const getDisplayXP = (xp: number) => xp % XP_PER_LEVEL;

  const getPatrolIcon = (name: PatrolName) => {
    switch (name) {
      case 'Kaaete': return <Leaf className="w-5 h-5 text-emerald-400" />;
      case 'Kuruqui': return <Bird className="w-5 h-5 text-sky-400" />;
      default: return <ShieldAlert className="w-5 h-5 text-slate-500" />;
    }
  };

  const FleurDeLis = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L9.5 8.5C8 10 6.5 11 4 11.5C6.5 12 8 13 9.5 14.5L12 21L14.5 14.5C16 13 17.5 12 20 11.5C17.5 11 16 10 14.5 8.5L12 2Z" />
      <path d="M12 22C12 22 10 18 6 17C10 17 11 19 12 22Z" />
      <path d="M12 22C12 22 14 18 18 17C14 17 13 19 12 22Z" />
      <path d="M12 2C12 2 10 6 6 7C10 7 11 5 12 2Z" />
      <path d="M12 2C12 2 14 6 18 7C14 7 13 5 12 2Z" />
    </svg>
  );

  const attributes = [
    { type: AttributeType.PRONTIDAO, colorClass: 'progress-green' },
    { type: AttributeType.PROFICIENCIA, colorClass: 'progress-blue' },
    { type: AttributeType.FRATERNIDADE, colorClass: 'progress-gold' },
  ];

  const isFirst = rank === 1 && score > 0;

  return (
    <div className={`rpg-panel p-4 rounded-lg flex gap-3 items-center min-h-[95px] transition-all w-full relative overflow-hidden
      ${isFirst ? 'border-gold shadow-[0_0_15px_rgba(255,183,3,0.15)] bg-gradient-to-r from-gold/5 to-transparent' : 'hover:border-gold/30'}`}>
      
      {/* Badge de Posição Lateral */}
      <div className={`absolute top-0 left-0 px-2 text-[7px] font-black uppercase tracking-tighter rounded-br flex inline-block leading-loose pt-1 pb-1
        ${isFirst ? 'bg-gold text-forest-dark' : 'bg-slate-800 text-slate-400'}`}>
        {rank}º LUGAR
      </div>

      {/* Coluna Esquerda: Ícone e Info Principal */}
      <div className="flex items-center gap-2.5 w-[55%] border-r border-slate-700/50 pr-3">
        <div className={`p-2 bg-black/40 rounded-full shrink-0 shadow-inner relative ${isFirst ? 'ring-1 ring-gold/50' : ''}`}>
          {getPatrolIcon(patrol.name)}
          {isFirst && (
            <div className="absolute -top-1 -right-1">
              <Medal className="w-3 h-3 text-gold animate-bounce" />
            </div>
          )}
        </div>
        <div className="flex flex-col min-w-0">
          {/* Ajuste de leading-normal e py-1 para evitar corte da fonte Cinzel no html2canvas */}
          <h3 className={`rpg-font text-xl py-1 font-bold leading-normal whitespace-nowrap ${isFirst ? 'text-gold' : 'text-white'}`}>
            {patrol.name}
          </h3>
          <div className="flex flex-col">
            <p className="text-[14px] text-white font-black uppercase flex items-center gap-1 leading-none">
              <FleurDeLis className={`w-3 h-3 ${isFirst ? 'text-gold' : 'text-slate-500'}`} /> {score} <span className="text-[8px] text-slate-500">PODER</span>
            </p>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 ml-4 pl-8">
              {Object.values(patrol.attributes).reduce((sum, attr) => sum + attr.totalXP, 0)} XP
            </p>
          </div>
        </div>
      </div>

      {/* Coluna Direita: Barras de Atributos */}
      <div className="w-[45%] flex flex-col gap-2">
        {attributes.map(attr => {
          const xp = patrol.attributes[attr.type].totalXP;
          const lvl = getLevel(xp);
          const disp = getDisplayXP(xp);
          const pct = Math.max(2, (disp / XP_PER_LEVEL) * 100);

          return (
            <div key={attr.type} className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-[7px] font-black tracking-tighter text-slate-400 uppercase inline-block">
                <span className="opacity-70 truncate mr-1 leading-normal h-4">{attr.type.substring(0, 13)}</span>
                <span className={isFirst ? 'text-gold/80' : 'text-white/80'}>{lvl}</span>
              </div>
              <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full ${attr.colorClass} shadow-[0_0_5px_rgba(0,0,0,0.5)] transition-all duration-1000 ease-out`} 
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PatrolCard;
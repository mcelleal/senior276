
import React, { useState, useMemo } from 'react';
import { Patrol, AttributeType, GameType, TroopName } from '../types';
import { GAME_XP_REWARDS } from '../constants';
import { Swords, Star, Zap, Heart, X, MessageSquare, Wrench, Compass, Smile, Info, BookOpen, CheckCircle2, ShieldAlert, Link2 } from 'lucide-react';

interface ChiefPanelProps {
  patrols: Patrol[];
  onAddXP: (id: string, attr: AttributeType, xp: number, desc: string, comment?: string, groupId?: string) => void;
}

interface PendingAction {
  xp: number;
  attr: AttributeType;
  label: string;
}

const ChiefPanel: React.FC<ChiefPanelProps> = ({ patrols, onAddXP }) => {
  // Game Module State
  const [gameType, setGameType] = useState<GameType>('Técnico');
  const [rank1, setRank1] = useState<string[]>([]);
  const [rank2, setRank2] = useState<string[]>([]);
  const [rank3, setRank3] = useState<string[]>([]);
  const [fairPlayPatrols, setFairPlayPatrols] = useState<string[]>([]);
  const [gameComment, setGameComment] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [userComment, setUserComment] = useState('');
  const [selectedPatrolId, setSelectedPatrolId] = useState<string>('');

  // Helpers para formatação de exibição
  const getShortTroopName = (troop: TroopName) => {
    if (troop === TroopName.TARSILLA) return 'Tarsilla';
    if (troop === TroopName.ZUMBI) return 'Zumbi';
    return troop;
  };

  // Memoizar e ordenar patrulhas por tropa e nome
  const sortedPatrols = useMemo(() => {
    return [...patrols].sort((a, b) => {
      if (a.troop !== b.troop) return a.troop.localeCompare(b.troop);
      return a.name.localeCompare(b.name);
    });
  }, [patrols]);

  const handleToggleRank = (rankLevel: 1|2|3|'FP', patrolId: string) => {
    if (rankLevel === 1) {
      setRank1(prev => prev.includes(patrolId) ? prev.filter(id => id !== patrolId) : [...prev, patrolId]);
      setRank2(prev => prev.filter(id => id !== patrolId));
      setRank3(prev => prev.filter(id => id !== patrolId));
    } else if (rankLevel === 2) {
      setRank2(prev => prev.includes(patrolId) ? prev.filter(id => id !== patrolId) : [...prev, patrolId]);
      setRank1(prev => prev.filter(id => id !== patrolId));
      setRank3(prev => prev.filter(id => id !== patrolId));
    } else if (rankLevel === 3) {
      setRank3(prev => prev.includes(patrolId) ? prev.filter(id => id !== patrolId) : [...prev, patrolId]);
      setRank1(prev => prev.filter(id => id !== patrolId));
      setRank2(prev => prev.filter(id => id !== patrolId));
    } else if (rankLevel === 'FP') {
      setFairPlayPatrols(prev => prev.includes(patrolId) ? prev.filter(id => id !== patrolId) : [...prev, patrolId]);
    }
  };

  const handleGameSubmit = () => {
    if (!rank1.length && !rank2.length && !rank3.length && !fairPlayPatrols.length) return;
    const rewards = GAME_XP_REWARDS[gameType];
    
    const finalComment = gameComment.trim() || undefined;
    const groupId = `game_${Date.now()}`;
    
    // Define o atributo alvo baseado no tipo de jogo
    const targetAttribute = gameType === 'Recreativo' ? AttributeType.FRATERNIDADE : 
                            gameType === 'Estratégia' ? AttributeType.PRONTIDAO : 
                            AttributeType.PROFICIENCIA;

    rank1.forEach(id => onAddXP(id, targetAttribute, rewards[0], `1º lugar no Jogo ${gameType}`, finalComment, groupId));
    rank2.forEach(id => onAddXP(id, targetAttribute, rewards[1], `2º lugar no Jogo ${gameType}`, undefined, groupId));
    rank3.forEach(id => onAddXP(id, targetAttribute, rewards[2], `3º lugar no Jogo ${gameType}`, undefined, groupId));
    fairPlayPatrols.forEach(id => onAddXP(id, AttributeType.FRATERNIDADE, 50, `Fair Play no Jogo ${gameType}`, undefined, groupId));

    setRank1([]); setRank2([]); setRank3([]); setFairPlayPatrols([]); setGameComment('');
  };

  const openActionModal = (xp: number, attr: AttributeType, label: string) => {
    setPendingAction({ xp, attr, label });
    setUserComment('');
    setSelectedPatrolId(''); // Reset da seleção ao abrir
    setIsModalOpen(true);
  };

  const executeAction = () => {
    if (pendingAction && selectedPatrolId) {
      onAddXP(selectedPatrolId, pendingAction.attr, pendingAction.xp, pendingAction.label, userComment);
      setIsModalOpen(false);
      setPendingAction(null);
      setUserComment('');
      setSelectedPatrolId('');
    }
  };

  const gameTypes = [
    { type: 'Técnico' as GameType, icon: <Wrench className="w-5 h-5" /> },
    { type: 'Estratégia' as GameType, icon: <Compass className="w-5 h-5" /> },
    { type: 'Recreativo' as GameType, icon: <Smile className="w-5 h-5" /> },
  ];

  return (
    <div className="space-y-16 py-4">
      {/* Módulo de Jogos */}
      <section className="space-y-6">
        <div className="rpg-panel p-5 rounded-xl space-y-5 bg-forest-green/10 border-gold/20 shadow-2xl">
          <div className="flex flex-col gap-1 border-b border-white/10 pb-4">
            <h4 className="text-lg font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 rpg-font">
               <Swords className="w-6 h-6 text-gold" /> Lançamento de Jogos
            </h4>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
              {gameType === 'Recreativo' ? 'Atribuição de Fraternidade e Fair Play' : 
               gameType === 'Estratégia' ? 'Atribuição de Prontidão e Fair Play' : 
               'Atribuição de Proficiência e Fair Play'}
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {gameTypes.map(({ type, icon }) => (
                <button 
                  key={type} 
                  onClick={() => setGameType(type)} 
                  className={`flex flex-col items-center justify-center gap-1 py-3 px-1 rounded-xl transition-all duration-150 relative
                    ${gameType === type 
                      ? 'bg-gold border-b-0 translate-y-0.5 shadow-inner text-forest-dark ring-2 ring-black/20' 
                      : 'bg-forest-green border-b-2 border-black/40 shadow-md text-slate-300 active:translate-y-0.5 active:border-b'}`}
                >
                  <div className={`${gameType === type ? 'text-forest-dark' : 'text-gold'} transition-colors scale-75`}>{icon}</div>
                  <span className="text-[9px] font-black uppercase tracking-tighter">{type}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6 border-t border-white/5 pt-6">
            <div className="flex gap-4">
              {/* Coluna Tarsilla */}
              <div className="flex-1 space-y-3">
                <h5 className="text-[10px] font-black text-gold/80 uppercase tracking-widest border-b border-gold/20 pb-1 mb-2">Tarsilla</h5>
                {sortedPatrols.filter(p => p.troop === TroopName.TARSILLA).map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{p.name}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(rank => (
                        <button
                          key={rank}
                          onClick={() => handleToggleRank(rank as 1|2|3, p.id)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                            (rank === 1 && rank1.includes(p.id)) ? 'bg-gold text-forest-dark ring-2 ring-gold/50' :
                            (rank === 2 && rank2.includes(p.id)) ? 'bg-[#cccccc] text-forest-dark ring-2 ring-[#cccccc]/50' :
                            (rank === 3 && rank3.includes(p.id)) ? 'bg-amber-600 text-forest-dark ring-2 ring-amber-600/50' :
                            'bg-forest-dark border border-slate-700 text-slate-500 hover:border-slate-500'
                          }`}
                        >
                          {rank}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Coluna Zumbi */}
              <div className="flex-1 space-y-3">
                <h5 className="text-[10px] font-black text-gold/80 uppercase tracking-widest border-b border-gold/20 pb-1 mb-2">Zumbi</h5>
                {sortedPatrols.filter(p => p.troop === TroopName.ZUMBI).map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">{p.name}</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(rank => (
                        <button
                          key={rank}
                          onClick={() => handleToggleRank(rank as 1|2|3, p.id)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                            (rank === 1 && rank1.includes(p.id)) ? 'bg-gold text-forest-dark ring-2 ring-gold/50' :
                            (rank === 2 && rank2.includes(p.id)) ? 'bg-[#cccccc] text-forest-dark ring-2 ring-[#cccccc]/50' :
                            (rank === 3 && rank3.includes(p.id)) ? 'bg-amber-600 text-forest-dark ring-2 ring-amber-600/50' :
                            'bg-forest-dark border border-slate-700 text-slate-500 hover:border-slate-500'
                          }`}
                        >
                          {rank}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 space-y-1.5">
              <label className="text-[9px] font-black text-emerald-400 uppercase ml-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Heart className="w-2.5 h-2.5 fill-emerald-400/20" /> Espírito Escoteiro / Fair Play</span>
                <span className="bg-emerald-400/10 px-1.5 py-0.5 rounded text-[7px] border border-emerald-400/20">+50 XP</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {sortedPatrols.map(p => {
                  const isSelected = fairPlayPatrols.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleToggleRank('FP', p.id)}
                      className={`px-2 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                        isSelected 
                          ? 'bg-emerald-400 text-forest-dark' 
                          : 'bg-transparent text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-1 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" /> Relato da Chefia
              </label>
              <textarea 
                value={gameComment}
                onChange={e => setGameComment(e.target.value)}
                placeholder="Ex: Jogo técnico sobre bússola..."
                rows={2}
                className="w-full bg-black/40 border border-slate-800 p-3 rounded-xl text-xs text-slate-200 outline-none focus:border-gold/30 transition-colors resize-none shadow-inner"
              />
            </div>
          </div>

          <button onClick={handleGameSubmit} className="w-full bg-gold hover:bg-[#ffc300] text-forest-dark font-black py-5 rounded-xl uppercase tracking-[0.2em] text-sm shadow-[0_4px_0_0_#b45309] active:shadow-none active:translate-y-1 transition-all border-2 border-forest-dark/10">
            Distribuir os pontos
          </button>
        </div>
      </section>

      {/* Ações Rápidas */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1 border-l-4 border-emerald-500 bg-black/30 p-4 rounded-r-lg">
          <h4 className="text-lg font-black text-white uppercase tracking-[0.2em] flex items-center gap-3 rpg-font">
             <Zap className="w-6 h-6 text-emerald-500" /> Atos de Mérito
          </h4>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Bonificações e Sanções Rápidas</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => openActionModal(30, AttributeType.PROFICIENCIA, 'Ato Técnico / Pontual')} 
            className="rpg-panel p-5 bg-forest-green/20 border-b-4 border-black/40 rounded-xl border-l-4 border-l-blue-500 active:border-b-0 active:translate-y-1 shadow-lg transition-all text-left"
          >
            <div className="text-blue-400 font-black text-xs mb-1">+30 PROF</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Ato Técnico / Pontual</div>
          </button>
          
          <button 
            onClick={() => openActionModal(70, AttributeType.PROFICIENCIA, 'Especialidade / Insígnia')} 
            className="rpg-panel p-5 bg-forest-green/20 border-b-4 border-black/40 rounded-xl border-l-4 border-l-blue-500 active:border-b-0 active:translate-y-1 shadow-lg transition-all text-left"
          >
            <div className="text-blue-400 font-black text-xs mb-1">+70 PROF</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Especialidade / Insígnia</div>
          </button>

          <button 
            onClick={() => openActionModal(30, AttributeType.PRONTIDAO, 'Foco e Atenção')} 
            className="rpg-panel p-5 bg-forest-green/20 border-b-4 border-black/40 rounded-xl border-l-4 border-l-green-500 active:border-b-0 active:translate-y-1 shadow-lg transition-all text-left"
          >
            <div className="text-green-400 font-black text-xs mb-1">+30 PRONT</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Foco / Disciplina</div>
          </button>          
          <button 
            onClick={() => openActionModal(-30, AttributeType.PRONTIDAO, 'Atraso/Indisciplina')} 
            className="rpg-panel p-5 bg-red-900/10 border-b-4 border-black/40 rounded-xl border-l-4 border-l-red-500 active:border-b-0 active:translate-y-1 shadow-lg transition-all text-left"
          >
            <div className="text-red-400 font-black text-xs mb-1">-30 PRONT</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Indisciplina</div>
          </button>
          <button 
            onClick={() => openActionModal(50, AttributeType.FRATERNIDADE, 'Boa Ação de Patrulha')} 
            className="rpg-panel p-5 bg-forest-green/20 border-b-4 border-black/40 rounded-xl border-l-4 border-l-gold active:border-b-0 active:translate-y-1 shadow-lg transition-all text-left"
          >
            <div className="text-gold font-black text-xs mb-1">+50 FRAT</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Espírito Escoteiro</div>
          </button>
          <button 
            onClick={() => openActionModal(-50, AttributeType.FRATERNIDADE, 'Sanção de Fraternidade')} 
            className="rpg-panel p-5 bg-red-900/10 border-b-4 border-black/40 rounded-xl border-l-4 border-l-red-500 active:border-b-0 active:translate-y-1 shadow-lg transition-all text-left"
          >
            <div className="text-red-500 font-black text-xs mb-1">-50 FRAT</div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Anti-Fraterno</div>
          </button>
        </div>

        <div className="rpg-panel p-5 rounded-xl bg-black/40 border-slate-800 space-y-4 shadow-inner">
          <div className="flex items-center gap-2 mb-1 border-b border-white/5 pb-2">
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em]">Códice de Eficiência</span>
          </div>
          <div className="grid gap-3">
            <p className="text-[10px] leading-relaxed">
              <strong className="text-green-400 font-black uppercase mr-1">Prontidão:</strong> Pontualidade, postura, inspeção e atenção às ordens do Chefe.
            </p>
            <p className="text-[10px] leading-relaxed">
              <strong className="text-blue-400 font-black uppercase mr-1">Proficiência:</strong> Evolução técnica, aplicação de nós, pioneirias e especialidades.
            </p>
            <p className="text-[10px] leading-relaxed">
              <strong className="text-gold font-black uppercase mr-1">Fraternidade:</strong> Cooperação entre patrulhas, ajuda mútua e cortesia.
            </p>
          </div>
        </div>
      </section>

      {/* Action Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="rpg-panel w-full max-w-xs p-8 rounded-2xl shadow-2xl bg-[#162a21] border-gold">
            <div className="flex justify-between items-center mb-6">
              <h3 className="rpg-font text-gold text-xl">Registrar Ato</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6"/></button>
            </div>
            
            <div className="mb-8 text-center py-4 bg-black/60 rounded-xl border border-white/5 shadow-inner">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{pendingAction?.label}</span>
              <div className={`text-3xl font-black mt-1 ${pendingAction && pendingAction.xp >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {pendingAction && (pendingAction.xp > 0 ? `+${pendingAction.xp}` : pendingAction.xp)} XP
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                  Patrulha Destinatária
                </label>
                <select 
                  value={selectedPatrolId} 
                  onChange={e => setSelectedPatrolId(e.target.value)}
                  className="w-full bg-forest-dark border-2 border-slate-700 p-4 rounded-xl text-base text-slate-100 outline-none focus:border-gold shadow-inner appearance-none"
                >
                  <option value="">Escolher...</option>
                  {sortedPatrols.map(p => (
                    <option key={p.id} value={p.id}>
                      {getShortTroopName(p.troop)} » {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" /> Motivação (Opcional)
                </label>
                <input 
                  type="text" 
                  value={userComment}
                  onChange={e => setUserComment(e.target.value)}
                  placeholder="Ex: Por auxiliar na limpeza..."
                  className="w-full bg-forest-dark border-2 border-slate-700 p-4 rounded-xl text-sm text-white focus:border-gold outline-none shadow-inner"
                />
              </div>

              <div className="pt-4">
                <button 
                  disabled={!selectedPatrolId}
                  onClick={executeAction} 
                  className={`w-full flex items-center justify-center gap-2 bg-gold text-forest-dark font-black py-5 rounded-xl uppercase tracking-[0.2em] text-xs shadow-[0_4px_0_0_#b45309] transition-all 
                    ${!selectedPatrolId 
                      ? 'opacity-30 grayscale cursor-not-allowed' 
                      : 'active:translate-y-1 active:shadow-none hover:bg-[#ffc300]'}`}
                >
                  <CheckCircle2 className="w-5 h-5" /> Confirmar
                </button>
                <button 
                  onClick={() => setIsModalOpen(false)} 
                  className="w-full mt-4 text-[10px] font-black uppercase text-slate-600 hover:text-slate-400 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChiefPanel;

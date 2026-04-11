
import React from 'react';
import { LogEntry, AttributeType } from '../types';
import { ScrollText, ArrowUpRight, ArrowDownRight, MessageSquare, Clock, Calendar, Swords, Trophy, Heart, Trash2 } from 'lucide-react';

interface EventLogProps {
  logs: LogEntry[];
  fullPage?: boolean;
  onDeleteLog?: (logId?: string, groupId?: string) => void;
}

const EventLog: React.FC<EventLogProps> = ({ logs, fullPage, onDeleteLog }) => {
  const getAttrColor = (attr: AttributeType) => {
    switch (attr) {
      case AttributeType.PRONTIDAO: return 'text-green-400';
      case AttributeType.PROFICIENCIA: return 'text-blue-400';
      case AttributeType.FRATERNIDADE: return 'text-gold';
      default: return 'text-slate-400';
    }
  };

  const formatDateTime = (ts: number) => {
    const d = new Date(ts);
    const dateStr = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} • ${timeStr}`;
  };

  // Agrupamento de logs por groupId
  const groupedLogs = React.useMemo(() => {
    const groups: (LogEntry | LogEntry[])[] = [];
    const processedGroupIds = new Set<string>();

    logs.forEach(log => {
      if (log.groupId && log.groupId.startsWith('game_')) {
        if (!processedGroupIds.has(log.groupId)) {
          const groupEntries = logs.filter(l => l.groupId === log.groupId);
          groups.push(groupEntries);
          processedGroupIds.add(log.groupId);
        }
      } else {
        groups.push(log);
      }
    });

    return groups;
  }, [logs]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <ScrollText className="text-gold w-6 h-6" />
        <h2 className="rpg-font text-2xl text-gold">Diário de Patrulhas</h2>
      </div>
      
      <div className="space-y-4 pb-8">
        {groupedLogs.length === 0 ? (
          <div className="text-center py-16">
             <ScrollText className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-20" />
             <p className="text-slate-600 italic text-sm">O diário está em branco...</p>
          </div>
        ) : (
          groupedLogs.map((item, idx) => {
            if (Array.isArray(item)) {
              // Renderização de Grupo de Jogo
              const mainEntry = item[0];
              const gameTypeStr = mainEntry.description.split('Jogo ')[1] || 'de Tropa';
              const isUnsynced = item.some(l => l.unsynced);
              const chiefComment = item.find(l => l.comment)?.comment;

              return (
                <div key={`group-${mainEntry.groupId}`} className={`rpg-panel p-4 rounded-lg bg-black/30 flex flex-col relative border-l-4 border-l-gold shadow-lg`}>
                  {isUnsynced && (
                    <div className="absolute top-2 right-4 flex items-center gap-1 bg-gold/10 px-1.5 py-0.5 rounded border border-gold/20">
                      <Clock className="w-2.5 h-2.5 text-gold animate-pulse" />
                      <span className="text-[7px] font-black text-gold uppercase tracking-tighter">Pendente</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5">
                    <Swords className="w-5 h-5 text-gold" />
                    <div className="flex flex-col">
                      <span className="text-xs font-black text-white uppercase tracking-wider leading-none">Resultado de Jogo</span>
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{gameTypeStr}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {item
                      .sort((a, b) => {
                        const getRank = (desc: string) => {
                          if (desc.includes('1º')) return 1;
                          if (desc.includes('2º')) return 2;
                          if (desc.includes('3º')) return 3;
                          if (desc.includes('Fair Play')) return 4;
                          return 5;
                        };
                        return getRank(a.description) - getRank(b.description);
                      })
                      .map(entry => (
                        <div key={entry.id} className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2">
                            {entry.description.includes('1º') && <Trophy className="w-3.5 h-3.5 text-gold" />}
                            {entry.description.includes('2º') && <Trophy className="w-3.5 h-3.5 text-slate-300" />}
                            {entry.description.includes('3º') && <Trophy className="w-3.5 h-3.5 text-amber-700" />}
                            {entry.description.includes('Fair Play') && <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />}
                            <span className="font-bold text-slate-200">{entry.patrolName}</span>
                            <span className="text-[9px] text-slate-500 uppercase font-black tracking-tighter opacity-60">
                              {entry.description.split(' no Jogo')[0]}
                            </span>
                          </div>
                          <div className={`font-black ${entry.xpValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            +{entry.xpValue} XP
                          </div>
                        </div>
                      ))}
                  </div>

                  {chiefComment && (
                    <div className="mb-4 p-3 bg-black/40 rounded-md flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-gold/50 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-300 leading-tight">{chiefComment}</p>
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-1.5 text-[8px] text-slate-600 font-black uppercase tracking-widest pt-2">
                    {onDeleteLog && !isUnsynced && (
                      <button 
                        onClick={() => onDeleteLog(undefined, mainEntry.groupId)}
                        className="flex items-center gap-1 text-red-500/70 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>CANCELAR</span>
                      </button>
                    )}
                    {!onDeleteLog || isUnsynced ? <div></div> : null}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-2 h-2" />
                      <span>{formatDateTime(mainEntry.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            } else {
              // Renderização Individual (Méritos/Sanções)
              const log = item;
              return (
                <div key={log.id} className={`rpg-panel p-4 rounded-lg bg-black/20 flex flex-col relative border-l-4 ${log.unsynced ? 'border-l-gold' : 'border-l-slate-700'}`}>
                  {log.unsynced && (
                    <div className="absolute top-2 right-4 flex items-center gap-1 bg-gold/10 px-1.5 py-0.5 rounded border border-gold/20">
                      <Clock className="w-2.5 h-2.5 text-gold animate-pulse" />
                      <span className="text-[7px] font-black text-gold uppercase tracking-tighter">Pendente</span>
                    </div>
                  )}

                  <div className="flex justify-between items-start mb-1">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-white leading-none mb-1">{log.patrolName}</span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{log.description}</span>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center justify-end text-lg font-black ${log.xpValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {log.xpValue >= 0 ? <ArrowUpRight className="w-4 h-4"/> : <ArrowDownRight className="w-4 h-4"/>}
                        {Math.abs(log.xpValue)} XP
                      </div>
                      <div className={`text-[9px] font-black uppercase tracking-tighter ${getAttrColor(log.attribute)}`}>
                        {log.attribute}
                      </div>
                    </div>
                  </div>

                  {log.comment && (
                    <div className="mt-2 p-2 bg-black/40 rounded-md border border-slate-800 flex items-start gap-2">
                      <MessageSquare className="w-3 h-3 text-gold/50 shrink-0 mt-0.5" />
                      <p className="text-sm text-slate-300 leading-tight">{log.comment}</p>
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-1.5 text-[8px] text-slate-600 font-black uppercase tracking-widest">
                    {onDeleteLog && !log.unsynced && (
                      <button 
                        onClick={() => onDeleteLog(log.id)}
                        className="flex items-center gap-1 text-red-500/70 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>CANCELAR</span>
                      </button>
                    )}
                    {!onDeleteLog || log.unsynced ? <div></div> : null}
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-2 h-2" />
                      <span>{formatDateTime(log.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );
            }
          })
        )}
      </div>
    </div>
  );
};

export default EventLog;

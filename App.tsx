
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TroopName, Patrol, AttributeType, LogEntry } from './types';
import { INITIAL_PATROLS, XP_PER_LEVEL } from './constants';
import PatrolCard from './components/PatrolCard';
import ChiefPanel from './components/ChiefPanel';
import EventLog from './components/EventLog';
import { Flag, Shield, Swords, Cloud, CloudOff, CloudCheck, Settings, Database, X, RefreshCw, AlertTriangle, ScrollText, Key, Lock, Clock, Camera, Share2 } from 'lucide-react';
import { syncService } from './syncService';
import html2canvas from 'html2canvas';

const DEFAULT_SYNC_URL = 'https://lulubastudio.com.br/scout276/sync.php';
const APP_VERSION = 'v1.0.0-senior';

const App: React.FC = () => {
  const [patrols, setPatrols] = useState<Patrol[]>(INITIAL_PATROLS);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [dbConfig, setDbConfig] = useState(() => {
    const saved = localStorage.getItem('senior_rpg_db_config');
    return saved ? JSON.parse(saved) : {
      url: DEFAULT_SYNC_URL,
      token: ''
    };
  });

  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'error' | 'loading' | 'none'>('none');
  const [isSyncLocked, setIsSyncLocked] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Nunca');
  const [activeTab, setActiveTab] = useState<'status' | 'logs' | 'panel'>('status');
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [configDraft, setConfigDraft] = useState(dbConfig);
  const [isCapturing, setIsCapturing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, message: string, onConfirm: () => void } | null>(null);
  const [alertDialog, setAlertDialog] = useState<{ isOpen: boolean, message: string } | null>(null);
  
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedLocal = useRef(false);
  const statusRef = useRef<HTMLDivElement>(null);

  const unsyncedCount = useMemo(() => logs.filter(l => l.unsynced).length, [logs]);

  useEffect(() => {
    const init = async () => {
      const savedPatrols = localStorage.getItem('senior_rpg_patrols');
      const savedLogs = localStorage.getItem('senior_rpg_logs');
      if (savedPatrols) setPatrols(JSON.parse(savedPatrols));
      if (savedLogs) setLogs(JSON.parse(savedLogs));
      hasLoadedLocal.current = true;
      if (dbConfig.url && dbConfig.token) {
        validateAndSync(dbConfig.url, dbConfig.token);
      } else {
        setSyncStatus('none');
        setIsSyncLocked(true);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!hasLoadedLocal.current) return;
    localStorage.setItem('senior_rpg_patrols', JSON.stringify(patrols));
    localStorage.setItem('senior_rpg_logs', JSON.stringify(logs));
  }, [patrols, logs]);

  const validateAndSync = async (url: string, token: string) => {
    setSyncStatus('loading');
    setErrorMessage(null);
    try {
      const remoteData = await syncService.pullData(url, token);
      if (remoteData === 'EMPTY') {
        setIsSyncLocked(false);
        setSyncStatus('none');
      } else if (remoteData && remoteData.patrols) {
        const localLogs = JSON.parse(localStorage.getItem('senior_rpg_logs') || '[]');
        const localPending = localLogs.filter((l: LogEntry) => l.unsynced);
        if (localPending.length > 0) {
          reconcileData(remoteData.patrols, remoteData.logs, localPending);
        } else {
          setPatrols(remoteData.patrols);
          setLogs(remoteData.logs || []);
        }
        setLastSyncTime(new Date(remoteData.lastUpdated).toLocaleTimeString());
        setSyncStatus('synced');
        setIsSyncLocked(false);
      }
    } catch (e: any) {
      setSyncStatus('error');
      setIsSyncLocked(true);
      setErrorMessage(e.message === 'AUTH_FAILED' ? "Token de Acesso Inválido." : "Não foi possível conectar ao servidor.");
    }
  };

  const handleSaveConfig = () => {
    setDbConfig(configDraft);
    localStorage.setItem('senior_rpg_db_config', JSON.stringify(configDraft));
    setShowConfigPanel(false);
    validateAndSync(configDraft.url, configDraft.token);
  };

  useEffect(() => {
    if (isSyncLocked || unsyncedCount === 0 || !dbConfig.url || !dbConfig.token) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(async () => {
      setSyncStatus('pending');
      try {
        const unsyncedLogs = logs.filter(l => l.unsynced);
        const remoteData = await syncService.pushData(dbConfig.url, {
          logs: unsyncedLogs,
          authToken: dbConfig.token
        });
        if (remoteData && remoteData.patrols) {
          setSyncStatus('synced');
          setLastSyncTime(new Date(remoteData.lastUpdated).toLocaleTimeString());
          setErrorMessage(null);
          // O servidor retorna a verdade absoluta, então substituímos os dados locais
          setPatrols(remoteData.patrols);
          setLogs(remoteData.logs || []);
        } else {
          setSyncStatus('error');
        }
      } catch (e: any) {
        setSyncStatus('error');
        if (e.message === 'AUTH_FAILED') {
          setIsSyncLocked(true);
          setErrorMessage("Token expirou ou é inválido.");
        }
      }
    }, 5000);
  }, [logs, isSyncLocked, unsyncedCount, dbConfig]);

  const reconcileData = (remotePatrols: Patrol[], remoteLogs: LogEntry[], localPending: LogEntry[]) => {
    let mergedPatrols = JSON.parse(JSON.stringify(remotePatrols)) as Patrol[];
    localPending.forEach(log => {
      const patrol = mergedPatrols.find(p => p.name === log.patrolName);
      if (patrol) {
        patrol.attributes[log.attribute].totalXP = Math.max(0, patrol.attributes[log.attribute].totalXP + log.xpValue);
      }
    });
    const mergedLogs = [...localPending, ...remoteLogs].slice(0, 100);
    setPatrols(mergedPatrols);
    setLogs(mergedLogs);
  };

  const addXP = (patrolId: string, attribute: AttributeType, amount: number, desc: string, comment?: string, groupId?: string) => {
    const patrol = patrols.find(p => p.id === patrolId);
    if (!patrol) return;
    setPatrols(prev => prev.map(p => {
      if (p.id === patrolId) {
        const currentXP = p.attributes[attribute].totalXP;
        return { ...p, attributes: { ...p.attributes, [attribute]: { totalXP: Math.max(0, currentXP + amount) } } };
      }
      return p;
    }));
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      patrolName: patrol.name,
      xpValue: amount,
      attribute,
      description: desc,
      comment: comment || undefined,
      unsynced: true,
      groupId
    };
    setLogs(prev => [newLog, ...prev].slice(0, 100));
  };

  const handleDeleteLog = async (logId?: string, groupId?: string) => {
    if (!dbConfig.url || !dbConfig.token) {
      setAlertDialog({ isOpen: true, message: "Configure a sincronização primeiro." });
      return;
    }
    
    const confirmMsg = groupId 
      ? "Tem certeza que deseja anular este JOGO INTEIRO? Os pontos de todas as patrulhas envolvidas serão removidos." 
      : "Tem certeza que deseja anular esta pontuação?";
      
    setConfirmDialog({
      isOpen: true,
      message: confirmMsg,
      onConfirm: async () => {
        setConfirmDialog(null);
        setSyncStatus('loading');
        try {
          const remoteData = await syncService.deleteLogs(dbConfig.url, {
            logIds: logId ? [logId] : [],
            groupIds: groupId ? [groupId] : [],
            authToken: dbConfig.token
          });
          
          if (remoteData && remoteData.patrols) {
            setSyncStatus('synced');
            setLastSyncTime(new Date(remoteData.lastUpdated).toLocaleTimeString());
            setPatrols(remoteData.patrols);
            setLogs(remoteData.logs || []);
          } else {
            setSyncStatus('error');
          }
        } catch (e: any) {
          setSyncStatus('error');
          if (e.message === 'AUTH_FAILED') {
            setIsSyncLocked(true);
            setErrorMessage("Token expirou ou é inválido.");
          } else {
            setAlertDialog({ isOpen: true, message: "Erro ao anular: " + e.message });
          }
        }
      }
    });
  };

  const calculatePatrolScore = (p: Patrol) => {
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
    return Math.floor((totalXP / 10) * balanceMultiplier);
  };

  const captureStatus = async () => {
    if (!statusRef.current) return;
    setIsCapturing(true);
    
    await new Promise(r => setTimeout(r, 200));
    
    try {
      if (document.fonts) {
        await document.fonts.ready;
      }

      const sections = statusRef.current.querySelectorAll('.troop-section');
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i] as HTMLElement;
        const troopName = section.getAttribute('data-troop-name');
        
        const canvas = await html2canvas(section, {
          backgroundColor: '#0d1b15',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
        });
        
        const image = canvas.toDataURL("image/jpeg", 0.9);
        const link = document.createElement('a');
        const dateStr = new Date().toISOString().split('T')[0];
        link.download = `Status-${troopName}-${dateStr}.jpg`;
        link.href = image;
        link.click();
        
        // Pequeno delay entre os downloads para o navegador não bloquear
        await new Promise(r => setTimeout(r, 500));
      }
    } catch (err) {
      console.error("Erro ao gerar imagem:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="min-h-screen bg-forest-dark flex flex-col">
      {/* Header com largura total e conteúdo centralizado */}
      <header className="w-full bg-forest-green border-b-2 border-gold/30 shadow-lg shrink-0 z-50">
        <div className="max-w-md mx-auto p-4 flex justify-between items-center">
          <div>
            <h1 className="rpg-font text-2xl text-gold flex items-center gap-2 leading-none">
              <Flag className="w-6 h-6" /> Bandeirola de Eficiência
            </h1>
            <div className="flex flex-col gap-0.5 mt-1">
               <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                 {isSyncLocked ? <Lock className="w-2 h-2 text-red-500" /> : <div className="w-2 h-2 bg-green-500 rounded-full" />}
                 {syncStatus === 'synced' ? `Sincronizado (${lastSyncTime})` : 
                  syncStatus === 'loading' ? 'Validando Token...' : 
                  syncStatus === 'error' ? 'Sincronia Pausada' : 'Offline'}
               </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={() => validateAndSync(dbConfig.url, dbConfig.token)} className={`p-2 rounded-full transition-all ${syncStatus === 'loading' ? 'bg-blue-500/20' : 'bg-black/20'} active:scale-90`}>
               {syncStatus === 'synced' && unsyncedCount === 0 && <CloudCheck className="w-5 h-5 text-green-500" />}
               {(syncStatus === 'pending' || (syncStatus === 'synced' && unsyncedCount > 0)) && <Cloud className="w-5 h-5 text-gold animate-bounce" />}
               {syncStatus === 'loading' && <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />}
               {syncStatus === 'error' && <CloudOff className="w-5 h-5 text-red-500" />}
               {syncStatus === 'none' && <Cloud className="w-5 h-5 text-slate-500" />}
             </button>
             <button onClick={() => { setConfigDraft(dbConfig); setShowConfigPanel(true); }} className="p-2 bg-black/20 rounded-full text-slate-400 hover:text-gold transition-colors">
                <Settings className="w-5 h-5" />
             </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal mobile-first centralizado */}
      <main className="max-w-md mx-auto w-full p-4 flex-1 pb-32">
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-[10px] text-red-200 flex flex-col gap-1 shadow-inner">
            <div className="flex items-center gap-2 font-black uppercase"><AlertTriangle className="w-4 h-4 text-red-500" /> Erro de Autenticação</div>
            <p className="opacity-90">{errorMessage}</p>
          </div>
        )}

        {unsyncedCount > 0 && !errorMessage && !isSyncLocked && (
          <div className="mb-4 p-2 bg-gold/10 border border-gold/30 rounded flex items-center justify-between">
             <div className="flex items-center gap-2 text-[10px] text-gold font-bold uppercase">
                <Clock className="w-4 h-4 animate-pulse" /> {unsyncedCount} pendente
             </div>
             <button onClick={() => validateAndSync(dbConfig.url, dbConfig.token)} className="text-[9px] bg-gold text-forest-dark px-2 py-1 rounded font-black uppercase">Subir</button>
          </div>
        )}

        {activeTab === 'status' && (
          <div className="space-y-4">
             <div className="flex justify-between items-center px-1 mb-2">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Painel de Poder</p>
                <button 
                  onClick={captureStatus}
                  disabled={isCapturing}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded bg-gold/10 border border-gold/40 text-gold text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 ${isCapturing ? 'opacity-50 grayscale' : 'hover:bg-gold/20'}`}
                >
                  {isCapturing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  {isCapturing ? 'Gerando...' : 'Gerar imagem'}
                </button>
             </div>

             <div ref={statusRef} className="space-y-6 p-2 bg-forest-dark">
               {Object.values(TroopName).map((troop, index) => {
                 const sortedByRank = [...patrols]
                   .filter(p => p.troop === troop)
                   .sort((a, b) => calculatePatrolScore(b) - calculatePatrolScore(a));

                 return (
                   <React.Fragment key={troop}>
                     <section className="troop-section p-2 bg-forest-dark" data-troop-name={troop.split(' ')[0]}>
                       <h2 className="rpg-font text-lg text-gold/80 mb-3 border-l-4 border-gold pl-2 uppercase tracking-widest">{troop}</h2>
                       <div className="flex flex-col gap-3">
                         {sortedByRank.map((p, idx) => (
                           <PatrolCard 
                             key={p.id} 
                             patrol={p} 
                             rank={idx + 1} 
                             score={calculatePatrolScore(p)} 
                           />
                         ))}
                       </div>
                       
                       {isCapturing && (
                         <div className="mt-6 p-3 border border-gold/20 rounded-lg bg-forest-green/30">
                           <h3 className="rpg-font text-gold text-[11px] mb-2 uppercase tracking-widest">Códice de Atributos</h3>
                           <div className="">
                             <div>
                               <span className="text-[#52b788] text-[9px] font-bold uppercase tracking-wider">Prontidão</span>
                               <span className="ml-2 text-[9px] text-slate-300">Alerta, pontualidade, inspeção e atenção aos comandos.</span>
                             </div>
                             <div>
                               <span className="text-[#60a5fa] text-[9px] font-bold uppercase tracking-wider">Proficiência</span>
                               <span className="ml-2 text-[9px] text-slate-300">Evolução técnica, aplicação de nós, pioneirias e especialidades.</span>
                             </div>
                             <div>
                               <span className="text-[#fbbf24] text-[9px] font-bold uppercase tracking-wider">Fraternidade</span>
                               <span className="ml-2 text-[9px] text-slate-300">Espírito de equipe, boa ação, cortesia e respeito.</span>
                             </div>
                           </div>
                         </div>
                       )}
                     </section>
                   </React.Fragment>
                 );
               })}
             </div>
          </div>
        )}

        {activeTab === 'logs' && <EventLog logs={logs} fullPage onDeleteLog={handleDeleteLog} />}
        {activeTab === 'panel' && <ChiefPanel patrols={patrols} onAddXP={addXP} />}
      </main>

      {/* Rodapé fixo largura total - Altura reduzida */}
      <nav className="fixed bottom-0 left-0 right-0 bg-forest-green border-t-2 border-gold/30 p-1 pb-4 z-50 shadow-2xl backdrop-blur-md bg-opacity-95">
        <div className="max-w-md mx-auto flex justify-around">
          <button onClick={() => setActiveTab('status')} className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${activeTab === 'status' ? 'text-gold' : 'text-slate-400'}`}>
            <Shield className="w-5 h-5" /><span className="text-[8px] uppercase font-black">Status</span>
          </button>
          <button onClick={() => setActiveTab('logs')} className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${activeTab === 'logs' ? 'text-gold' : 'text-slate-400'}`}>
            <div className="relative">
              <ScrollText className="w-5 h-5" />
              {unsyncedCount > 0 && <div className="absolute -top-1 -right-1 w-2 h-2 bg-gold rounded-full border border-forest-dark animate-pulse" />}
            </div>
            <span className="text-[8px] uppercase font-black">Diário</span>
          </button>
          <button onClick={() => setActiveTab('panel')} className={`flex flex-col items-center gap-0.5 p-1 transition-colors ${activeTab === 'panel' ? 'text-gold' : 'text-slate-400'}`}>
            <Swords className="w-5 h-5" /><span className="text-[8px] uppercase font-black">Chefia</span>
          </button>
        </div>
      </nav>

      {showConfigPanel && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
           <div className="rpg-panel w-full max-w-sm p-6 rounded-xl border-gold space-y-4">
             <div className="flex justify-between items-center mb-2">
                <h3 className="rpg-font text-gold text-lg flex items-center gap-2"><Database className="w-5 h-5"/> Painel Técnico</h3>
                <button onClick={() => setShowConfigPanel(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5"/></button>
             </div>
             <div className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">URL sync.php</label>
                  <input type="url" value={configDraft.url} onChange={e => setConfigDraft({...configDraft, url: e.target.value})} className="w-full bg-forest-dark border border-slate-700 p-3 rounded text-sm text-slate-100 outline-none focus:border-gold" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Key className="w-3 h-3" /> Token de Acesso</label>
                  <input type="text" value={configDraft.token} onChange={e => setConfigDraft({...configDraft, token: e.target.value})} className="w-full bg-forest-dark border border-slate-700 p-3 rounded text-sm text-gold font-mono outline-none focus:border-gold" />
                </div>
             </div>
             <button onClick={handleSaveConfig} className="w-full bg-gold text-forest-dark font-black py-4 rounded uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-transform">Salvar e Validar</button>
             <div className="text-center pt-2">
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{APP_VERSION}</span>
             </div>
           </div>
        </div>
      )}

      {/* Modal de Confirmação */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="rpg-panel w-full max-w-sm p-6 rounded-xl border-gold space-y-4 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <h3 className="rpg-font text-white text-xl">Atenção</h3>
            <p className="text-slate-300 text-sm">{confirmDialog.message}</p>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setConfirmDialog(null)} 
                className="flex-1 py-3 rounded bg-slate-800 text-slate-300 font-bold uppercase text-xs tracking-wider hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDialog.onConfirm} 
                className="flex-1 py-3 rounded bg-red-600 text-white font-bold uppercase text-xs tracking-wider hover:bg-red-500 transition-colors shadow-lg shadow-red-900/50"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alerta */}
      {alertDialog && alertDialog.isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="rpg-panel w-full max-w-sm p-6 rounded-xl border-gold space-y-4 text-center">
            <AlertTriangle className="w-12 h-12 text-gold mx-auto mb-2" />
            <h3 className="rpg-font text-white text-xl">Aviso</h3>
            <p className="text-slate-300 text-sm">{alertDialog.message}</p>
            <button 
              onClick={() => setAlertDialog(null)} 
              className="w-full mt-6 py-3 rounded bg-gold text-forest-dark font-black uppercase text-xs tracking-wider hover:bg-yellow-400 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;


export enum TroopName {
  TARSILLA = 'Tarsilla do Amaral',
  ZUMBI = 'Zumbi dos Palmares'
}

export type PatrolName = 
  | 'Leão' | 'Pantera' | 'Tigre' | 'Raposa' 
  | 'Morcego' | 'Falcão' | 'Pavão' | 'Águia';

export enum AttributeType {
  PRONTIDAO = 'Prontidão',
  PROFICIENCIA = 'Proficiência',
  FRATERNIDADE = 'Fraternidade'
}

export interface AttributeState {
  totalXP: number;
}

export interface Patrol {
  id: string;
  name: PatrolName;
  troop: TroopName;
  attributes: {
    [AttributeType.PRONTIDAO]: AttributeState;
    [AttributeType.PROFICIENCIA]: AttributeState;
    [AttributeType.FRATERNIDADE]: AttributeState;
  };
}

export interface LogEntry {
  id: string;
  timestamp: number;
  patrolName: string;
  xpValue: number;
  attribute: AttributeType;
  description: string;
  comment?: string;
  unsynced?: boolean;
  groupId?: string; // Novo campo para agrupar entradas (ex: resultados de um mesmo jogo)
}

export type GameType = 'Técnico' | 'Estratégia' | 'Recreativo';
export type Placement = 1 | 2 | 3;

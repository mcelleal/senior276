
import { TroopName, PatrolName, AttributeType, Patrol } from './types';

export const XP_PER_LEVEL = 1000;

export const INITIAL_PATROLS: Patrol[] = [
  // Tarsilla do Amaral
  { id: 't1', name: 'Leão', troop: TroopName.TARSILLA, attributes: createInitialAttributes() },
  { id: 't2', name: 'Pantera', troop: TroopName.TARSILLA, attributes: createInitialAttributes() },
  { id: 't3', name: 'Tigre', troop: TroopName.TARSILLA, attributes: createInitialAttributes() },
  { id: 't4', name: 'Raposa', troop: TroopName.TARSILLA, attributes: createInitialAttributes() },
  // Zumbi dos Palmares
  { id: 'z1', name: 'Morcego', troop: TroopName.ZUMBI, attributes: createInitialAttributes() },
  { id: 'z2', name: 'Falcão', troop: TroopName.ZUMBI, attributes: createInitialAttributes() },
  { id: 'z3', name: 'Pavão', troop: TroopName.ZUMBI, attributes: createInitialAttributes() },
  { id: 'z4', name: 'Águia', troop: TroopName.ZUMBI, attributes: createInitialAttributes() },
];

function createInitialAttributes() {
  return {
    [AttributeType.PRONTIDAO]: { totalXP: 0 },
    [AttributeType.PROFICIENCIA]: { totalXP: 0 },
    [AttributeType.FRATERNIDADE]: { totalXP: 0 },
  };
}

export const GAME_XP_REWARDS: Record<string, [number, number, number]> = {
  'Técnico': [150, 80, 40],
  'Estratégia': [100, 50, 25],
  'Recreativo': [60, 30, 15],
};

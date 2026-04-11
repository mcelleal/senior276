
import { TroopName, PatrolName, AttributeType, Patrol } from './types';

export const XP_PER_LEVEL = 1000;

export const INITIAL_PATROLS: Patrol[] = [
  // Cataratas do Iguaçu
  { id: 's1', name: "Ka'aete", troop: TroopName.CATARATAS, attributes: createInitialAttributes() },
  { id: 's2', name: 'Katukina', troop: TroopName.CATARATAS, attributes: createInitialAttributes() },
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

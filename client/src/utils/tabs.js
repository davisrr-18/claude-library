import { PIECE_TYPES } from './content.js';

/**
 * Entradas de card ({ cardObj: { pieces } }) → tipos de peça presentes, com quantos arquivos (peças) há de cada
 * um em todos os cards. Só tipos com pelo menos uma peça, na ordem canônica de PIECE_TYPES.
 */
export function typeCounts(entries) {
  const counts = new Map();
  for (const e of entries) {
    for (const { type } of e.cardObj.pieces) counts.set(type, (counts.get(type) || 0) + 1);
  }
  return PIECE_TYPES.filter((t) => counts.has(t)).map((type) => ({ type, count: counts.get(type) }));
}

/** Teclado das abas: índice da próxima aba para a tecla, ou null se a tecla não for de navegação. */
export function nextTabIndex(key, current, length) {
  if (!(length > 0) || !Number.isInteger(current)) return null;
  switch (key) {
    case 'ArrowRight':
      return (current + 1) % length;
    case 'ArrowLeft':
      return (current - 1 + length) % length;
    case 'Home':
      return 0;
    case 'End':
      return length - 1;
    default:
      return null;
  }
}

/** Rótulo de cada aba de tipo (plural). Um teste garante que todo tipo de PIECE_TYPES tem rótulo. */
export const TYPE_TAB_LABELS = {
  skill: 'Skills',
  'claude-md': 'CLAUDE.md',
  arquitetura: 'Arquiteturas',
  agente: 'Agentes',
  workflow: 'Workflows',
  prompt: 'Prompts',
};

/**
 * Aba efetiva: a guardada, se ainda existir entre as disponíveis ({ type, count }[]); senão '' (Todos).
 * Quem chama mantém a escolha guardada, para que ela volte quando os filtros forem limpos.
 */
export function resolveTypeTab(stored, available) {
  return stored && available.some((a) => a.type === stored) ? stored : '';
}

/**
 * Peças de um card agrupadas por tipo, na ordem canônica de PIECE_TYPES (a mesma das abas da faixa);
 * dentro de cada tipo mantém a ordem do manifest. Um card pode ter várias peças do mesmo tipo.
 */
export function groupPiecesByType(pieces) {
  return PIECE_TYPES.map((type) => ({ type, pieces: (pieces || []).filter((p) => p.type === type) })).filter(
    (g) => g.pieces.length > 0,
  );
}

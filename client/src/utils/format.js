import { TIER_IDS } from './content.js';

export const TYPE_LABELS = {
  skill: 'Skill',
  'claude-md': 'CLAUDE.md',
  arquitetura: 'Arquitetura',
  agente: 'Agente',
  workflow: 'Workflow',
  prompt: 'Prompt',
};

export const TYPE_PLURAL = {
  skill: ['skill', 'skills'],
  'claude-md': ['CLAUDE.md', 'CLAUDE.md'],
  arquitetura: ['arquitetura', 'arquiteturas'],
  agente: ['agente', 'agentes'],
  workflow: ['workflow', 'workflows'],
  prompt: ['prompt', 'prompts'],
};

const enc = encodeURIComponent;
export const tierHref = (t) => `#/${enc(t)}`;
export const cardHref = (t, c) => `#/${enc(t)}/${enc(c)}`;
export const pieceHref = (t, c, p) => `#/${enc(t)}/${enc(c)}/${enc(p)}`;
export const tierLevel = (id) => TIER_IDS.indexOf(id) + 1;
export const plural = (n, [one, many]) => `${n} ${n === 1 ? one : many}`;

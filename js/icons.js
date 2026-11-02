const NS = 'http://www.w3.org/2000/svg';

/** Ícones de traço (24x24). Cada valor é o atributo `d` de um único <path>. */
const PATHS = {
  folder: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  code: 'M16 18l6-6-6-6M8 6l-6 6 6 6',
  zap: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z',
  layers: 'M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  'git-branch': 'M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9',
  bot: 'M12 8V4H8M4 8h16v12H4zM2 14h2M20 14h2M9 13v2M15 13v2',
  'file-text': 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  'message-square': 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  bug: 'M8 2l1.88 1.88M14.12 3.88 16 2M9 7.13v-1a3 3 0 1 1 6 0v1M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6zM12 20v-9',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  copy: 'M9 9h11v11H9zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1',
  check: 'M20 6 9 17l-5-5',
  'arrow-left': 'M19 12H5M12 19l-7-7 7-7',
  'arrow-right': 'M5 12h14M12 5l7 7-7 7',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
  moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  x: 'M18 6 6 18M6 6l12 12',
};

/** Ícone de cada tipo de peça. */
export const TYPE_ICON = {
  skill: 'zap',
  'claude-md': 'file-text',
  arquitetura: 'layers',
  agente: 'bot',
  workflow: 'git-branch',
  prompt: 'message-square',
};

/** Cria um <svg> decorativo (aria-hidden) sem usar innerHTML. */
export function icon(name, size = 18) {
  const svg = document.createElementNS(NS, 'svg');
  const attrs = {
    viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor',
    'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false',
  };
  for (const [k, v] of Object.entries(attrs)) svg.setAttribute(k, v);
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', PATHS[name] ?? PATHS.folder);
  svg.append(path);
  return svg;
}

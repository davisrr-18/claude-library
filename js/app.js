import { parseFrontMatter, validateManifest, pieceDescription, TIER_IDS } from './content.js';
import { parseRoute, isAppHash, resolveView } from './router.js';
import { renderMarkdown } from './markdown.js';
import { buildIndex, search, collectTags, dedupeTags, sameTitle } from './search.js';
import { typeCounts, nextTabIndex, resolveTypeTab, TYPE_TAB_LABELS, groupPiecesByType } from './tabs.js';
import { h, safeFragment, copyButton, addCopyButtons, wrapTables, initTheme } from './dom.js';
import { icon, TYPE_ICON } from './icons.js';
import { installFile, buildInstall, detectOs, OS_LIST } from './install.js';
import { highlightCodeBlocks } from './code-highlight.js';

const TYPE_LABELS = {
  skill: 'Skill',
  'claude-md': 'CLAUDE.md',
  arquitetura: 'Arquitetura',
  agente: 'Agente',
  workflow: 'Workflow',
  prompt: 'Prompt',
};
const TYPE_PLURAL = {
  skill: ['skill', 'skills'], 'claude-md': ['CLAUDE.md', 'CLAUDE.md'], arquitetura: ['arquitetura', 'arquiteturas'],
  agente: ['agente', 'agentes'], workflow: ['workflow', 'workflows'], prompt: ['prompt', 'prompts'],
};
const APP_TITLE = 'Claude Library';

const main = document.getElementById('main');
const tierNav = document.getElementById('tier-nav');

const state = {
  manifest: null,
  entries: [], // um por card: { tier, card, title, summary, tags, text, tierObj, cardObj }
  index: [],
  bodiesPromise: null,
  filters: { q: '', tier: '', tags: new Set() },
  bodiesRetryAt: 0, // após falha de rede na busca, só tenta de novo depois desse instante
  tierTabs: {}, // aba (tipo de peça) escolhida em cada faixa de nível; '' = todas
  focusSearch: false,
};
const pieceCache = new Map();

const enc = encodeURIComponent;
const tierHref = (t) => `#/${enc(t)}`;
const cardHref = (t, c) => `#/${enc(t)}/${enc(c)}`;
const pieceHref = (t, c, p) => `#/${enc(t)}/${enc(c)}/${enc(p)}`;
const tierLevel = (id) => TIER_IDS.indexOf(id) + 1;
const plural = (n, [one, many]) => `${n} ${n === 1 ? one : many}`;

function setView(...nodes) {
  main.replaceChildren(...nodes);
}

function setTitle(part) {
  document.title = part ? `${part} · ${APP_TITLE}` : APP_TITLE;
}

function message(text, kind = 'notice') {
  return h('div', { class: `callout ${kind === 'error' ? 'is-error' : ''}`.trim(), role: kind === 'error' ? 'alert' : null }, text);
}

function levelDots(level, label) {
  const a11y = label === ''
    ? { 'aria-hidden': 'true' } // o texto ao lado já diz o nível
    : { role: 'img', 'aria-label': label ?? `Nível ${level} de 3` };
  return h('span', { class: 'level', ...a11y }, [1, 2, 3].map((i) => h('i', { class: i <= level ? 'on' : '' })));
}

/* ---------- dados ---------- */

function buildEntries() {
  state.entries = state.manifest.tiers.flatMap((tierObj) =>
    tierObj.cards.map((cardObj) => ({
      tier: tierObj.id,
      card: cardObj.id,
      title: cardObj.title,
      summary: cardObj.summary || '',
      tags: cardObj.tags || [],
      text: '',
      tierObj,
      cardObj,
    })));
  state.index = buildIndex(state.entries);
}

function fetchText(file) {
  if (pieceCache.has(file)) return pieceCache.get(file);
  const promise = fetch(`content/${file.split('/').map(enc).join('/')}`).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  });
  pieceCache.set(file, promise);
  promise.catch(() => pieceCache.delete(file));
  return promise;
}

/** Carrega o corpo de todas as peças uma vez, para a busca no texto. Se alguma falhar, a próxima busca tenta de novo. */
function ensureBodies() {
  if (!state.bodiesPromise && Date.now() < state.bodiesRetryAt) return Promise.resolve();
  state.bodiesPromise ??= (async () => {
    let incomplete = false;
    await Promise.all(state.entries.map(async (entry) => {
      const parts = await Promise.all(entry.cardObj.pieces.map((p) =>
        fetchText(p.file).then((t) => parseFrontMatter(t).body).catch(() => { incomplete = true; return ''; })));
      entry.text = parts.join('\n');
    }));
    state.index = buildIndex(state.entries);
    if (incomplete) { // não guarda o resultado parcial; nova tentativa só após 5 s
      state.bodiesPromise = null;
      state.bodiesRetryAt = Date.now() + 5000;
    }
  })();
  return state.bodiesPromise;
}

/* ---------- navegação ---------- */

function renderNav(activeTier) {
  tierNav.replaceChildren(
    ...state.manifest.tiers.map((t) =>
      h('a', { href: tierHref(t.id), 'aria-current': t.id === activeTier ? 'page' : null },
        levelDots(tierLevel(t.id), ''), h('span', {}, t.title))));
}

/* ---------- cards e níveis ---------- */

/** Card da vitrine: link para a página do card. */
function cardTile(entry, i = 0, headingTag = 'h3') {
  const { cardObj: card, tierObj: tier } = entry;
  const titleId = `card-${tier.id}-${card.id}`;
  const tags = dedupeTags(card.tags);
  return h('a', { class: 'card', href: cardHref(tier.id, card.id), style: `--i:${Math.min(i, 8)}`, 'aria-labelledby': titleId },
    h('span', { class: 'card-icon' }, icon(card.icon || 'folder', 22)),
    h(headingTag, { id: titleId }, card.title),
    h('p', { class: 'card-summary' }, card.summary || ''),
    h('ul', { class: 'chips', 'aria-label': 'Peças incluídas' },
      groupPiecesByType(card.pieces).map((g) => h('li', { class: 'chip' },
        icon(TYPE_ICON[g.type], 13), TYPE_LABELS[g.type], g.pieces.length > 1 ? ` ×${g.pieces.length}` : ''))),
    tags.length
      ? h('ul', { class: 'tags', 'aria-label': 'Tags' }, tags.map((t) => h('li', { class: 'tag' }, `#${t}`)))
      : null,
    h('span', { class: 'card-go', 'aria-hidden': 'true' }, icon('arrow-right', 16)));
}

/**
 * Faixa de um nível: cabeçalho e, ao lado/abaixo, abas por tipo de peça. "Todos" mostra os cards do nível;
 * uma aba de tipo (Skills, CLAUDE.md…) mostra direto os arquivos desse tipo de todos os cards do nível.
 * A aba escolhida fica em state.tierTabs.
 */
function tierSection(tier, entries, { heading = 'h2', cardHeading = 'h3', link = true } = {}) {
  const title = link ? h('a', { href: tierHref(tier.id) }, tier.title) : tier.title;
  const head = h('header', { class: 'tier-head' },
    levelDots(tierLevel(tier.id)),
    h('div', {},
      h(heading, { id: `tier-${tier.id}` }, title),
      tier.description ? h('p', {}, tier.description) : null),
    h('span', { class: 'count' }, plural(entries.length, ['card', 'cards'])));

  const body = h('div', { class: 'tier-body' });
  if (!entries.length) {
    body.append(message('Nenhum card neste nível ainda.'));
    return h('section', { class: 'tier', 'aria-labelledby': `tier-${tier.id}` }, head, body);
  }

  const available = typeCounts(entries);
  const defs = [
    { type: '', label: 'Todos', count: entries.length, iconName: 'folder' },
    ...available.map(({ type, count }) => ({ type, label: TYPE_TAB_LABELS[type], count, iconName: TYPE_ICON[type] })),
  ];
  const tabId = (type) => `tab-${tier.id}-${type || 'todos'}`;
  const panel = h('div', { class: 'tier-panel', id: `panel-${tier.id}`, role: 'tabpanel' });
  const tabs = defs.map((d) => h('button', {
    type: 'button', role: 'tab', class: 'type-tab', id: tabId(d.type), 'aria-controls': panel.id,
    onclick: () => select(d.type),
  }, icon(d.iconName, 16), h('span', {}, d.label), h('span', { class: 'type-count' }, d.count, h('span', { class: 'sr-only' }, d.type ? (d.count === 1 ? ' arquivo' : ' arquivos') : (d.count === 1 ? ' card' : ' cards')))));
  const bar = h('div', { class: 'type-tabs', role: 'tablist', 'aria-label': `Tipo de peça em ${tier.title}` }, tabs);

  // Se o tipo escolhido não existe nos cards filtrados, mostra todos (sem esquecer a escolha).
  const current = () => resolveTypeTab(state.tierTabs[tier.id], available);

  let paintToken = 0;
  function paint(swap) {
    const cur = current();
    tabs.forEach((btn, i) => {
      const on = defs[i].type === cur;
      btn.setAttribute('aria-selected', String(on));
      btn.setAttribute('tabindex', on ? '0' : '-1');
    });
    panel.setAttribute('aria-labelledby', tabId(cur));
    const mine = ++paintToken;
    if (!cur) {
      panel.replaceChildren(h('div', { class: `grid${swap ? ' swap' : ''}` },
        entries.map((e, i) => cardTile(e, i, cardHeading))));
      return;
    }
    panel.replaceChildren(skeleton());
    loadTierPieces(entries, cur, cardHeading).then(async ({ nodes, articles }) => {
      if (mine !== paintToken || !panel.isConnected) return; // trocou de aba (ou de página) durante o carregamento
      panel.replaceChildren(...nodes);
      await Promise.all(articles.map((a) => highlightCodeBlocks(a)));
    });
  }
  function select(type) {
    endEntrance();
    state.tierTabs[tier.id] = type;
    paint(true);
  }

  bar.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return; // não rouba Alt+← (voltar), Ctrl+setas etc.
    const from = tabs.indexOf(e.target.closest?.('[role="tab"]'));
    const to = from < 0 ? null : nextTabIndex(e.key, from, tabs.length);
    if (to === null) return;
    e.preventDefault();
    tabs[to].focus();
    select(defs[to].type);
  });

  paint(false);
  body.append(bar, panel);
  return h('section', { class: 'tier', 'aria-labelledby': `tier-${tier.id}` }, head, body);
}

/* ---------- home ---------- */

function heroStats() {
  const counts = {};
  for (const t of state.manifest.tiers) {
    for (const c of t.cards) for (const p of c.pieces) counts[p.type] = (counts[p.type] || 0) + 1;
  }
  const pills = [[state.entries.length, ['card', 'cards']]];
  for (const type of Object.keys(TYPE_PLURAL)) if (counts[type]) pills.push([counts[type], TYPE_PLURAL[type]]);
  return h('ul', { class: 'stats', 'aria-label': 'Resumo do conteúdo' },
    pills.map(([n, words]) => h('li', {}, h('strong', { 'data-n': String(n) }, n), ` ${n === 1 ? words[0] : words[1]}`)));
}

function renderHome() {
  renderNav(null);
  setTitle('');
  const f = state.filters;

  const input = h('input', {
    id: 'q', type: 'search', class: 'searchbox-input', placeholder: 'Buscar skills, workflows, agentes…',
    autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Buscar skills, workflows, agentes', 'aria-controls': 'results',
  });
  input.value = f.q;

  const status = h('p', { class: 'status', 'aria-live': 'polite' });
  const results = h('div', { id: 'results' });
  const tierBar = h('div', { class: 'seg', role: 'group', 'aria-label': 'Filtrar por nível' });
  const tagBar = h('div', { class: 'tagbar', role: 'group', 'aria-label': 'Filtrar por tag' });
  const clearBtn = h('button', { type: 'button', class: 'btn btn-ghost btn-sm', hidden: true }, icon('x', 14), 'Limpar filtros');

  const active = () => Boolean(f.q.trim() || f.tier || f.tags.size);

  const tierButtons = [{ id: '', title: 'Todos' }, ...state.manifest.tiers].map((t) =>
    h('button', {
      type: 'button', class: 'seg-btn', 'aria-pressed': 'false',
      onclick: () => { f.tier = t.id; paintFilters(); paintResults(); },
    }, t.title));
  const tagButtons = collectTags(state.entries).map(({ tag, count }) =>
    h('button', {
      type: 'button', class: 'tag-btn', 'aria-pressed': 'false', 'data-tag': tag,
      'aria-label': `#${tag}, ${plural(count, ['card', 'cards'])}`,
      onclick: () => { f.tags.has(tag) ? f.tags.delete(tag) : f.tags.add(tag); paintFilters(); paintResults(); },
    }, `#${tag}`, h('span', {}, count)));
  tierBar.replaceChildren(...tierButtons);
  tagBar.replaceChildren(...tagButtons);

  /** Só atualiza o estado dos botões existentes; recriá-los faria o foco do teclado voltar ao topo. */
  function paintFilters() {
    const ids = ['', ...state.manifest.tiers.map((t) => t.id)];
    tierButtons.forEach((btn, i) => btn.setAttribute('aria-pressed', String(f.tier === ids[i])));
    tagButtons.forEach((btn) => btn.setAttribute('aria-pressed', String(f.tags.has(btn.dataset.tag))));
    clearBtn.hidden = !active();
  }

  function paintResults() {
    endEntrance(); // elementos recriados por busca/filtro não podem repetir a animação de entrada
    const focusedTabId = results.contains(document.activeElement) && document.activeElement.getAttribute('role') === 'tab' ? document.activeElement.id : '';
    const found = search(state.index, f.q, { tier: f.tier || undefined, tags: [...f.tags] });
    const byTier = new Map(state.manifest.tiers.map((t) => [t.id, []]));
    for (const e of found) byTier.get(e.tier).push(e);
    // Só nível escolhido (sem texto nem tags): mostra a faixa mesmo vazia, com o aviso do nível.
    const narrowed = Boolean(f.q.trim() || f.tags.size);
    const sections = state.manifest.tiers
      .filter((t) => (!f.tier || f.tier === t.id) && (!narrowed || byTier.get(t.id).length))
      .map((t) => tierSection(t, byTier.get(t.id)));
    if (narrowed && !found.length) {
      results.replaceChildren(h('div', { class: 'empty' },
        icon('search', 28),
        h('h2', {}, 'Nada encontrado'),
        h('p', {}, 'Tente outras palavras ou remova algum filtro.'),
        h('button', { type: 'button', class: 'btn', onclick: clearAll }, 'Limpar filtros')));
    } else {
      results.replaceChildren(...sections);
    }
    status.textContent = active() ? `${plural(found.length, ['card encontrado', 'cards encontrados'])}.` : '';
    clearBtn.hidden = !active();
    // A faixa foi recriada (ex.: corpos das peças terminaram de carregar): devolve o foco à mesma aba.
    if (focusedTabId) (document.getElementById(focusedTabId) ?? input).focus({ preventScroll: true });
  }

  function clearAll() {
    f.q = ''; f.tier = ''; f.tags.clear(); input.value = '';
    paintFilters(); paintResults();
    input.focus();
  }
  clearBtn.addEventListener('click', clearAll);

  let typingTimer;
  // Com muitos cards, espera uma pausa na digitação em vez de reconstruir a lista a cada tecla
  // (inclusive quando os corpos das peças terminam de carregar).
  const schedulePaint = () => {
    clearTimeout(typingTimer);
    if (state.entries.length > 60) typingTimer = setTimeout(() => { if (input.isConnected) paintResults(); }, 90);
    else paintResults();
  };
  input.addEventListener('input', () => {
    f.q = input.value;
    ensureBodies().then(() => { if (input.isConnected) schedulePaint(); });
    schedulePaint();
  });
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') clearAll(); });

  paintFilters();
  paintResults();
  if (f.q) ensureBodies().then(() => { if (input.isConnected) paintResults(); });

  setView(
    h('section', { class: 'hero' },
      h('p', { class: 'eyebrow' }, 'Biblioteca pessoal'),
      h('h1', {}, 'Seu Claude Code, ', h('span', { class: 'accent' }, 'organizado')),
      h('p', { class: 'lead' }, 'Skills, workflows, agentes e prompts, agrupados pela complexidade da tarefa. Abra, copie e cole.'),
      h('label', { class: 'searchbox', for: 'q' }, icon('search', 20), input, h('kbd', { 'aria-hidden': 'true' }, '/')),
      heroStats()),
    h('div', { class: 'filters' },
      h('div', { class: 'filters-row' }, tierBar, clearBtn),
      tagBar),
    status,
    results);

  trackFiltersHeight(document.querySelector('.filters'));
  countUp(main);
  if (state.focusSearch) { state.focusSearch = false; input.focus(); }
}

/* ---------- nível ---------- */

function renderTier(tier) {
  renderNav(tier.id);
  setTitle(tier.title);
  const entries = state.entries.filter((e) => e.tier === tier.id);
  setView(
    h('nav', { class: 'crumbs', 'aria-label': 'Você está em' }, h('a', { href: '#/' }, 'Início'), h('span', {}, tier.title)),
    tierSection(tier, entries, { heading: 'h1', cardHeading: 'h2', link: false }));
}

/* ---------- card ---------- */

function skeleton() {
  return h('div', { class: 'skeleton', role: 'status', 'aria-busy': 'true', 'aria-label': 'Carregando' },
    h('i', { style: 'width:40%' }), h('i', {}), h('i', {}), h('i', { style: 'width:70%' }));
}

/* ---------- instalar pelo terminal ---------- */

let preferredOs = null;

function currentOs() {
  if (preferredOs) return preferredOs;
  let saved = null;
  try { saved = localStorage.getItem('os'); } catch { /* sem persistência */ }
  if (OS_LIST.some((o) => o.id === saved)) return (preferredOs = saved);
  return (preferredOs = detectOs(navigator.userAgentData?.platform || navigator.platform || navigator.userAgent));
}

function rememberOs(id) {
  preferredOs = id;
  try { localStorage.setItem('os', id); } catch { /* sem persistência */ }
}

/**
 * Bloco recolhível "Instalar no terminal": abas Linux / macOS / Windows com os comandos que criam os
 * arquivos em `files` ([{ path, content }]) no lugar certo. Os comandos só são montados quando abre.
 */
function installPanel(summary, files) {
  const body = h('div', { class: 'install-body' });
  const details = h('details', { class: 'install' }, h('summary', {}, icon('terminal', 16), h('span', {}, summary)), body);
  let built = false;
  details.addEventListener('toggle', () => {
    if (!details.open || built) return;
    built = true;
    const code = h('code', {}, '');
    const pre = h('pre', { tabindex: '0', role: 'region', 'aria-label': 'Comandos de instalação' }, code);
    const show = (osId) => { code.textContent = buildInstall(osId, files); };
    const tabs = OS_LIST.map((os) => h('button', {
      type: 'button', role: 'tab', class: 'os-tab', onclick: () => select(os.id),
    }, os.label));
    const select = (osId) => {
      rememberOs(osId);
      tabs.forEach((btn, i) => {
        const on = OS_LIST[i].id === osId;
        btn.setAttribute('aria-selected', String(on));
        btn.setAttribute('tabindex', on ? '0' : '-1');
      });
      show(osId);
    };
    const bar = h('div', { class: 'os-tabs', role: 'tablist', 'aria-label': 'Sistema operacional' }, tabs);
    bar.addEventListener('keydown', (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const from = tabs.indexOf(e.target.closest?.('[role="tab"]'));
      const to = from < 0 ? null : nextTabIndex(e.key, from, tabs.length);
      if (to === null) return;
      e.preventDefault();
      tabs[to].focus();
      select(OS_LIST[to].id);
    });
    select(currentOs());
    body.append(
      h('p', { class: 'install-hint' }, 'Abra o terminal na pasta onde quer instalar (ex.: a sua pasta de estudos), cole e execute. No Windows, use o PowerShell.'),
      bar,
      h('div', { class: 'code-wrap' }, copyButton('Copiar', () => code.textContent, 'code-copy', 'Copiar comandos de instalação'), pre));
  });
  return details;
}

/** Todos os arquivos instaláveis do card, na ordem do manifest. Peças que falham ao carregar são ignoradas. */
async function collectInstallFiles(card) {
  const files = await Promise.all(card.pieces.map((p) =>
    fetchText(p.file).then((raw) => { const { meta, body } = parseFrontMatter(raw); return installFile(p, meta, body); }).catch(() => null)));
  return files.filter(Boolean);
}

/** Monta uma peça (cabeçalho + texto). Falha de uma peça vira aviso nela, sem derrubar as outras. */
async function buildPiece(piece, index, headingTag = 'h2') {
  const headId = `piece-${index}-title`;
  try {
    const raw = await fetchText(piece.file);
    const { meta, body } = parseFrontMatter(raw);
    const article = h('article', { class: 'md' }, safeFragment(renderMarkdown(body)));
    // O título da peça já está no cabeçalho: remove o primeiro título do corpo se for o mesmo.
    const first = article.firstElementChild;
    if (first && /^H[1-6]$/.test(first.tagName) && (sameTitle(first.textContent, piece.title) || sameTitle(first.textContent, meta.name))) first.remove();
    addCopyButtons(article);
    wrapTables(article);
    const description = pieceDescription(meta);
    const node = h('section', { class: 'piece', 'aria-labelledby': headId },
      h('div', { class: 'piece-head' },
        h('div', {},
          h(headingTag, { id: headId }, piece.title),
          meta.name && meta.name !== piece.title ? h('code', { class: 'piece-name' }, meta.name) : null,
          description ? h('p', {}, description) : null),
        copyButton('Copiar peça', () => raw, '', `Copiar peça: ${piece.title}`)),
      article);
    const toInstall = installFile(piece, meta, body);
    if (toInstall) node.querySelector('.piece-head').after(installPanel(`Salvar "${toInstall.path}" pelo terminal`, [toInstall]));
    return { node, article };
  } catch (err) {
    return { node: h('section', { class: 'piece' }, message(`Não foi possível carregar "${piece.file}": ${err.message}`, 'error')), article: null };
  }
}

/** Carrega todas as peças do tipo escolhido, em paralelo, e as exibe na ordem do manifest. */
async function loadPieces(panel, pieces) {
  panel.replaceChildren(skeleton());
  const built = await Promise.all(pieces.map((p, i) => buildPiece(p, i)));
  panel.replaceChildren(...built.map((b) => b.node));
  for (const { article } of built) {
    if (!article) continue;
    [...article.children].forEach((el, i) => el.style.setProperty('--i', String(i)));
    revealOnScroll(article.children);
  }
  await Promise.all(built.filter((b) => b.article).map((b) => highlightCodeBlocks(b.article)));
}

let pieceSeq = 0;

/**
 * Arquivos de um tipo (ex.: todos os CLAUDE.md) de todos os cards de uma faixa, já montados e agrupados por card.
 * O título do card tem o nível `cardHeading` e o da peça o nível seguinte.
 */
async function loadTierPieces(entries, type, cardHeading) {
  const pieceHeading = `h${Number(cardHeading.slice(1)) + 1}`;
  const groups = entries
    .map((e) => ({ entry: e, pieces: e.cardObj.pieces.filter((p) => p.type === type) }))
    .filter((g) => g.pieces.length);
  const built = await Promise.all(groups.map(async ({ entry, pieces }) => ({
    entry, items: await Promise.all(pieces.map((p) => buildPiece(p, pieceSeq++, pieceHeading))),
  })));
  const nodes = built.map(({ entry, items }) => h('div', { class: 'piece-group' },
    h(cardHeading, { class: 'piece-origin' },
      h('a', { href: cardHref(entry.tierObj.id, entry.cardObj.id) }, icon(entry.cardObj.icon || 'folder', 16), h('span', {}, entry.cardObj.title))),
    ...items.map((b) => b.node)));
  return { nodes, articles: built.flatMap(({ items }) => items.map((b) => b.article).filter(Boolean)) };
}

function renderCard(tier, card, activeType) {
  renderNav(tier.id);
  setTitle(card.title);
  const pieces = card.pieces;
  const groups = groupPiecesByType(pieces);
  const current = groups.find((g) => g.type === activeType) || groups[0];
  const panel = h('div', { class: 'panel', id: 'piece-panel' });
  const installSlot = h('div', { class: 'install-slot' });

  const siblings = tier.cards;
  const at = siblings.findIndex((c) => c.id === card.id);
  const prev = siblings[at - 1];
  const next = siblings[at + 1];

  const aside = siblings.length > 1
    ? h('aside', { class: 'card-aside', 'aria-label': `Cards em ${tier.title}` },
        h('h2', {}, tier.title),
        h('ul', {}, siblings.map((c, i) => h('li', { style: `--i:${i}` },
          h('a', { href: cardHref(tier.id, c.id), 'aria-current': c.id === card.id ? 'page' : null },
            icon(c.icon || 'folder', 16), h('span', {}, c.title))))))
    : null;

  setView(
    h('nav', { class: 'crumbs', 'aria-label': 'Você está em' },
      h('a', { href: '#/' }, 'Início'), h('a', { href: tierHref(tier.id) }, tier.title), h('span', {}, card.title)),
    h('header', { class: 'card-hero' },
      h('span', { class: 'card-icon is-lg' }, icon(card.icon || 'folder', 30)),
      h('div', {},
        h('div', { class: 'card-meta' }, levelDots(tierLevel(tier.id)), h('span', {}, tier.title)),
        h('h1', {}, card.title),
        card.summary ? h('p', { class: 'lead' }, card.summary) : null,
        dedupeTags(card.tags).length
          ? h('ul', { class: 'tags' }, dedupeTags(card.tags).map((t) => h('li', { class: 'tag' }, `#${t}`)))
          : null)),
    h('div', { class: `card-layout${aside ? ' has-aside' : ''}` },
      h('div', { class: 'card-main' },
        installSlot,
        groups.length
          ? h('nav', { class: 'tabs', 'aria-label': 'Peças do card' },
              groups.map((g) => h('a', {
                href: pieceHref(tier.id, card.id, g.type),
                'aria-current': g === current ? 'page' : null,
              }, icon(TYPE_ICON[g.type], 16), TYPE_LABELS[g.type],
              g.pieces.length > 1 ? h('span', { class: 'type-count' }, g.pieces.length, h('span', { class: 'sr-only' }, ' peças')) : null)))
          : null,
        pieces.length ? panel : message('Este card ainda não tem peças.'),
        prev || next
          ? h('nav', { class: 'pager', 'aria-label': 'Outros cards deste nível' },
              prev ? h('a', { class: 'pager-link', href: cardHref(tier.id, prev.id) },
                icon('arrow-left', 16), h('span', {}, h('small', {}, 'Anterior'), prev.title)) : h('span', {}),
              next ? h('a', { class: 'pager-link is-next', href: cardHref(tier.id, next.id) },
                h('span', {}, h('small', {}, 'Próximo'), next.title), icon('arrow-right', 16)) : null)
          : null),
      aside));

  if (current) loadPieces(panel, current.pieces);
  // Pacote com 2 ou mais arquivos instaláveis: um bloco que instala todos de uma vez.
  collectInstallFiles(card).then((files) => {
    if (files.length >= 2 && installSlot.isConnected) {
      installSlot.replaceChildren(installPanel(`Instalar o pacote inteiro pelo terminal (${files.length} arquivos)`, files));
    }
  });
}

function renderNotFound() {
  renderNav(null);
  setTitle('Página não encontrada');
  setView(h('div', { class: 'empty' },
    icon('search', 28),
    h('h1', {}, 'Página não encontrada'),
    h('p', {}, 'O endereço não existe ou o card foi movido.'),
    h('a', { class: 'btn', href: '#/' }, 'Voltar ao início')));
}

/* ---------- rotas e inicialização ---------- */

let enterTimer;
let revealObserver;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Esconde o que está abaixo da dobra e revela (com transição) quando entra na tela. */
function revealOnScroll(candidates) {
  if (!('IntersectionObserver' in window) || reducedMotion()) return;
  const fold = window.innerHeight; // só o que está totalmente abaixo da tela espera a rolagem
  const targets = [...candidates].filter((el) => el.getBoundingClientRect().top > fold);
  if (!targets.length) return;
  revealObserver ??= new IntersectionObserver((items) => {
    for (const it of items) {
      if (!it.isIntersecting) continue;
      const el = it.target;
      revealObserver.unobserve(el);
      el.classList.add('in');
      setTimeout(() => { // volta ao estilo normal (hover etc.) sem reanimar a entrada
        el.classList.remove('reveal', 'in');
        el.classList.add('revealed');
      }, 1000);
    }
  }, { rootMargin: '0px', threshold: 0.01 });
  for (const el of targets) { el.classList.add('reveal'); revealObserver.observe(el); }
}

/** Encerra a fase de entrada: nada criado depois disso roda as animações de entrada. */
function endEntrance() {
  clearTimeout(enterTimer);
  main.classList.remove('is-entering');
}

/** Anima a entrada da página (CSS `.is-entering`) e prepara a revelação ao rolar. */
function playEntrance() {
  main.classList.add('is-entering');
  clearTimeout(enterTimer);
  enterTimer = setTimeout(() => main.classList.remove('is-entering'), 1800);
  revealObserver?.disconnect();
  revealObserver = null;
  revealOnScroll(main.querySelectorAll('.tier-head, .type-tabs, .grid > .card, .tier-body > .callout, .pager, .card-aside'));
}

/** Números das estatísticas contam de 0 até o valor. */
function countUp(root) {
  const raf = window.requestAnimationFrame?.bind(window);
  if (!raf || reducedMotion()) return;
  for (const el of root.querySelectorAll('[data-n]')) {
    const target = Number(el.dataset.n);
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, Math.max(0, now - start) / 800);
      el.textContent = String(Math.round(target * (1 - (1 - t) ** 3)));
      if (t < 1 && el.isConnected) raf(step);
    };
    el.textContent = '0';
    raf(step);
  }
}

let updateScrollFx = () => {};

/** Sombra no topo ao rolar e barra de progresso de leitura. */
function initScrollFx() {
  const topbar = document.querySelector('.topbar');
  const bar = document.querySelector('.progress');
  if (!topbar || !bar) return;
  const raf = window.requestAnimationFrame?.bind(window) ?? ((fn) => fn());
  let pending = false;
  updateScrollFx = () => {
    pending = false;
    const y = window.scrollY || 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    topbar.classList.toggle('is-scrolled', y > 8);
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
  };
  window.addEventListener('scroll', () => { if (!pending) { pending = true; raf(updateScrollFx); } }, { passive: true });
  window.addEventListener('resize', () => raf(updateScrollFx), { passive: true });
  updateScrollFx();
}

/** Brilho que segue o ponteiro nos cards e no hero (no máximo uma escrita por frame). */
function initPointerFx() {
  const raf = window.requestAnimationFrame?.bind(window) ?? ((fn) => fn());
  let last = null;
  let scheduled = false;
  const apply = () => {
    scheduled = false;
    if (!last) return;
    const { x, y, target } = last;
    const card = target.closest?.('.card');
    if (card) {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${Math.round(x - r.left)}px`);
      card.style.setProperty('--my', `${Math.round(y - r.top)}px`);
    }
    const hero = target.closest?.('.hero');
    if (hero) {
      const r = hero.getBoundingClientRect();
      const pct = (v) => `${Math.max(0, Math.min(100, Math.round(v)))}%`;
      hero.style.setProperty('--hx', pct((x / window.innerWidth) * 100));
      hero.style.setProperty('--hy', pct(((y - r.top) / r.height) * 100));
    }
  };
  main.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    last = { x: e.clientX, y: e.clientY, target: e.target };
    if (!scheduled) { scheduled = true; raf(apply); }
  }, { passive: true });
}

let lastCardKey = '';

function route() {
  // Âncoras como #main (link "Pular para o conteúdo") não são rotas do app.
  if (!isAppHash(location.hash)) return;
  const wantsSearch = state.focusSearch; // a Home consome a flag e já foca a busca
  trackFiltersHeight(null); // só a Home tem filtros fixos
  try {
    const v = resolveView(parseRoute(location.hash), state.manifest);
    if (v.view === 'home') renderHome();
    else if (v.view === 'tier') renderTier(v.tier);
    else if (v.view === 'card' || v.view === 'piece') renderCard(v.tier, v.card, v.type);
    else renderNotFound();
  } catch (err) {
    setView(message(`Erro ao exibir a página: ${err.message}`, 'error'));
  }
  // Foco: na busca (atalho "/"), na aba ativa (troca de peça no mesmo card) ou no <main>.
  const r = parseRoute(location.hash);
  const cardKey = r.view === 'card' || r.view === 'piece' ? `${r.tier}/${r.card}` : '';
  const activeTab = cardKey && cardKey === lastCardKey ? main.querySelector('.tabs a[aria-current="page"]') : null;
  lastCardKey = cardKey;
  if (wantsSearch) { /* já focado em renderHome */ } else if (activeTab) activeTab.focus({ preventScroll: true });
  else {
    const heading = main.querySelector('h1');
    if (heading) heading.setAttribute('tabindex', '-1');
    (heading ?? main).focus({ preventScroll: true });
  }
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  playEntrance();
  updateScrollFx();
}

function isTyping(el) {
  return el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));
}

document.addEventListener('keydown', (e) => {
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target) || !state.manifest) return;
  e.preventDefault();
  const q = document.getElementById('q');
  if (q) q.focus();
  else { state.focusSearch = true; location.hash = '#/'; }
});

let filtersObserver;
let filtersOnResize;

/** Expõe a altura da barra de filtros (quando fixa) em --filters-h, para o scroll-padding não deixar o foco atrás dela. */
function trackFiltersHeight(el) {
  filtersObserver?.disconnect();
  if (filtersOnResize) window.removeEventListener('resize', filtersOnResize);
  filtersOnResize = null;
  const root = document.documentElement;
  if (!el || !('ResizeObserver' in window)) { root.style.setProperty('--filters-h', '0px'); return; }
  const set = () => root.style.setProperty('--filters-h', getComputedStyle(el).position === 'sticky' ? `${el.offsetHeight}px` : '0px');
  filtersObserver = new ResizeObserver(set);
  filtersObserver.observe(el);
  filtersOnResize = set; // a posição (sticky/static) muda por media query sem mudar o tamanho
  window.addEventListener('resize', set, { passive: true });
  set();
}

/** Mantém --topbar-h igual à altura real do topo (ele quebra em linhas em telas médias). */
function trackTopbarHeight() {
  const topbar = document.querySelector('.topbar');
  if (!topbar || !('ResizeObserver' in window)) return;
  const set = () => document.documentElement.style.setProperty('--topbar-h', `${topbar.offsetHeight}px`);
  new ResizeObserver(set).observe(topbar);
  set();
}

async function init() {
  initTheme(document.getElementById('theme-toggle'));
  trackTopbarHeight();
  initScrollFx();
  initPointerFx();
  setView(skeleton());
  try {
    const res = await fetch('content/manifest.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const { ok, errors } = validateManifest(data);
    if (!ok) throw new Error(errors.join('; '));
    state.manifest = data;
    buildEntries();
  } catch (err) {
    setView(message(`Manifest inválido ou indisponível: ${err.message}`, 'error'));
    return;
  }
  if (!isAppHash(location.hash)) {
    // Entrou por uma âncora (ex.: #main depois do link "Pular"): trata como Home.
    window.history.replaceState(null, '', `${location.pathname}${location.search}#/`);
  }
  window.addEventListener('hashchange', route);
  route();
}

init();

import { parseFrontMatter, validateManifest, TIER_IDS } from './content.js';
import { parseRoute, isAppHash } from './router.js';
import { renderMarkdown } from './markdown.js';
import { buildIndex, search, collectTags } from './search.js';
import { h, safeFragment, copyButton, addCopyButtons, initTheme } from './dom.js';
import { icon, TYPE_ICON } from './icons.js';
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
  focusSearch: false,
};
const pieceCache = new Map();

const enc = encodeURIComponent;
const tierHref = (t) => `#/${enc(t)}`;
const cardHref = (t, c) => `#/${enc(t)}/${enc(c)}`;
const pieceHref = (t, c, p) => `#/${enc(t)}/${enc(c)}/${enc(p)}`;
const findTier = (id) => state.manifest.tiers.find((t) => t.id === id);
const findCard = (tier, id) => tier?.cards.find((c) => c.id === id);
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
  return h('span', { class: 'level', role: 'img', 'aria-label': label ?? `Nível ${level} de 3` },
    [1, 2, 3].map((i) => h('i', { class: i <= level ? 'on' : '' })));
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

/** Carrega o corpo de todas as peças uma única vez, para a busca no texto. */
function ensureBodies() {
  state.bodiesPromise ??= (async () => {
    await Promise.all(state.entries.map(async (entry) => {
      const parts = await Promise.all(entry.cardObj.pieces.map((p) =>
        fetchText(p.file).then((t) => parseFrontMatter(t).body).catch(() => '')));
      entry.text = parts.join('\n');
    }));
    state.index = buildIndex(state.entries);
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

function cardTile(entry, i = 0) {
  const { cardObj: card, tierObj: tier } = entry;
  return h('a', { class: 'card', href: cardHref(tier.id, card.id), style: `--i:${Math.min(i, 12)}` },
    h('span', { class: 'card-icon' }, icon(card.icon || 'folder', 22)),
    h('h3', {}, card.title),
    h('p', { class: 'card-summary' }, card.summary || ''),
    h('ul', { class: 'chips', 'aria-label': 'Peças incluídas' },
      card.pieces.map((p) => h('li', { class: 'chip' }, icon(TYPE_ICON[p.type], 13), TYPE_LABELS[p.type]))),
    (card.tags || []).length
      ? h('ul', { class: 'tags', 'aria-label': 'Tags' }, card.tags.map((t) => h('li', { class: 'tag' }, `#${t}`)))
      : null,
    h('span', { class: 'card-go', 'aria-hidden': 'true' }, icon('arrow-right', 16)));
}

function tierSection(tier, entries, { heading = 'h2', link = true } = {}) {
  const title = link ? h('a', { href: tierHref(tier.id) }, tier.title) : tier.title;
  return h('section', { class: 'tier', 'aria-labelledby': `tier-${tier.id}` },
    h('header', { class: 'tier-head' },
      levelDots(tierLevel(tier.id)),
      h('div', {},
        h(heading, { id: `tier-${tier.id}` }, title),
        tier.description ? h('p', {}, tier.description) : null),
      h('span', { class: 'count' }, plural(entries.length, ['card', 'cards']))),
    entries.length
      ? h('div', { class: 'grid' }, entries.map((e, i) => cardTile(e, i)))
      : message('Nenhum card neste nível ainda.'));
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
    pills.map(([n, words]) => h('li', {}, h('strong', {}, n), ` ${n === 1 ? words[0] : words[1]}`)));
}

function renderHome() {
  renderNav(null);
  setTitle('');
  const f = state.filters;

  const input = h('input', {
    id: 'q', type: 'search', class: 'searchbox-input', placeholder: 'Buscar skills, workflows, agentes…',
    autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Buscar no conteúdo', 'aria-controls': 'results',
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
  }

  function clearAll() {
    f.q = ''; f.tier = ''; f.tags.clear(); input.value = '';
    paintFilters(); paintResults();
    input.focus();
  }
  clearBtn.addEventListener('click', clearAll);

  input.addEventListener('input', () => {
    f.q = input.value;
    ensureBodies().then(() => { if (input.isConnected) paintResults(); });
    paintResults();
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
  if (state.focusSearch) { state.focusSearch = false; input.focus(); }
}

/* ---------- nível ---------- */

function renderTier(tier) {
  renderNav(tier.id);
  setTitle(tier.title);
  const entries = state.entries.filter((e) => e.tier === tier.id);
  setView(
    h('nav', { class: 'crumbs', 'aria-label': 'Você está em' }, h('a', { href: '#/' }, 'Início'), h('span', {}, tier.title)),
    tierSection(tier, entries, { heading: 'h1', link: false }));
}

/* ---------- card ---------- */

function skeleton() {
  return h('div', { class: 'skeleton', role: 'status', 'aria-busy': 'true', 'aria-label': 'Carregando' },
    h('i', { style: 'width:40%' }), h('i', {}), h('i', {}), h('i', { style: 'width:70%' }));
}

async function loadPiece(panel, piece) {
  panel.replaceChildren(skeleton());
  try {
    const raw = await fetchText(piece.file);
    const { meta, body } = parseFrontMatter(raw);
    const article = h('article', { class: 'md' }, safeFragment(renderMarkdown(body)));
    addCopyButtons(article);
    panel.replaceChildren(
      h('div', { class: 'piece-head' },
        h('div', {},
          h('h2', {}, piece.title),
          meta.name && meta.name !== piece.title ? h('code', { class: 'piece-name' }, meta.name) : null,
          meta.description ? h('p', {}, meta.description) : null),
        copyButton('Copiar peça', () => raw)),
      article);
    await highlightCodeBlocks(article);
  } catch (err) {
    panel.replaceChildren(message(`Não foi possível carregar "${piece.file}": ${err.message}`, 'error'));
  }
}

function renderCard(tier, card, activeType) {
  renderNav(tier.id);
  setTitle(card.title);
  const pieces = card.pieces;
  const current = pieces.find((p) => p.type === activeType) || pieces[0];
  const panel = h('div', { class: 'panel', id: 'piece-panel' });

  const siblings = tier.cards;
  const at = siblings.findIndex((c) => c.id === card.id);
  const prev = siblings[at - 1];
  const next = siblings[at + 1];

  const aside = siblings.length > 1
    ? h('aside', { class: 'card-aside', 'aria-label': `Cards em ${tier.title}` },
        h('h2', {}, tier.title),
        h('ul', {}, siblings.map((c) => h('li', {},
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
        (card.tags || []).length
          ? h('ul', { class: 'tags' }, card.tags.map((t) => h('li', { class: 'tag' }, `#${t}`)))
          : null)),
    h('div', { class: `card-layout${aside ? ' has-aside' : ''}` },
      h('div', { class: 'card-main' },
        pieces.length
          ? h('nav', { class: 'tabs', 'aria-label': 'Peças do card' },
              pieces.map((p) => h('a', {
                href: pieceHref(tier.id, card.id, p.type),
                'aria-current': p === current ? 'page' : null,
              }, icon(TYPE_ICON[p.type], 16), TYPE_LABELS[p.type])))
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

  if (current) loadPiece(panel, current);
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

/** Anima a entrada da página (CSS `.is-entering`) e revela as faixas de nível ao rolar. */
function playEntrance() {
  main.classList.add('is-entering');
  clearTimeout(enterTimer);
  enterTimer = setTimeout(() => main.classList.remove('is-entering'), 1100);

  revealObserver?.disconnect();
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const targets = [...main.querySelectorAll('.tier')].slice(1);
  if (!targets.length) return;
  revealObserver = new IntersectionObserver((items) => {
    for (const it of items) {
      if (!it.isIntersecting) continue;
      it.target.classList.add('in');
      revealObserver.unobserve(it.target);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  for (const t of targets) { t.classList.add('reveal'); revealObserver.observe(t); }
  // Rede de segurança: nada fica escondido se o observador não disparar.
  setTimeout(() => targets.forEach((t) => t.classList.add('in')), 2500);
}

let lastCardKey = '';

function route() {
  // Âncoras como #main (link "Pular para o conteúdo") não são rotas do app.
  if (!isAppHash(location.hash)) return;
  const wantsSearch = state.focusSearch; // a Home consome a flag e já foca a busca
  trackFiltersHeight(null); // só a Home tem filtros fixos
  try {
    const r = parseRoute(location.hash);
    const tier = r.tier && findTier(r.tier);
    const card = tier && r.card && findCard(tier, r.card);
    const typeOk = r.view !== 'piece' || card?.pieces.some((p) => p.type === r.type);
    if (r.view === 'home') renderHome();
    else if (r.view === 'tier' && tier) renderTier(tier);
    else if ((r.view === 'card' || r.view === 'piece') && card && typeOk) renderCard(tier, card, r.type);
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
  else main.focus({ preventScroll: true });
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  playEntrance();
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

/** Expõe a altura da barra de filtros (quando fixa) em --filters-h, para o scroll-padding não deixar o foco atrás dela. */
function trackFiltersHeight(el) {
  filtersObserver?.disconnect();
  const root = document.documentElement;
  if (!el || !('ResizeObserver' in window)) { root.style.setProperty('--filters-h', '0px'); return; }
  const set = () => root.style.setProperty('--filters-h', getComputedStyle(el).position === 'sticky' ? `${el.offsetHeight}px` : '0px');
  filtersObserver = new ResizeObserver(set);
  filtersObserver.observe(el);
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
  window.addEventListener('hashchange', route);
  route();
}

init();

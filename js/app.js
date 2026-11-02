import { parseFrontMatter, validateManifest } from './content.js';
import { parseRoute, isAppHash } from './router.js';
import { renderMarkdown } from './markdown.js';
import { isTagAllowed, isAttrAllowed } from './sanitize.js';

const TYPE_LABELS = {
  skill: 'Skill',
  'claude-md': 'CLAUDE.md',
  arquitetura: 'Arquitetura',
  agente: 'Agente',
  workflow: 'Workflow',
  prompt: 'Prompt',
};

const main = document.getElementById('main');
const tierNav = document.getElementById('tier-nav');
let manifest = null;

/** Cria elemento sem usar innerHTML: todo texto entra via textContent. */
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v == null) continue;
    el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

const enc = encodeURIComponent;
const tierHref = (t) => `#/${enc(t)}`;
const cardHref = (t, c) => `#/${enc(t)}/${enc(c)}`;
const pieceHref = (t, c, p) => `#/${enc(t)}/${enc(c)}/${enc(p)}`;

function findTier(id) { return manifest.tiers.find((t) => t.id === id); }
function findCard(tier, id) { return tier?.cards.find((c) => c.id === id); }

function setView(...nodes) {
  main.replaceChildren(...nodes);
}

function message(text, kind = 'notice') {
  return h('div', { class: `${kind} ${kind === 'error' ? 'error' : ''}`.trim(), role: kind === 'error' ? 'alert' : null }, text);
}

function renderNav(activeTier) {
  tierNav.replaceChildren(
    ...manifest.tiers.map((t) =>
      h('a', { href: tierHref(t.id), 'aria-current': t.id === activeTier ? 'page' : null }, t.title)),
  );
}

function cardTile(tier, card) {
  return h('a', { class: 'card', href: cardHref(tier.id, card.id) },
    h('h3', {}, card.title),
    h('p', {}, card.summary || ''),
    h('div', { class: 'tags' },
      card.pieces.map((p) => h('span', { class: 'tag' }, TYPE_LABELS[p.type])),
      (card.tags || []).map((t) => h('span', { class: 'tag' }, `#${t}`))));
}

function tierSection(tier, withLink) {
  return h('section', {},
    h('h2', {}, withLink ? h('a', { href: tierHref(tier.id) }, tier.title) : tier.title),
    tier.cards.length
      ? h('div', { class: 'grid' }, tier.cards.map((c) => cardTile(tier, c)))
      : message('Nenhum card neste nível ainda.'));
}

function renderHome() {
  renderNav(null);
  setView(
    h('h1', {}, 'Claude Library'),
    h('p', { class: 'lead' }, 'Propostas para o Claude Code, organizadas por complexidade da tarefa.'),
    manifest.tiers.map((t) => tierSection(t, true)));
}

function renderTier(tier) {
  renderNav(tier.id);
  setView(
    h('div', { class: 'crumbs' }, h('a', { href: '#/' }, 'Início')),
    h('h1', {}, tier.title),
    tier.cards.length
      ? h('div', { class: 'grid' }, tier.cards.map((c) => cardTile(tier, c)))
      : message('Nenhum card neste nível ainda.'));
}

/**
 * Segunda camada de defesa: o HTML de renderMarkdown já escapa HTML bruto e filtra URLs.
 * Aqui ele é parseado em um <template> (inerte: nada executa nem carrega) e só passam
 * tags e atributos aprovados por js/sanitize.js (política pura, testada em Node).
 */
function safeFragment(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  const walk = (node) => {
    for (const child of [...node.children]) {
      const attrs = Object.fromEntries([...child.attributes].map((a) => [a.name, a.value]));
      if (!isTagAllowed(child.tagName, attrs)) { child.remove(); continue; }
      for (const [name, value] of Object.entries(attrs)) {
        if (!isAttrAllowed(child.tagName, name, value)) child.removeAttribute(name);
      }
      walk(child);
    }
  };
  walk(tpl.content);
  return tpl.content;
}

/** Copia texto; usa a Clipboard API e, se indisponível, um textarea temporário. */
async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* cai no fallback */ }
  try {
    const ta = h('textarea', { 'aria-hidden': 'true', style: 'position:fixed;opacity:0;top:0' });
    ta.value = text;
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

function copyButton(label, getText) {
  const btn = h('button', { type: 'button', class: 'copy-btn', 'aria-live': 'polite' }, label);
  btn.addEventListener('click', async () => {
    const ok = await copyText(getText());
    btn.textContent = ok ? 'Copiado!' : 'Não foi possível copiar';
    setTimeout(() => { btn.textContent = label; }, 1800);
  });
  return btn;
}

function addCopyButtons(root) {
  for (const pre of root.querySelectorAll('pre')) {
    const wrap = h('div', { class: 'code-wrap' });
    pre.replaceWith(wrap);
    wrap.append(copyButton('Copiar', () => pre.textContent), pre);
  }
}

function initTheme() {
  const btn = document.getElementById('theme-toggle');
  const root = document.documentElement;
  const read = () => { try { return localStorage.getItem('theme'); } catch { return null; } };
  const write = (v) => { try { localStorage.setItem('theme', v); } catch { /* sem persistência */ } };
  const saved = read();
  if (saved === 'light' || saved === 'dark') root.dataset.theme = saved;
  const isDark = () => root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  btn.hidden = false;
  btn.addEventListener('click', () => {
    const next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    write(next);
  });
}

async function fetchText(file) {
  const res = await fetch(`content/${file.split('/').map(enc).join('/')}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function renderCard(tier, card, activeType) {
  renderNav(tier.id);
  const pieces = card.pieces;
  const current = pieces.find((p) => p.type === activeType) || pieces[0];
  const panel = h('div', { id: 'piece-panel' });

  setView(
    h('div', { class: 'crumbs' },
      h('a', { href: '#/' }, 'Início'), ' / ', h('a', { href: tierHref(tier.id) }, tier.title)),
    h('h1', {}, card.title),
    h('p', { class: 'lead' }, card.summary || ''),
    h('div', { class: 'tags' }, (card.tags || []).map((t) => h('span', { class: 'tag' }, `#${t}`))),
    pieces.length
      ? h('nav', { class: 'tablist', 'aria-label': 'Peças do card' },
          pieces.map((p) => h('a', {
            href: pieceHref(tier.id, card.id, p.type),
            'aria-current': p === current ? 'page' : null,
          }, TYPE_LABELS[p.type])))
      : null,
    pieces.length ? panel : message('Este card ainda não tem peças.'));

  if (!current) return;
  panel.append(message('Carregando…'));
  try {
    const raw = await fetchText(current.file);
    const { meta, body } = parseFrontMatter(raw);
    const article = h('article', { class: 'md' }, safeFragment(renderMarkdown(body)));
    addCopyButtons(article);
    panel.replaceChildren(
      h('div', { class: 'piece-actions' }, copyButton('Copiar peça', () => raw)),
      meta.name || meta.description
        ? h('p', { class: 'lead' }, [meta.name && h('strong', {}, meta.name), meta.name && meta.description ? ' — ' : '', meta.description])
        : null,
      article);
  } catch (err) {
    panel.replaceChildren(message(`Não foi possível carregar "${current.file}": ${err.message}`, 'error'));
  }
}

function renderNotFound() {
  renderNav(null);
  setView(
    h('h1', {}, 'Página não encontrada'),
    h('p', {}, h('a', { href: '#/' }, 'Voltar ao início')));
}

async function route() {
  // Âncoras como #main (link "Pular para o conteúdo") não são rotas do app.
  if (!isAppHash(location.hash)) return;
  try {
    const r = parseRoute(location.hash);
    const tier = r.tier && findTier(r.tier);
    const card = tier && r.card && findCard(tier, r.card);
    const typeOk = r.view !== 'piece' || card?.pieces.some((p) => p.type === r.type);
    if (r.view === 'home') renderHome();
    else if (r.view === 'tier' && tier) renderTier(tier);
    else if ((r.view === 'card' || r.view === 'piece') && card && typeOk) await renderCard(tier, card, r.type);
    else renderNotFound();
  } catch (err) {
    setView(message(`Erro ao exibir a página: ${err.message}`, 'error'));
  }
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

async function init() {
  try {
    const res = await fetch('content/manifest.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const { ok, errors } = validateManifest(data);
    if (!ok) throw new Error(errors.join('; '));
    manifest = data;
  } catch (err) {
    setView(message(`Manifest inválido ou indisponível: ${err.message}`, 'error'));
    return;
  }
  window.addEventListener('hashchange', route);
  route();
}

initTheme();
init();

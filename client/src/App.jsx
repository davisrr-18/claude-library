import { useCallback, useEffect, useRef, useState } from 'react';
import Callout from './components/Callout/Callout.jsx';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary.jsx';
import Footer from './components/Footer/Footer.jsx';
import Skeleton from './components/Skeleton/Skeleton.jsx';
import Topbar from './components/Topbar/Topbar.jsx';
import { resetReveal, revealOnScroll } from './dom/reveal.js';
import { EndEntranceContext } from './hooks/useEntrance.js';
import { useHash } from './hooks/useHash.js';
import { useLibrary } from './hooks/useLibrary.js';
import { usePointerGlow } from './hooks/usePointerGlow.js';
import Card from './pages/Card/Card.jsx';
import Home, { NO_FILTERS } from './pages/Home/Home.jsx';
import NotFound from './pages/NotFound/NotFound.jsx';
import Tier from './pages/Tier/Tier.jsx';
import { parseRoute, resolveView } from './utils/router.js';
import styles from './App.module.css';

const APP_TITLE = 'Claude Library';
const ENTRANCE_MS = 1800;

const titleOf = (v) =>
  v.view === 'tier'
    ? v.tier.title
    : v.view === 'card' || v.view === 'piece'
      ? v.card.title
      : v.view === 'notfound'
        ? 'Página não encontrada'
        : '';

const isTyping = (el) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

export default function App() {
  const library = useLibrary();
  const hash = useHash();
  const [filters, setFilters] = useState(NO_FILTERS);
  const [tierTabs, setTierTabs] = useState({});
  const mainRef = useRef(null);
  const focusSearchRef = useRef(false);
  const lastCardKey = useRef('');
  const entranceTimer = useRef();
  usePointerGlow(mainRef);

  const endEntrance = useCallback(() => {
    clearTimeout(entranceTimer.current);
    mainRef.current?.classList.remove('is-entering');
  }, []);

  const ready = library.status === 'ready';
  const route = parseRoute(hash);
  const view = ready ? resolveView(route, library.manifest) : null;
  const viewKey = view ? `${view.view}/${view.tier?.id ?? ''}/${view.card?.id ?? ''}` : '';

  useEffect(() => {
    document.title = view ? (titleOf(view) ? `${titleOf(view)} · ${APP_TITLE}` : APP_TITLE) : APP_TITLE;
  }, [view]);

  // A cada rota: foco (busca, aba ativa do mesmo card, ou o h1), volta ao topo e entrada animada.
  useEffect(() => {
    if (!ready) return;
    const main = mainRef.current;
    const cardKey = route.view === 'card' || route.view === 'piece' ? `${route.tier}/${route.card}` : '';
    const activeTab =
      cardKey && cardKey === lastCardKey.current
        ? main.querySelector('[data-piece-tabs] a[aria-current="page"]')
        : null;
    lastCardKey.current = cardKey;
    if (document.activeElement?.id === 'q') {
      /* o atalho "/" já focou a busca */
    } else if (activeTab) activeTab.focus({ preventScroll: true });
    else {
      const heading = main.querySelector('h1');
      heading?.setAttribute('tabindex', '-1');
      (heading ?? main).focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    main.classList.add('is-entering');
    clearTimeout(entranceTimer.current);
    entranceTimer.current = setTimeout(() => main.classList.remove('is-entering'), ENTRANCE_MS);
    resetReveal();
    revealOnScroll(main.querySelectorAll('[data-reveal]'));
    // Só quando a rota muda (o hash, não o objeto `route` recriado a cada render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, hash]);

  // Atalho "/": foca a busca (na Home) ou vai para a Home e foca ao chegar.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target) || !ready) return;
      e.preventDefault();
      const q = document.getElementById('q');
      if (q) q.focus();
      else {
        focusSearchRef.current = true;
        window.location.hash = '#/';
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [ready]);

  let page = <Skeleton />;
  if (library.status === 'error')
    page = <Callout kind="error">{`Manifest inválido ou indisponível: ${library.error.message}`}</Callout>;
  else if (view?.view === 'home') {
    page = (
      <Home
        library={library}
        filters={filters}
        onFilters={setFilters}
        tierTabs={tierTabs}
        onTierTab={(tierId, type) => setTierTabs((t) => ({ ...t, [tierId]: type }))}
        focusSearchRef={focusSearchRef}
      />
    );
  } else if (view?.view === 'tier') {
    page = (
      <Tier
        tier={view.tier}
        entries={library.entries.filter((e) => e.tier === view.tier.id)}
        tab={tierTabs[view.tier.id]}
        onTab={(type) => setTierTabs((t) => ({ ...t, [view.tier.id]: type }))}
      />
    );
  } else if (view?.view === 'card' || view?.view === 'piece') {
    page = <Card key={viewKey} tier={view.tier} card={view.card} activeType={view.type} />;
  } else if (view?.view === 'notfound') page = <NotFound />;

  return (
    <>
      <a className={styles.skip} href="#main">
        Pular para o conteúdo
      </a>
      <Topbar tiers={library.manifest?.tiers ?? []} activeTier={view?.tier?.id ?? null} />
      <EndEntranceContext.Provider value={endEntrance}>
        <main ref={mainRef} id="main" className={styles.main} tabIndex={-1}>
          <ErrorBoundary key={hash}>{page}</ErrorBoundary>
        </main>
      </EndEntranceContext.Provider>
      <Footer />
    </>
  );
}

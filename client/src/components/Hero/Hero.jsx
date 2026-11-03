import { useRef } from 'react';
import { TYPE_PLURAL } from '../../utils/format.js';
import Icon from '../Icon/Icon.jsx';
import CountUp from './CountUp.jsx';
import styles from './Hero.module.css';

/** Contagens do resumo: cards e, por tipo, quantas peças existem. */
function statsOf(manifest, cardCount) {
  const counts = {};
  for (const t of manifest.tiers)
    for (const c of t.cards) for (const p of c.pieces) counts[p.type] = (counts[p.type] || 0) + 1;
  return [
    [cardCount, ['card', 'cards']],
    ...Object.keys(TYPE_PLURAL)
      .filter((t) => counts[t])
      .map((t) => [counts[t], TYPE_PLURAL[t]]),
  ];
}

const delay = (s) => ({ '--delay': `${s}s` });

/** Abertura da Home: título, caixa de busca (a tecla "/" a foca) e resumo do conteúdo. */
export default function Hero({ manifest, cardCount, query, onQuery, onClear }) {
  const input = useRef(null);
  return (
    <section className={styles.hero} data-glow="hero">
      <p className={`${styles.eyebrow} enter`}>Biblioteca pessoal</p>
      <h1 className="enter" style={delay(0.06)}>
        Seu Claude Code, <span className={styles.accent}>organizado</span>
      </h1>
      <p className={`${styles.lead} enter`} style={delay(0.12)}>
        Skills, workflows, agentes e prompts, agrupados pela complexidade da tarefa. Abra, copie e cole.
      </p>
      <label className={`${styles.searchbox} enter`} style={delay(0.18)} htmlFor="q">
        <Icon name="search" size={20} />
        <input
          ref={input}
          id="q"
          type="search"
          className={styles.input}
          placeholder="Buscar skills, workflows, agentes…"
          autoComplete="off"
          spellCheck="false"
          aria-label="Buscar skills, workflows, agentes"
          aria-controls="results"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && onClear()}
        />
        <kbd aria-hidden="true">/</kbd>
      </label>
      <ul className={`${styles.stats} enter`} style={delay(0.24)} aria-label="Resumo do conteúdo">
        {statsOf(manifest, cardCount).map(([n, words]) => (
          <li key={words[0]}>
            <strong>
              <CountUp value={n} />
            </strong>{' '}
            {n === 1 ? words[0] : words[1]}
          </li>
        ))}
      </ul>
    </section>
  );
}

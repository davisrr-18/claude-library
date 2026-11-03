import { reducedMotion } from './useReducedMotion.js';

let observer;

/** Esconde o que está totalmente abaixo da dobra e revela (com transição) quando entra na tela. */
export function revealOnScroll(candidates) {
  if (!('IntersectionObserver' in window) || reducedMotion()) return;
  const fold = window.innerHeight;
  const targets = [...candidates].filter((el) => el.getBoundingClientRect().top > fold);
  if (!targets.length) return;
  observer ??= new IntersectionObserver(
    (items) => {
      for (const it of items) {
        if (!it.isIntersecting) continue;
        const el = it.target;
        observer.unobserve(el);
        el.classList.add('in');
        setTimeout(() => {
          // volta ao estilo normal (hover etc.) sem reanimar a entrada
          el.classList.remove('reveal', 'in');
          el.classList.add('revealed');
        }, 1000);
      }
    },
    { rootMargin: '0px', threshold: 0.01 },
  );
  for (const el of targets) {
    el.classList.add('reveal');
    observer.observe(el);
  }
}

/** Solta o que estava sendo observado (troca de rota). */
export function resetReveal() {
  observer?.disconnect();
  observer = undefined;
}

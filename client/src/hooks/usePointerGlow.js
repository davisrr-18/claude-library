import { useEffect } from 'react';

/**
 * Brilho que segue o ponteiro (no máximo uma escrita por frame). Elementos com `data-glow="card"` recebem --mx e
 * --my em px; `data-glow="hero"` recebe --hx e --hy em %.
 */
export function usePointerGlow(ref) {
  useEffect(() => {
    const root = ref.current;
    let last = null;
    let scheduled = false;
    const apply = () => {
      scheduled = false;
      if (!last) return;
      const { x, y, target } = last;
      const el = target.closest?.('[data-glow]');
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (el.dataset.glow === 'card') {
        el.style.setProperty('--mx', `${Math.round(x - r.left)}px`);
        el.style.setProperty('--my', `${Math.round(y - r.top)}px`);
      } else {
        const pct = (v) => `${Math.max(0, Math.min(100, Math.round(v)))}%`;
        el.style.setProperty('--hx', pct((x / window.innerWidth) * 100));
        el.style.setProperty('--hy', pct(((y - r.top) / r.height) * 100));
      }
    };
    const onMove = (e) => {
      if (e.pointerType === 'touch') return;
      last = { x: e.clientX, y: e.clientY, target: e.target };
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(apply);
      }
    };
    root.addEventListener('pointermove', onMove, { passive: true });
    return () => root.removeEventListener('pointermove', onMove);
  }, [ref]);
}

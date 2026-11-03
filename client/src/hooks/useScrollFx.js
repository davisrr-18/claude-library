import { useEffect, useState } from 'react';

/** Quanto a página rolou: `scrolled` (passou de 8px) e `progress` de 0 a 1, no máximo uma atualização por frame. */
export function useScrollFx() {
  const [fx, setFx] = useState({ scrolled: false, progress: 0 });
  useEffect(() => {
    let pending = false;
    const update = () => {
      pending = false;
      const y = window.scrollY || 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setFx((old) => {
        const next = { scrolled: y > 8, progress: max > 0 ? Math.min(1, y / max) : 0 };
        return old.scrolled === next.scrolled && old.progress === next.progress ? old : next;
      });
    };
    const schedule = () => {
      if (!pending) {
        pending = true;
        requestAnimationFrame(update);
      }
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    schedule();
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);
  return fx;
}

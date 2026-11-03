import { useEffect, useState } from 'react';

/**
 * Rolagem da página. Devolve `scrolled` (passou de 8px, muda raramente) e escreve o progresso de leitura (0 a 1) direto
 * na custom property --progresso do elemento de `barRef`, no máximo uma vez por frame e sem re-render do React.
 */
export function useScrollFx(barRef) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    let pending = false;
    const update = () => {
      pending = false;
      const y = Math.max(0, window.scrollY || 0); // o overscroll do iOS dá rolagem negativa
      const max = document.documentElement.scrollHeight - window.innerHeight;
      barRef.current?.style.setProperty('--progresso', String(max > 0 ? Math.min(1, y / max) : 0));
      setScrolled(y > 8);
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
  }, [barRef]);
  return scrolled;
}

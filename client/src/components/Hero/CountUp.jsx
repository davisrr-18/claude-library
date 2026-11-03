import { useEffect, useState } from 'react';
import { reducedMotion } from '../../dom/reducedMotion.js';

const DURATION_MS = 800;

/** Número que conta de 0 até `value` (800 ms, uma vez). Com movimento reduzido, mostra o valor direto. */
export default function CountUp({ value }) {
  const [shown, setShown] = useState(() => (reducedMotion() ? value : 0));
  useEffect(() => {
    if (reducedMotion()) return undefined;
    let frame;
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, Math.max(0, now - start) / DURATION_MS);
      setShown(Math.round(value * (1 - (1 - t) ** 3)));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return shown;
}

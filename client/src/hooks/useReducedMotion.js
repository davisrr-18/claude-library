/** Preferência do sistema por menos movimento (lida na hora, não guardada). */
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

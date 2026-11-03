import { PATHS } from '../../utils/icons.js';

/** Ícone de traço decorativo (aria-hidden). Nome desconhecido cai em "folder". */
export default function Icon({ name, size = 18 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={PATHS[name] ?? PATHS.folder} />
    </svg>
  );
}

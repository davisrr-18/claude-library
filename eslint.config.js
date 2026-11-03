// Lint só do client/. O código legado (js/, scripts/, tests/) é conferido por `npm run qa`.
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';

const browser = {
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  location: 'readonly',
  localStorage: 'readonly',
  fetch: 'readonly',
  console: 'readonly',
  process: 'readonly',
  URL: 'readonly',
  TextEncoder: 'readonly',
  btoa: 'readonly',
  matchMedia: 'readonly',
  requestAnimationFrame: 'readonly',
  cancelAnimationFrame: 'readonly',
  IntersectionObserver: 'readonly',
  ResizeObserver: 'readonly',
  HTMLElement: 'readonly',
  Node: 'readonly',
  performance: 'readonly',
  getComputedStyle: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
};

export default [
  { ignores: ['client/dist/**'] },
  {
    files: ['client/**/*.{js,jsx}'],
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: browser,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.flat.recommended.rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      'react/prop-types': 'off', // projeto sem TypeScript nem PropTypes
      'no-undef': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-unused-vars': 'error',
    },
  },
  // Testes rodam em Node (Vitest).
  { files: ['client/**/*.test.{js,jsx}'], languageOptions: { globals: { ...browser, Buffer: 'readonly', HashChangeEvent: 'readonly', Event: 'readonly', Storage: 'readonly' } } },
];

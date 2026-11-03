// Lint só do client/. O código legado (js/, scripts/, tests/) é conferido por `npm run qa`.
// shortcut: sem eslint-plugin-react / react-hooks / jsx-a11y (dependências ainda não aprovadas); a regra de
// variáveis não usadas ignora nomes em maiúsculas (componentes em JSX). Trocar quando os plugins forem aprovados.
export default [
  { ignores: ['client/dist/**'] },
  {
    files: ['client/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        fetch: 'readonly',
        console: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: 'error',
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z]' }],
    },
  },
];

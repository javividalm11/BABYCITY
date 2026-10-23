import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: [
      'node_modules/**',
      'public/vendor/**',
      'archive/**',
      'output/**',
      'test-results/**',
      '.wrangler/**',
    ],
  },
  js.configs.recommended,
  {
    rules: {
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  { files: ['public/js/**/*.js'], languageOptions: { globals: globals.browser } },
  {
    files: ['src/**/*.js', 'scripts/**/*.mjs', 'tests/**/*.{js,mjs}', 'playwright.config.js'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
  },
];

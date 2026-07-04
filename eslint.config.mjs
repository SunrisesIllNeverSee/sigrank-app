import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import nextPlugin from '@next/eslint-plugin-next'

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,jsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.es2024,
      },
    },
    rules: {
      'no-unused-vars': 'off', // handled by @typescript-eslint/no-unused-vars
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'off', // TS handles this better
      'no-console': 'off', // Next.js app — console is fine in client code
      '@typescript-eslint/no-explicit-any': 'off', // TODO: tighten after type audit
      '@typescript-eslint/no-empty-object-type': 'off', // TODO: tighten after type audit
      '@typescript-eslint/no-unused-expressions': 'off', // TODO: tighten after type audit
      ...nextPlugin.configs.recommended.rules,
    },
  },
  {
    ignores: [
      'node_modules/',
      '.next/',
      'dist/',
      '_sigrank-mcp/',
      '**/*.d.ts',
      'next-env.d.ts',
    ],
  },
]

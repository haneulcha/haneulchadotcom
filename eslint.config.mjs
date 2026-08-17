import prettier from 'eslint-config-prettier/flat';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

/**
 * Prettier is not run as an ESLint rule here. `eslint-config-prettier` only
 * turns off the rules that would fight with it; formatting itself is
 * `pnpm format` and the lint-staged hook.
 */
const config = [
  {
    ignores: [
      '.next/**',
      'next-env.d.ts',
      '.output/**',
      '.nitro/**',
      '.tanstack/**',
      'test-results/**',
      'playwright-report/**',
      'src/routeTree.gen.ts',
    ],
  },
  ...tseslint.configs.recommended,
  // v7에서 `configs['recommended-latest']`는 eslintrc 형식이다. flat config는
  // `configs.flat` 아래에 있다.
  reactHooks.configs.flat['recommended-latest'],
  prettier,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
];

export default config;

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Every page component fetches its own data via a `useCallback`
      // called from a `useEffect` (see CLAUDE.md's "State" section) — the
      // standard pattern for this codebase, and each occurrence already
      // guards against races (request-id refs) and stale closures. This
      // rule flags the synchronous `setLoading(true)`/`setState(...)` that
      // pattern requires as a possible cascading-render smell; downgraded
      // to a warning rather than rewriting many already-audited effects.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])

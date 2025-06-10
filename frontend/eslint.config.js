import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      // Allow 'any' in error handling and legacy code
      '@typescript-eslint/no-explicit-any': ['warn', {
        ignoreRestArgs: true,
        fixToUnknown: false
      }],
      // Allow unused vars with underscore prefix
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }],
      'react-hooks/rules-of-hooks': 'error', // Keep as error - this is critical
      'react-hooks/exhaustive-deps': 'warn',
      'no-useless-escape': 'warn',
      // Disable problematic rules for advanced components
      'react-refresh/only-export-components': ['warn', {
        allowConstantExport: true,
        allowExportNames: ['config', 'metadata', 'generateMetadata']
      }],
    },
  },
  // Override rules for test files
  {
    files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // Override rules for advanced/utility components
  {
    files: ['**/advanced/**/*.{ts,tsx}', '**/ui/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // Override rules for service files (allow any for error handling)
  {
    files: ['**/services/**/*.{ts,tsx}', '**/stores/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': ['warn', {
        ignoreRestArgs: true,
        fixToUnknown: false
      }],
    },
  },
)

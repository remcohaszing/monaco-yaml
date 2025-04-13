import config from '@remcohaszing/eslint'

export default [
  ...config,
  { ignores: ['**/*.json'] },
  {
    rules: {
      'import-x/no-extraneous-dependencies': 'off',
      'jsdoc/require-jsdoc': 'off',
      'n/no-extraneous-import': 'off',
      'unicorn/prefer-global-this': 'off'
    }
  }
]

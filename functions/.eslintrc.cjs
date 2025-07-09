module.exports = {
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    'google',
  ],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script',
  },
  rules: {
    // Allow reasonable line length
    'max-len': ['error', { code: 150, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreComments: true }],

    // JSDoc not strictly required for project scripts
    'require-jsdoc': 'off',
    'brace-style': 'off',
    'no-prototype-builtins': 'off',
    'no-dupe-else-if': 'off',
    'no-useless-escape': 'off',

    // Ignore unused vars that start with _ or imported helpers not used yet
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
}; 
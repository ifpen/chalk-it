module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  globals: {
    angular: 'readonly',
    $: 'readonly',
    swal: 'readonly',
    jQuery: 'readonly',
  },
  ignorePatterns: ['thirdparty/**', 'source/kernel/datanodes/plugins/thirdparty/**', '**/*.spec.js', '**/*.test.js'],
  extends: 'eslint:recommended',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    'no-undef': 'error',
    'no-unused-vars': ['warn', { vars: 'all', args: 'none' }],
    indent: ['error', 2, { SwitchCase: 1 }],
    // 'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
    semi: ['error', 'always'],
  },
};

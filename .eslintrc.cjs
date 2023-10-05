module.exports = {
   extends: ['eslint:recommended', 'eslint:recommended', 'plugin:@typescript-eslint/recommended'],
   parser: '@typescript-eslint/parser',
   plugins: ['@typescript-eslint'],
   root: true,
   rules: {
      'jsx-a11y/heading-has-content': 'off',
   },
};

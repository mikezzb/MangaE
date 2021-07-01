module.exports = {
  root: true,
  extends: '@react-native-community',
  rules: {
    'indent': ['error', 2, { SwitchCase: 1 }],
    'no-console': 0,
    'prettier/prettier': 0,
    'react-hooks/exhaustive-deps': 0,
    'react-native/no-inline-styles': 0,
    'arrow-parens': ['error', 'as-needed'],
    'brace-style': ['error', 'stroustrup'],
    'object-curly-spacing': ['error', 'always'],
    'quote-props': ['error', 'consistent-as-needed'],
    'linebreak-style': 0,
    'no-bitwise': 0,
    'no-alert': 0,
  },
};

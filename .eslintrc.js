module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ["plugin:vue/essential"],
  rules: {
    "indent": ["error", 2],
    "no-console": "off",
    "no-debugger": "off",
    "linebreak-style": "off",
    "endOfLine": "off"
  },
  parserOptions: {
    parser: "babel-eslint"
  }
};

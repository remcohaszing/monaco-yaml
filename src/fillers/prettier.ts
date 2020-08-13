const prettier = require('prettier/standalone');
const parser = require('prettier/parser-yaml');

export default {
  format(text: string, options) {
    prettier.format(text, Object.assign(options, { plugins: [parser] }));
  },
};

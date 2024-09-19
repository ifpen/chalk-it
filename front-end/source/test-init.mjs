import jsdom from 'jsdom-global';
jsdom();
global.navigator = {
  userAgent: 'node.js',
};

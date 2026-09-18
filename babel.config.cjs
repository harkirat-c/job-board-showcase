module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' }, modules: false }],
    ['@babel/preset-react', { runtime: 'automatic' }],
  ],
  plugins: [
    './babel-plugin-transform-import-meta-env.cjs',
  ],
};

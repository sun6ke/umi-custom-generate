
export default [
  {
    cjs: 'babel',
  },
  {
    entry: 'ui/index.js',
    umd: {
      name: 'umi-pro',
      minFile: false,
    },
  },
];

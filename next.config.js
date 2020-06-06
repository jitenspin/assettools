const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  assetPrefix: isProd ? '/assettools' : '',
  env: {
    BASE_URL: isProd ? '/assettools' : '',
  },
};

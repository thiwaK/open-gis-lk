const autoprefixer = require('autoprefixer');
const postcssImport = require('postcss-import');

module.exports = {
  plugins: [
    process.env.HUGO_ENVIRONMENT !== 'development' ? autoprefixer() : null,

    // postcssImport({
    //   path: ['public/css'],
    // }),
  ].filter(Boolean), 

  // map: process.env.HUGO_ENVIRONMENT === 'development' ? {
  //   inline: false,
  //   annotation: false,
  // } : false,
};

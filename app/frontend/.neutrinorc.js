module.exports = {
  options: {
    output: "../static",
  },
  // TODO: It's better to write HTML and other files in different directories
  output: {
    publicPath: "/static/",
  },
  use: [
    '@neutrinojs/airbnb',
    [
      '@neutrinojs/react',
      {
        hot: false,
        html: {
          title: 'mypy Playground',
          bodyHtmlSnippet: '<script id="context" type="application/json">{% raw context %}</script>',
        },
        publicPath: "/static/"
      }
    ],
    '@neutrinojs/jest',
    (neutrino) => {
      neutrino.config.watchOptions({
        poll: 1000,
      });
      if (neutrino.options.command === 'start') {
        neutrino.config.devServer.hot = false;
        neutrino.config.devServer.clear();
      }
    },
  ]
};

const airbnb = require('@neutrinojs/airbnb');
const react = require('@neutrinojs/react');
const jest = require('@neutrinojs/jest');

module.exports = {
  options: {
    output: "../static",
  },
  // TODO: It's better to write HTML and other files in different directories
  output: {
    publicPath: "/static/",
  },
  use: [
    airbnb({
      eslint: {
        rules: {
          'react/prop-types': 'off',
        }
      }
    }),
    react({
      hot: false,
      html: {
        title: 'mypy Playground',
        bodyHtmlSnippet: '<script id="context" type="application/json">{% raw context %}</script>',
      },
      publicPath: "/static/"
    }),
    jest(),
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

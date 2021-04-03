const airbnb = require('@neutrinojs/airbnb');
const react = require('@neutrinojs/react');
const jest = require('@neutrinojs/jest');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

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
        // Custom template based on @neutrinojs/html-template/template.ejs
        // for injecting additional context using the <script> element.
        template: 'src/template.ejs',//require.resolve(''),
        title: 'mypy Playground',
      },
      publicPath: "/static/"
    }),
    jest(),
    // See https://github.com/neutrinojs/neutrino/blob/master/docs/webpack-chain.md
    // for how to customze Neutrino and webpack configuration.
    (neutrino) => {
      neutrino.config
      .when(
        process.env.NODE_ENV === 'production',
        (config) => config.plugin("analyzer").use(BundleAnalyzerPlugin, [{
          analyzerMode: "static",
          generateStatsFile: true,
          openAnalyzer: false,
          reportFilename: "../frontend/analyze/report.html",
          statsFilename: "../frontend/analyze/stats.json",
        }])
      );
    }
  ]
};

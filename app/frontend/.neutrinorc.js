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
        // Custom template based on @neutrinojs/html-template/template.ejs
        // for injecting additional context using the <script> element.
        template: 'src/template.ejs',//require.resolve(''),
        title: 'mypy Playground',
      },
      publicPath: "/static/"
    }),
    jest(),
  ]
};

require.config({
  baseUrl:'/js/',
  paths: {

    jquery: 'lib/jquery',
    underscore: 'lib/underscore',
    backbone: 'lib/backbone',

    handlebars: 'lib/handlebars-1.0.0.beta.6',
    text: 'lib/require/text',
  }
});

require(['require', 'app', 'underscore', 'backbone', 'handlebars'], function(require, App) {
  window.app = App.initialize();
});

require.config({
  baseUrl:'/js/',
  paths: {
    jquery: 'lib/jquery-1.7.1',
    bootstrap: 'lib/bootstrap',
    underscore: 'lib/underscore',
    backbone: 'lib/backbone',

    handlebars: 'lib/handlebars-1.0.0.beta.6',
    text: 'lib/require/text',
    order: 'lib/require/order'
  }
});

require([
        'require',
        'app',
        'order!jquery',
        'order!bootstrap',
        'order!underscore',
        'order!backbone',
        'handlebars'], function(require, App) {
  window.app = App.initialize();
});

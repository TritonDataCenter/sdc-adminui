module.exports = {
  bootstrap: function() {
    jQuery(function($) {
      var Application = require('app');

      window.$a = {}
      window.$a.app = new Application();

      Backbone.history.start({pushState: true});
    });
  }
}

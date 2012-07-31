module.exports = {
  bootstrap: function() {
    $(function($) {
      var App = require('app');
      window.$a = new App();
      Backbone.history.start({pushState:true});
    });
  }
}

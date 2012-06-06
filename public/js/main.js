module.exports = {
  bootstrap: function() {
    $(function($) {
      var App = require('app');
      window.adminui = new App();
      Backbone.history.start({pushState:true});
    });
  }
}

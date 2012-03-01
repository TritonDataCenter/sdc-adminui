module.exports = {
  bootstrap: function() {
    $(function($) {
      var App = require('app');
      new App();
      Backbone.history.start({pushState:true});
    })
  }
}

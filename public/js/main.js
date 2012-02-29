ADMINUI = {
  Views: {},
  Models: {},
  Collections: {}
};

jQuery(function($) {
  ADMINUI.instance = new ADMINUI.App();
  Backbone.history.start({pushState:true});
})

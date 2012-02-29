/***
 * Events triggered
 * ================
 * - signout
 **/
ADMINUI.Views.Topbar = (function() {
  'use strict'

  return Backbone.View.extend({
    events: {
      'click a[data-trigger=signout]': 'signout'
    },

    initialize: function(options) {
      _.bindAll(this.focusSearch);
    },

    focusSearch: function() {
      this.$('.search-query').val('').focus();
    },

    signout: function() {
      this.trigger("signout");
    }
  });
})();

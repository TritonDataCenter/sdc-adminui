/***
 * Events triggered
 * ================
 * - signout
 **/

'use strict'

var Topbar = module.exports = Backbone.View.extend({
  template: Handlebars.compile($("#template-topbar").html()),
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
  },
  render: function() {
    this.$el.append(this.template());
    return this;
  }
});

/**
 * views/app
 *
 * This module manages the layout for the standard two pane view
 *
 *          |                           |
 * sidebar  |          content          |
 *          |                           |
 *          |                           |
 */
define(function(require) {
  var _ = require('underscore'),
    Backbone = require('backbone'),
    template = require('text!tpl/app.html');

  var DashboardView = require('views/dashboard');
  var SidebarView = Backbone.View.extend({
    events: {
      'click li>a':'select'
    },
    select: function(e) {
      e.preventDefault();
      console.log(e);
      return false;
    }
  });

  return Backbone.View.extend({
    template: Handlebars.compile(template),

    initialize: function(options) {
      _.bindAll(this);
      options = options || {};

      this.$el.html(this.template);

      this.sidebarView = options.sidebarView || new SidebarView({el: this.$("#sidebar")});
      this.contentView = options.contentView || new DashboardView();
    },

    render: function() {
      this.$("#content").html(this.contentView.render().el);

      return this;
    }
  });

});

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

  var SidebarView = require('views/sidebar');
  var DashboardView = require('views/dashboard');

  return Backbone.View.extend({
    template: Handlebars.compile(template),

    initialize: function(options) {
      _.bindAll(this);
      options = options || {};

      this.$el.html(this.template);

      this.sidebarView = options.sidebarView || new SidebarView({el: this.$("#sidebar")});
      this.sidebarView.on('sidebar:selected', this.changeView);

      this.changeView(options.contentView || 'dashboard')
    },

    changeView: function(viewname) {
      var self = this;

      require([['views', viewname].join('/')], function(viewModule) {
        var newView = new viewModule;

        if (self.contentView) {
          self.contentView.remove();
        }

        self.contentView = newView;
        self.render();

        Backbone.history.navigate(newView.name);
      });
    },

    render: function() {
      if (this.contentView) {
        this.$("#content").html(this.contentView.render().el);
        this.sidebarView.highlight(this.contentView.name);
      }

      return this;
    }
  });

});

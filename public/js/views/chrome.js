/**
 * views/chrome
 *
 * This module manages the Chrome(layout)
 * Providing a two pane layout
 *
 *          |                           |
 * sidebar  |          content          |
 *          |                           |
 *          |                           |
 */
define(function(require) {
  var _ = require('underscore'),
    Backbone = require('backbone'),
    template = require('text!tpl/chrome.html');

  var SidebarView = require('views/sidebar');


  var views = {
    'dashboard': require('views/dashboard'),
    'machines': require('views/machines'),
    'users' : require('views/users')
  };

  return Backbone.View.extend({
    template: Handlebars.compile(template),

    initialize: function(options) {
      _.bindAll(this);
      var self = this;

      options = options || {};

      this.$el.html(this.template);

      this.sidebarView = options.sidebarView || new SidebarView({el: this.$("#sidebar")});
      this.sidebarView.on('sidebar:selected', function(viewname) {
        var view = views[viewname];
        self.changeView(view);
      });

      this.changeView(views[options.contentView || 'dashboard']);
    },

    changeView: function(viewModule) {
      var newView = new viewModule;

      if (this.contentView) {
        this.contentView.remove();
      }

      this.contentView = newView;
      this.render();

      Backbone.history.navigate(newView.name);
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

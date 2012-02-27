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
  var TopbarView = require('views/topbar');

  var views = {
    'dashboard': require('views/dashboard'),
    'machines': require('views/machines'),
    'users' : require('views/users')
  };

  return Backbone.View.extend({
    template: Handlebars.compile(template),

    initialize: function(options) {
      _.bindAll(this, 'render', 'presentView');

      var self = this;

      this.options = options || {};

      this.dispatcher = options.dispatcher;
      if (typeof(options.contentView) === undefined) {
        options.contentView = 'dashboard'
      }
    },

    presentView: function(viewModule) {
      if (typeof(viewModule) == 'string') {
        viewModule = views[viewModule];
      }

      if (this.contentView) {
        this.contentView.remove();
      }

      this.contentView = new viewModule

      this.$("#content").html(this.contentView.render().el)
      this.sidebarView.highlight(this.contentView.name);

      if (typeof(this.contentView.focus) === 'function') {
        this.contentView.focus();
      }

      console.log("PresentView Done");
      Backbone.history.navigate(this.contentView.name);
    },

    render: function() {
      this.$el.html(this.template);

      this.topbarView = new TopbarView({el: this.$("#topnav")});
      this.topbarView.on('signout', function(e) {
        this.dispatcher.trigger('signout');
      }, this);

      this.sidebarView = new SidebarView({el: this.$("#sidebar")});
      this.sidebarView.bind('sidebar:selected', this.presentView);
      return this;
    }
  });

});

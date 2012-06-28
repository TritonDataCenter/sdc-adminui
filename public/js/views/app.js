/**
 * views/chrome
 *
 * This module manages the Layout & Pane for
 * the application
 *
 * -------------------------------------+
 *        TOP  BAR                      |
 * -------------------------------------+
 *          |                           |
 * sidebar  |          content          |
 *          |                           |
 *          |                           |
*/


var Topbar = require('views/topbar');
var Sidebar = require('views/sidebar');
var BaseView = require('views/base');

var AppView = module.exports = BaseView.extend({

  template: 'chrome',

  appEvents: {
    'hide': 'hideApp'
  },

  hideApp: function() {
    this.$el.hide();
  },

  initialize: function(options) {
    _.bindAll(this, 'render', 'presentView');

    var self = this;
    this.options = options || {};
  },

  presentView: function(viewName, args) {
    if (typeof(viewName) == 'undefined')
      return;

    var viewModule;
    if (typeof(viewName) == 'string')
      viewModule = require(_.str.sprintf('views/%s', viewName));

    if (this.contentView) {
      if (typeof(this.contentView.viewWillDisappear) === 'function') {
        this.contentView.viewWillDisappear.call(this.contentView);
      }

      this.contentView.remove();

      if (typeof(this.contentView.viewDidDisappear) === 'function') {
        this.contentView.viewDidDisappear.call(this.contentView);
      }
    }

    var view = this.contentView = new viewModule(args);

    (typeof(view.viewWillAppear) === 'function') && this.contentView.viewWillAppear.call(this.contentView);

    this.$("#content").html(this.contentView.render().el);

    if (typeof(this.contentView.sidebar) === 'string') {
      this.sidebarView.highlight(this.contentView.sidebar);
    } else {
      this.sidebarView.highlight(this.contentView.name);
    }

    if (typeof(this.contentView.viewDidAppear) === 'function') {
      this.contentView.viewDidAppear.call(this.contentView);
    }

    if (typeof(this.contentView.uri) === 'function') {
      Backbone.history.navigate(this.contentView.uri());
    } else if (typeof(this.contentView.uri) === 'string') {
      Backbone.history.navigate(this.contentView.uri);
    } else {
      Backbone.history.navigate(this.contentView.name);
    }
  },

  render: function() {
    this.$el.html(this.template());

    this.topbarView = new Topbar({ el: this.$("#topbar") });

    this.sidebarView = new Sidebar({el: this.$("#sidebar")});
    this.sidebarView.bind('sidebar:selected', this.presentView);

    this.topbarView.render();
    this.sidebarView.render();

    var indicator = this.$('.network-activity-indicator');
    indicator.hide();
    indicator.hide().ajaxStart(function() {
      indicator.fadeIn(100);
    });
    indicator.ajaxStop(function() {
      indicator.fadeOut(100);
    });
    return this;
  }
});

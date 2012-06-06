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
    _.bindAll(this, 'render', 'presentView', 'onKeypress');

    var self = this;

    this.options = options || {};

    $(document).bind('keypress', this.onKeypress);
  },

  onKeypress: function(e) {
    var code = (e.charCode || e.keyChar);

    if (e.charCode == 47) {
      this.topbarView.focusSearch();
    }
  },

  presentView: function(viewModule) {
    if (typeof(viewModule) == 'undefined')
      return;

    if (typeof(viewModule) == 'string')
      viewModule = require(_.str.sprintf('views/%s', viewModule));

    if (this.contentView) {
      this.contentView.remove();
    }

    this.contentView = new viewModule;

    this.$("#content").html(this.contentView.render().el)
    this.sidebarView.highlight(this.contentView.name);

    if (typeof(this.contentView.focus) === 'function') {
      this.contentView.focus();
    }

    console.log("PresentView Done");
    Backbone.history.navigate(this.contentView.name);
  },

  render: function() {
    this.$el.html(this.template());

    this.topbarView = new Topbar({ el: this.$("#topbar") });
    this.topbarView.on('signout', function(e) {
      this.dispatcher.trigger('signout');
    }, this);


    this.sidebarView = new Sidebar({el: this.$("#sidebar")});
    this.sidebarView.bind('sidebar:selected', this.presentView);

    this.topbarView.render();
    this.sidebarView.render();
    return this;
  }
});

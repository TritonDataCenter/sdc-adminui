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


(function(ADMINUI) {
  var AppView = Backbone.View.extend({

    template: Handlebars.compile($('#template-chrome').html()),

    initialize: function(options) {
      _.bindAll(this, 'render', 'presentView', 'onKeypress');

      var self = this;

      this.options = options || {};
      this.dispatcher = options.dispatcher;

      this.views = {
        'dashboard': ADMINUI.Views.Dashboard,
        'machines': ADMINUI.Views.Machines,
        'users': ADMINUI.Views.Users
      };

      if (typeof(options.contentView) === 'undefined') {
        options.contentView = 'dashboard'
      }

      $(document).bind('keypress', this.onKeypress);
    },

    onKeypress: function(e) {
      var code = e.charCode || e.keyChar;

      if (e.charCode == 47) {
        this.topbarView.focusSearch();
      }
    },

    presentView: function(viewModule) {
      if (typeof(viewModule) == 'undefined')
        return;

      if (typeof(viewModule) == 'string')
        viewModule = this.views[viewModule];

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
      this.$el.html(this.template);

      this.topbarView = new ADMINUI.Views.Topbar({ el: this.$("#topnav") });
      this.topbarView.on('signout', function(e) {
        this.dispatcher.trigger('signout');
      }, this);

      this.sidebarView = new ADMINUI.Views.Sidebar({el: this.$("#sidebar")});
      this.sidebarView.bind('sidebar:selected', this.presentView);

      return this;
    }
  });

  ADMINUI.Views.App = AppView;

})(ADMINUI);

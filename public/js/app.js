_.str = require('lib/underscore.string');
(function() {
  /* Extend jQuery with functions for PUT and DELETE requests. */

  function _ajax_request(url, data, callback, type, method) {
      if (jQuery.isFunction(data)) {
          callback = data;
          data = {};
      }
      return jQuery.ajax({
          type: method,
          url: url,
          data: data,
          success: callback,
          dataType: type
          });
  }

  jQuery.extend({
      put: function(url, data, callback, type) {
          return _ajax_request(url, data, callback, type, 'PUT');
      },
      delete_: function(url, data, callback, type) {
          return _ajax_request(url, data, callback, type, 'DELETE');
      }
  });
})();
window.$a = {};

var User = require('models/user');
var AppView = require('views/app');
var SigninView = require('views/signin');

var BaseView = require('views/base');

var eventBus = window.$a.eventBus = _.extend(Backbone.Events, {});

// Attach eventBus to BaseView prototype
BaseView.prototype.eventBus = eventBus;

module.exports = Backbone.Router.extend({

  initialize: function(options) {

    // holds the state of the currently logged in user
    this.user = new User;

    // The current root view being presented
    this.view = null;

    // The dom element in which the root views are drawn to
    this.container = $("#chrome");

    if (! this.view) {
      this.view = new AppView();
      this.container.html(this.view.render().el);
    }

    this.eventBus = eventBus;
    this.eventBus.bind('signout', function() {
      this.user.signout();
    }, this);

    this.eventBus.on('wants-view', function(view, args) {
      this.view.presentView(view, args);
    }, this);
  },

  routes: {
    'vms/:uuid': 'showVm',
    'servers/:uuid': 'showServer',
    '*default': 'defaultAction',
  },

  defaultAction: function(page) {
    console.log('[route] defaultAction:'+page)
    page = page || 'dashboard';
    this.view.presentView(page);
  },

  showVm: function(uuid) {
    console.log('[route] showVm:'+uuid)
    this.view.presentView('vm', { uuid: uuid });
  },

  showServer: function(uuid) {
    console.log('[route] showServer:'+uuid)
    this.view.presentView('server', { uuid: uuid });
  },

  showSignin: function() {
    this.view = new SigninView({ model: this.user });

    this.container.html(this.view.render().el);
    this.view.focus();
  }
});

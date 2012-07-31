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

var eventBus = _.extend(Backbone.Events, {});

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

    this.eventBus = eventBus;
    this.eventBus.bind('signout', function() {
      this.user.signout();
    }, this);

    this.chromeInitialized = false;

    this.eventBus.on('wants-view', function(view, args) {
      this.view.presentView(view, args);
    }, this);
  },

  initChrome: function() {
    if (this.chromeInitialized === false) {
      this.view = new AppView({ user: this.user });
      this.container.html(this.view.render().el);
      this.chromeInitialized = true;
    }
  },

  routes: {
    'signin': 'showSignin',
    'vms': 'showVms',
    'vms/:uuid': 'showVm',
    'servers/:uuid': 'showServer',
    '*default': 'defaultAction',
  },

  defaultAction: function(page) {
    console.log('[route] defaultAction:'+page)
    page = page || 'dashboard';
    this.initChrome();
    this.view.presentView(page);
  },

  showVms: function() {
    this.initChrome();
    this.view.presentView('vms');
  },

  showVm: function(uuid) {
    console.log('[route] showVm:'+uuid)
    this.initChrome();
    this.view.presentView('vm', { uuid: uuid });
  },

  showServer: function(uuid) {
    console.log('[route] showServer:'+uuid)
    this.initChrome();
    this.view.presentView('server', { uuid: uuid });
  },

  showSignin: function() {
    console.log('[route] showSignin');
    this.view = new SigninView({ model: this.user });

    this.user.on('change:token', function(user) {
      if (user.get('token') !== null) {
        $.ajaxSetup({ headers:{'x-adminui-token': user.get('token')} });
        this.showVms();
      }
    }, this);

    this.container.html(this.view.render().el);
    this.view.focus();
  }
});

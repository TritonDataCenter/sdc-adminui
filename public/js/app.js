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

var PING_INTERVAL = 2*60*1000

var User = require('models/user');
var AppView = require('views/app');
var SigninView = require('views/signin');

var BaseView = require('views/base');

var eventBus = _.extend(Backbone.Events, {});

// Attach eventBus to BaseView prototype
BaseView.prototype.eventBus = eventBus;

module.exports = Backbone.Router.extend({

  initialize: function(options) {
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


    // holds the state of the currently logged in user
    this.user = new User;

    this.user.on('change:token', function(user) {
      var token = user.get('token');
      window.sessionStorage.setItem('api-token', token);
      if (token !== null) {
        $.ajaxSetup({ headers:{'x-adminui-token': token} });

        if (this.chromeInitialized === false) {
          if (typeof(Backbone.history.fragment) !== 'undefined') {
            Backbone.history.loadUrl( Backbone.history.fragment )
          } else {
            this.showVms();
          }
        }
      }
    }, this);

    var self = this;
    $(document).ajaxError(function(e, xhr, settings, exception) {
      if (xhr.status == 403) {
        self.showSignin.call(self);
        return;
      }

      if (xhr.status == 409) {
        console.log('409 Conflict');
        console.log(xhr.responseText);
        return;
      }
    });

    this.user.set('token', window.sessionStorage.getItem('api-token'));

    setInterval(function() {
      $.get('/_/ping', function() {
        console.log('.');
      });
    }, PING_INTERVAL);
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
    this.chromeInitialized = false;

    this.container.html(this.view.render().el);
    this.view.focus();
  }
});

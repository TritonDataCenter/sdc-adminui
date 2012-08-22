define(['jquery',
  'underscore',
  'models/user',
  'ping',
  'views/app',
  'views/signin',
  'views/base'], function($, _, User, Pinger, AppView, SigninView, BaseView) {
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

  $.extend({
    put: function(url, data, callback, type) {
      return _ajax_request(url, data, callback, type, 'PUT');
    },
    delete_: function(url, data, callback, type) {
      return _ajax_request(url, data, callback, type, 'DELETE');
    }
  });


  var eventBus = _.extend(Backbone.Events, {});

  // Attach eventBus to BaseView prototype
  BaseView.prototype.eventBus = eventBus;

  return Backbone.Router.extend({

    initialize: function(options) {
      _.bindAll(this);

      // The dom element in which the root views are drawn to
      this.container = $("#chrome");

      // this.sock = new SockJS(window.location.origin + '/!/');

      // this.sock.onopen = function() {
      //   console.log('socket open');
      // };

      // this.sock.onmessage = function(e) {
      //   console.log('message', e.data);
      // };

      // this.sock.onclose = function() {
      //   console.log('close');
      // };

      // The current root view being presented
      this.view = null;

      this.eventBus = eventBus;

      this.chromeInitialized = false;

      this.eventBus.on('wants-view', function(view, args) {
        this.view.presentView(view, args);
      }, this);

      this.eventBus.on('signout', this.signout);

      // holds the state of the currently logged in user
      this.user = new User();
      this.user.on('change:token', function(user) {
        var token = user.get('token');

        if (token === null) {
          window.sessionStorage.removeItem('api-token');
          $.ajaxSetup({ headers:{} });
        } else {
          window.sessionStorage.setItem('api-token', token);
          $.ajaxSetup({ headers:{'x-adminui-token': token} });

          if (typeof(Backbone.history.fragment) !== 'undefined') {
            Backbone.history.loadUrl(Backbone.history.fragment);
          }
        }
      }, this);
      this.user.set('token', window.sessionStorage.getItem('api-token'));

      this.pinger = new Pinger();
      this.pinger.start();

      var self = this;
      $(document).ajaxError(function(e, xhr, settings, exception) {
        if (xhr.status == 403) {
          window.sessionStorage.removeItem('api-token');
          self.showSignin.call(self);
          return;
        }

        if (xhr.status == 409) {
          console.log('409 Conflict');
          console.log(xhr.responseText);
          return;
        }
      });
    },

    routes: {
      'signin': 'showSignin',
      'vms': 'showVms',
      'vms/:uuid': 'showVm',
      'monitoring': 'showMonitoring',
      'servers/:uuid': 'showServer',
      '*default': 'defaultAction'
    },

    initChrome: function() {
      if (this.chromeInitialized === false) {
        this.view = new AppView({ user: this.user });
        this.container.html(this.view.render().el);
        this.chromeInitialized = true;
      }
    },

    defaultAction: function(page) {
      console.log(_.str.sprintf('[route] defaultAction: %s', page));

      if (this.authenticated()) {
        page = page || 'dashboard';
        this.presentView(page);
      }
    },

    authenticated: function() {
      if (! this.user.authenticated()) {
        console.log('[app] not authenticated, showing sign in');
        this.showSignin();
        return false;
      } else {
        return true;
      }
    },

    showMonitoring: function() {
      if (this.authenticated())
        this.presentView('monitoring');
    },

    presentView: function(view, args) {
      this.initChrome();
      this.view.presentView(view, args);
    },

    showVms: function() {
      if (this.authenticated())
        this.presentView('vms');
    },

    showVm: function(uuid) {
      console.log(_.str.sprintf('[route] showVm: %s', uuid));
      if (this.authenticated())
        this.presentView('vm', { uuid: uuid });
    },

    showServer: function(uuid) {
      console.log(_.str.sprintf('[route] showServer: %s', uuid));
      if (this.authenticated()) {
        this.presentView('server', { uuid: uuid });
      }
    },

    showSignin: function() {
      console.log('[route] showSignin');
      this.view = new SigninView({ model: this.user });
      this.chromeInitialized = false;

      this.container.html(this.view.render().el);
      this.view.onShow();
    },

    signout: function() {
      this.user.set('token', null);
      this.showSignin();
    }
  });
});
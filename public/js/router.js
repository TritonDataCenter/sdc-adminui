define(function(require) {
	var Backbone = require('backbone');
	var Marionette = require('backbone.marionette');
	var User = require('models/user');
	var SigninView = require('views/signin');
	var AppView = require('views/app');

	return Backbone.Marionette.AppRouter.extend({
		routes: {
			'signin': 'showSignin',
			'vms': 'showVms',
			'vms/:uuid': 'showVm',
			'users/:uuid': 'showUser',

			'monitoring': 'showMonitoring',
			'servers/:uuid': 'showServer',
			'*default': 'defaultAction'
		},

		initialize: function(options) {
			_.bindAll(this);
      		this.app = options.app;
      	},

      	go: function() {
      		this.app.vent.on('showview', this.presentView, this);
      		this.app.vent.on('signout', this.signout, this);

	     	// holds the state of the currently logged in user
	     	this.app.user = this.user = new User();
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

	    presentView: function(viewName, args) {
	    	if (false === this.app.chrome.currentView instanceof AppView) {
	    		var appView = new AppView({user: this.user});
	    		this.app.chrome.show(appView);
	    	}

	    	require([_.str.sprintf('views/%s', viewName)], function(ViewClass) {
	    		var view = new ViewClass(args);

	    		this.applySidebar(view);
	    		this.applyUrl(view);
	    		this.app.chrome.currentView.content.show(view, args);
	    	}.bind(this));
	    },

	    applySidebar: function(view) {
	    	if (typeof(view.sidebar) === 'string') {
	    		this.app.vent.trigger('mainnav:highlight', view.sidebar);
	    	} else {
	    		this.app.vent.trigger('mainnav:highlight', view.name);
	    	}
	    },

	    applyUrl: function(view) {
	    	if (typeof(view.uri) === 'function') {
	    		Backbone.history.navigate(view.uri());
	    	} else if (typeof(view.uri) === 'string') {
	    		Backbone.history.navigate(view.uri);
	    	} else {
	    		Backbone.history.navigate(view.name);
	    	}
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

	    showUser: function(uuid) {
	    	if (this.authenticated()) {
	    		this.presentView('user', {uuid: uuid});
	    	}
	    },

	    showServer: function(uuid) {
	    	console.log(_.str.sprintf('[route] showServer: %s', uuid));
	    	if (this.authenticated()) {
	    		this.presentView('server', { uuid: uuid });
	    	}
	    },

	    showSignin: function() {
	    	console.log('[route] showSignin');
	    	var signinView = new SigninView({model: this.user});
	    	this.app.chrome.show(signinView);
	    },

	    signout: function() {
	    	this.user.set('token', null);
	    	this.showSignin();
	    }
	});
});
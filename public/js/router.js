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
            'image-import': 'showImageImport',
            'images/:uuid': 'showImage',
            'networks/:uuid': 'showNetwork',
            'packages/:uuid': 'showPackage',
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
            if (typeof(view.url) === 'function') {
                Backbone.history.navigate(view.url());
            } else if (typeof(view.url) === 'string') {
                Backbone.history.navigate(view.url);
            }
        },

        showVms: function() {
            if (this.authenticated())
                this.presentView('vms');
        },

        showNetwork: function(uuid) {
            if (this.authenticated())
                this.presentView('networks', { uuid: uuid });
        },

        showPackage: function(uuid) {
            if (this.authenticated())
                this.presentView('packages', { uuid: uuid });
        },

        showMonitoring: function() {
            if (this.authenticated())
                this.presentView('monitoring');
        },

        showImage: function(uuid) {
            if (this.authenticated())
                this.presentView('image', { uuid: uuid });
        },

        showImageImport: function() {
            if (this.authenticated())
                this.presentView('image-import');
        },

        showVm: function(uuid) {
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

        showAnalytics: function() {
            if (this.authenticated()) {
                this.presentView('analytics');
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

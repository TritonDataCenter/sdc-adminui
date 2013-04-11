var Backbone = require('backbone');
var Marionette = require('backbone.marionette');
var User = require('./models/user');
var SigninView = require('./views/signin');
var AppView = require('./views/app');

var Views = {
    'vms': require('./views/vms'),
    'vm': require('./views/vm'),
    'provision-vm': require('./views/provision-vm'),
    'servers': require('./views/servers'),
    'server': require('./views/server'),
    'dashboard': require('./views/dashboard'),
    'users': require('./views/users'),
    'user': require('./views/user'),
    'packages': require('./views/packages'),
    'images': require('./views/images'),
    'image': require('./views/image'),
    'image-import': require('./views/image-import'),
    'jobs': require('./views/jobs'),
    'networks': require('./views/networks')
};

module.exports = Backbone.Marionette.AppRouter.extend({
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

    didAuthenticate: function() {
        this.setupRequestToken();
        if (typeof(Backbone.history.fragment) !== 'undefined') {
            Backbone.history.loadUrl(Backbone.history.fragment);
        }
    },

    setupRequestToken: function() {
        $.ajaxSetup({
            headers: {'x-adminui-token': this.app.user.getToken()}
        });
    },

    go: function() {
        this.app.vent.on('showview', this.presentView, this);
        this.app.vent.on('signout', this.signout, this);

        // holds the state of the currently logged in user
        this.app.user = this.user = User.currentUser();
        this.app.user.on('authenticated', this.didAuthenticate);

        if (this.app.user.authenticated()) {
            this.setupRequestToken();
        }

        $(document).ajaxError(function(e, xhr, settings, exception) {
            if (xhr.status == 403) {
                this.signout();
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
        console.log('presentView: ' + viewName);

        var View = Views[viewName];

        if (typeof(View) === 'undefined') {
            throw "View not found: " + viewName;
        }

        var view = new View(args);

        this.applySidebar(view);
        this.applyUrl(view);
        this.app.chrome.currentView.content.show(view, args);
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
        this.user.signout();
        this.showSignin();
    }
});


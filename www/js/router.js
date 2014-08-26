"use strict";

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
var React = require('react');

var User = require('./models/user');
var SigninView = require('./views/signin');

var Chrome = require('./components/chrome');
var BBComponent = require('./components/bb.jsx');

var NotFoundView = require('./views/error/not-found');

var Components = {
    'alarm': require('./components/pages/alarm'),
    'alarms': require('./components/pages/alarms'),
    'user': require('./components/pages/user'),
    'images': require('./components/pages/images'),
    'manta/agents': require('./components/pages/manta/agents.jsx')
};

var Views = {
    'vms': require('./views/vms'),
    'vm': require('./views/vm'),
    'provision': require('./views/provision-vm'),
    'servers': require('./views/servers'),
    'server': require('./views/server'),

    'users': require('./views/users'),

    'packages': require('./views/packages'),
    'packages-form': require('./views/packages-form'),
    'package': require('./views/package'),

    'dashboard': require('./views/dashboard'),

    'settings': require('./views/settings'),
    'image': require('./views/image'),
    'image-import': require('./views/image-import'),

    'jobs': require('./views/jobs'),
    'job': require('./views/job'),

    'networking': require('./views/networking'),
    'networks': require('./views/networks'),
    'network': require('./views/network'),

    'nictag': require('./views/nictag'),

    'services': require('./views/services')
};

module.exports = Backbone.Marionette.AppRouter.extend({
    routes: {
        'signin': 'showSignin',
        'vms': 'showVms',
        'vms/:uuid': 'showVm',
        'users/:uuid': 'showUser',
        'users/:uuid/:tab': 'showUser',
        'users/:account/:uuid/:tab': 'showUser',
        'image-import': 'showImageImport',
        'images': 'showImages',
        'images/:uuid': 'showImage',
        'jobs/:uuid': 'showJob',
        'networks/:uuid': 'showNetwork',
        'packages/:uuid': 'showPackage',
        'servers/:uuid': 'showServer',
        'nictags/:uuid': 'showNicTag',
        'networking': 'showNetworking',
        'networking/:tab': 'showNetworking',
        'alarms/:user/:id': 'showAlarm',
        'manta/agents': 'showMantaAgents',
        '*default': 'defaultAction'
    },

    initialize: function(options) {
        this.app = options.app;
        this.state = options.state;
        this.app.user = this.app.user || User.currentUser();
        this.user = this.app.user;
    },

    didAuthenticate: function(data) {
        this.setupAuthenciatedState();
        this._checkAuth = true;
        if (typeof(Backbone.history.fragment) !== 'undefined') {
            Backbone.history.loadUrl(Backbone.history.fragment);
        }
    },

    setupAuthenciatedState: function() {
        $.ajaxSetup({
            timeout: 10000,
            headers: {'x-adminui-token': this.user.getToken()}
        });

        this.state.set({
            manta: this.user.getManta(),
            datacenter: this.user.getDatacenter()
        });
    },

    checkAuth: function() {
        if (this._checkAuth === true) {
            return true;
        } else {
            var self = this;
            var xhr = $.ajax({
                type: 'GET',
                timeout: 5000,
                url: '/api/auth',
                async: false,
                error: function(x, t, m) {
                    self.showSignin();
                    if (t==="timeout") {
                        window.alert("One more the services required for Authentication Timed out.");
                    }
                }
            });

            return (xhr.status === 200);
        }
    },

    renderTitle: function() {
        document.title = [ this.app.state.get('datacenter'), 'Operations Portal' ].join(' | ');
    },

    start: function() {
        this.listenTo(this.app.vent, 'showview', this.presentView, this);
        this.listenTo(this.app.vent, 'showcomponent', this.presentComponent, this);
        this.listenTo(this.app.vent, 'signout', this.signout, this);
        this.listenTo(this.app.vent, 'notfound', this.notFound, this);
        this.listenTo(this.app.user, 'authenticated', this.didAuthenticate, this);

        this.listenTo(this.app.state, 'change:datacenter', this.renderTitle);
        this.listenTo(this.app.state, 'change', this.initializeChrome, this);

        if (this.user.authenticated()) {
            this.setupAuthenciatedState();
        }

        var self = this;

        $(document).ajaxError(function(e, xhr, settings, exception) {
            if (xhr.status === 403) {
                self.signout();
            }
        });


        // enable selection
        $(document).on('click', '.selectable', function() {
            var range;

            if (document.selection) {
                range = document.body.createTextRange();
                range.moveToElementText(this);
                range.select();
            } else if (window.getSelection) {
                range = document.createRange();
                range.selectNode(this);
                window.getSelection().addRange(range);
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
            return this.checkAuth();
        }
    },

    initializeChrome: function() {
        console.info('Rendering State', this.state.toJSON());
        this.chrome = React.renderComponent(Chrome({
            content: this.state.get('content'),
            state: this.state
        }), document.body );
    },

    presentView: function(viewName, args) {
        console.log('showing view', viewName, args);
        var View = Views[viewName];

        if (typeof(View) === 'undefined') {
            this.notFound({ view: viewName, args: args });
            console.log("View not found: " + viewName);
            return;
        }

        var view = new View(args);
        var state = {};

        state['chrome.rootnav'] = true;
        state['chrome.content'] = BBComponent({view: view });
        state['chrome.fullwidth'] = (viewName === 'users' || viewName === 'user' || viewName === 'settings');
        state['localnav.active'] = view.sidebar || viewName;

        if (state['chrome.fullwidth'] === false) {
            state['rootnav.active'] = 'datacenter';
        } else {
            if (viewName === 'user' && args.user && args.user.get('uuid') === this.user.get('uuid')) {
                state['rootnav.active'] = 'current-user';
            } else {
                state['rootnav.active'] = view.sidebar || viewName;
            }
        }

        console.debug('app state change', state);
        this.state.set(state);

        if (typeof(view.url) === 'function') {
            this.changeUrl(view.url());
        } else if (typeof(view.url) === 'string') {
            this.changeUrl(view.url);
        }
    },

    changeUrl: function(url) {
       this.navigate(url);
    },

    presentComponent: function(compName, args) {
        args = args || {};
        var ComponentType = Components[compName];

        if (typeof(ComponentType) === 'undefined') {
            this.notFound({ view: ComponentType, args: args });
            console.log("Component not found: " + compName);
        } else {
            var component = new ComponentType(args);
            var state = {
                'chrome.content': component,
                'chrome.rootnav': true,
                'rootnav.active': ComponentType.sidebar,
                'localnav.active': ComponentType.sidebar
            };
            console.log(ComponentType.sidebar);

            state['chrome.fullwidth'] = (compName === 'users' || compName === 'alarm' || compName === 'user' || compName === 'settings');
            this.state.set(state);

            if (typeof(ComponentType.url) === 'function') {
                Backbone.history.navigate(ComponentType.url(args));
            } else if (typeof(ComponentType.url) === 'string') {
                Backbone.history.navigate(ComponentType.url);
            }
        }
    },

    notFound: function(args) {
        var view = new NotFoundView(args);
        this.state.set({
            'chrome.rootnav': true,
            'chrome.content': BBComponent({ view: view })
        });
    },


    showAlarm: function(user, id) {
        if (this.authenticated()) {
            this.presentComponent('alarm', {user: user, id: id});
        }
    },

    showAlarms: function(user) {
        if (this.authenticated()) {
            this.presentComponent('alarms', {user: user });
        }
    },

    showImages: function() {
        if (this.authenticated()) {
            this.presentComponent('images', {});
        }
    },

    showMantaAgents: function() {
        this.presentComponent('manta/agents');
    },

    showVms: function() {
        if (this.authenticated()) {
            this.presentView('vms');
        }
    },

    showNetworking: function(tab) {
        if (this.authenticated()) {
            this.presentView('networking', {tab: tab});
        }
    },

    showNetwork: function(uuid) {
        var self = this;
        if (this.authenticated()) {
            var Network = require('./models/network');
            var net = new Network({uuid: uuid});
            net.fetch().done(function() {
                self.presentView('network', { model: net });
            }).fail(function(xhr) {
                self.notFound({
                    view: 'networks',
                    args: {uuid: uuid},
                    xhr: xhr
                });
            });
        }
    },

    showNicTag: function(name) {
        var self = this;
        if (this.authenticated()) {
            var Nictag = require('./models/nictag');
            var nt = new Nictag({name: name});
            nt.fetch().done(function() {
                self.presentView('nictag', { model: nt });
            }).fail(function(xhr) {
                self.notFound({
                    view: 'nictag',
                    args: {name: name},
                    xhr: xhr
                });
            });
        }
    },


    showPackage: function(uuid) {
        var self = this;
        if (this.authenticated()) {
            var Package = require('./models/package');
            var p = new Package({uuid: uuid});
            p.fetch().done(function() {
                self.presentView('package', { model: p });
            }).fail(function(xhr) {
                self.notFound({
                    view: 'package',
                    args: {uuid: uuid},
                    xhr: xhr
                });
            });
        }
    },

    showImage: function(uuid) {
        var self = this;
        if (this.authenticated()) {
            var Img = require('./models/image');
            var img = new Img({uuid: uuid});
            img.fetch().done(function() {
                self.presentView('image', { image: img });
            }).fail(function(xhr) {
                self.notFound({
                    view: 'image',
                    args: {uuid: uuid},
                    xhr: xhr
                });
            });
        }
    },

    showJob: function(uuid) {
        var self = this;
        if (this.authenticated()) {
            var Job = require('./models/job');
            var job = new Job({uuid: uuid});
            job.fetch().done(function() {
                self.presentView('job', { model: job });
            }).fail(function(xhr) {
                self.notFound({
                    view: 'job',
                    args: {uuid: uuid},
                    xhr: xhr
                });
            });
        }
    },

    showImageImport: function() {
        if (this.authenticated()) {
            this.presentView('image-import');
        }
    },

    showVm: function(uuid) {
        var self = this;
        if (this.authenticated()) {
            var Vm = require('./models/vm');
            var vm = new Vm({uuid: uuid});
            vm.fetch().done(function() {
                self.presentView('vm', { vm: vm });
            }).fail(function(xhr) {
                self.notFound({
                    view: 'vm',
                    args: {uuid: uuid},
                    xhr: xhr
                });
            });
        }
    },

    showUser: function(account, user, tab) {
        if (this.authenticated()) {
            if (arguments.length === 1) {
                user = account;
                account = null;
                tab = null;
            } else if (account && user && !tab) {
                if (user.length !== '36') {
                    tab = user;
                    user = account;
                    account = null;
                }
            }
            var props = {};
            props.user = user;
            if (tab) {
                props.tab = tab;
            }
            if (account) {
                props.account = account;
            }

            console.log(_.str.sprintf('[route] showUser:', props));
            this.presentComponent('user', props);
        }
    },

    showServer: function(uuid) {
        console.log(_.str.sprintf('[route] showServer: %s', uuid));
        var self = this;
        if (this.authenticated()) {
            var Server = require('./models/server');
            var server = new Server({uuid: uuid});
            server.fetch().done(function() {
                self.presentView('server', { server: server });
            }).fail(function(xhr) {
                self.notFound({
                    view: 'server',
                    args: {uuid: uuid},
                    xhr: xhr
                });
            });
        }
    },

    showSignin: function() {
        console.log('[route] showSignin');
        var signinView = new SigninView({model: this.user});
        this.state.set({
            'chrome.content': new BBComponent({view: signinView}),
            'chrome.rootnav': false,
            'chrome.fullwidth': true
        });
    },

    signout: function() {
        this.user.signout();
        this.showSignin();
    }
});

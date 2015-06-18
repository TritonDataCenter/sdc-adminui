/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

"use strict";

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
var React = require('react');

var User = require('./models/user');
var Promise = require('promise');

var Chrome = React.createFactory(require('./components/chrome'));
var BBComponent = React.createFactory(require('./components/bb.jsx'));

var NotFoundView = require('./views/error/not-found');

var Components = {
    'signin': require('./components/pages/signin'),
    'alarm': require('./components/pages/alarm'),
    'alarms': require('./components/pages/alarms'),
    'vm': require('./components/pages/vm'),
    'vms': require('./components/pages/vms'),
    'settings': require('./components/pages/settings'),
    'user': require('./components/pages/user'),
    'images': require('./components/pages/images'),
    'manta/agents': require('./components/pages/manta/agents'),
    'dashboard': require('./components/pages/dashboard')
};

Object.keys(Components).forEach(function(k) {
    Components[k] = React.createFactory(Components[k]);
});

var Views = {
    'provision': require('./views/provision-vm'),
    'servers': require('./views/servers'),
    'server': require('./views/server'),

    'users': require('./views/users'),

    'packages': require('./views/packages'),
    'packages-form': require('./views/packages-form'),
    'package': require('./views/package'),

    'images-import': require('./views/images-import'),
    'image': require('./views/image'),

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
        'vms/:uuid(/)': 'showVm',
        'vms2/:uuid(/)': 'showVm2',
        'users/:uuid(/)': 'showUser',
        'users/:uuid/:tab(/)': 'showUser',
        'users/:account/:uuid/:tab(/)': 'showUser',
        'image-import': 'showImageImport',
        'images': 'showImages',
        'images/:uuid(/)': 'showImage',
        'jobs/:uuid(/)': 'showJob',
        'networks/:uuid(/)': 'showNetwork',
        'packages/:uuid(/)': 'showPackage',
        'servers/:uuid(/)': 'showServer',
        'nictags/:uuid(/)': 'showNicTag',
        'networking': 'showNetworking',
        'networking/:tab(/)': 'showNetworking',
        'alarms/:user/:id(/)': 'showAlarm',
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
            timeout: 30000,
            headers: {'x-adminui-token': this.user.getToken()}
        });

        this.state.set({
            manta: this.user.getManta(),
            datacenter: this.user.getDatacenter()
        });
    },

    checkAuth: function() {
        if (this._checkAuth === true) {
            return Promise.resolve(true);
        } else {
            var self = this;
            return new Promise(function(resolve, reject) {
                $.ajax({
                    type: 'GET',
                    timeout: 15000,
                    url: '/api/auth',
                }).fail(function(xhr, t, m) {
                    reject();
                    self.showSignin();
                    if (t==="timeout") {
                        window.alert("One more the services required for Authentication Timed out.");
                    }
                }).done(function() {
                    resolve();
                });
            });
        }
    },

    renderTitle: function(sectionTitle) {
        var title = ['Operations Portal' ];
        var datacenter = this.app.state.get('datacenter');
        if (datacenter && typeof(datacenter) === 'string') {
            title.unshift(datacenter);
        }
        if (sectionTitle && typeof(sectionTitle) === 'string') {
            title.unshift(sectionTitle);
        }
        document.title = title.join(' | ');
    },

    start: function() {
        this.listenTo(this.app.vent, 'showview', this.presentView, this);
        this.listenTo(this.app.vent, 'showcomponent', this.presentComponent, this);
        this.listenTo(this.app.vent, 'settitle', this.renderTitle, this);
        this.listenTo(this.app.vent, 'signout', this.signout, this);
        this.listenTo(this.app.vent, 'notfound', this.notFound, this);
        this.listenTo(this.app.user, 'authenticated', this.didAuthenticate, this);

        this.listenTo(this.app.state, 'change:datacenter', this.renderTitle, this);
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
        console.log(_.str.sprintf('[Router] defaultAction: %s', page));
        var self = this;

        this.authenticated().then(function() {
            page = page && self.sanitizePath(page) || 'dashboard';
            if (Components[page]) {
                self.presentComponent(page);
            } else {
                self.presentView(page);
            }
        });
    },

    authenticated: function() {
        if (! this.user.authenticated()) {
            console.log('[Router] not authenticated, showing sign in');
            this.showSignin();
            return Promise.reject('User not authenticated, showing sign in');
        } else {
            return this.checkAuth();
        }
    },

    initializeChrome: function() {
        console.info('[Router] Initialize Chrome', this.state.toJSON());
        this.chrome = React.render(Chrome({
            content: this.state.get('content'),
            state: this.state
        }), document.body );
    },

    presentView: function(viewName, args) {
        console.log('[app] showing view', viewName, args);
        var View = Views[viewName];

        if (typeof(View) === 'undefined') {
            this.notFound({ view: viewName, args: args });
            console.log("[app] view not found: " + viewName);
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

        this.renderTitle(null);
        console.debug('[app]', state);
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
        var ComponentClass = Components[compName];
        this.renderTitle(null);

        if (typeof(ComponentClass) === 'undefined') {
            this.notFound({ component: ComponentClass, args: args });
            console.log("[Router] Component not found: " + compName);
        } else {
            var component = new ComponentClass(args);
            var type = component.type;
            var state = {
                'chrome.content': component,
                'chrome.rootnav': true,
                'rootnav.active': type.sidebar,
                'localnav.active': type.sidebar
            };

            if (compName === 'users' || compName === 'alarm' || compName === 'user' || compName === 'settings') {
                state['chrome.fullwidth'] = true;
                state['rootnav.active'] = type.sidebar;
            } else {
                state['chrome.fullwidth'] = false;
                state['rootnav.active'] = 'datacenter';
            }


            this.state.set(state);
            console.log('[Router] presentComponent', component);

            if (typeof(type.url) === 'function') {
                Backbone.history.navigate(type.url(args));
            } else if (typeof(type.url) === 'string') {
                Backbone.history.navigate(type.url);
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


    showAlarm: function (user, id) {
        this.authenticated().then(function () {
            this.presentComponent('alarm', {user: user, id: id});
        }.bind(this));
    },

    showAlarms: function (user) {
        this.authenticated().then(function () {
            this.presentComponent('alarms', {user: user});
        }.bind(this));
    },

    showImages: function () {
        this.authenticated().then(function () {
            this.presentComponent('images', {});
        }.bind(this));
    },

    showMantaAgents: function () {
        this.authenticated().then(function () {
            this.presentComponent('manta/agents');
        }.bind(this));
    },

    showVms: function () {
        this.authenticated().then(function () {
            this.presentComponent('vms');
        }.bind(this));
    },

    showNetworking: function (tab) {
        this.authenticated().then(function () {
            this.presentView('networking', {tab: tab});
        }.bind(this));
    },

    showNetwork: function (uuid) {
        var self = this;
        this.authenticated().then(function () {
            var Network = require('./models/network');
            var net = new Network({uuid: uuid});
            net.fetch().done(function () {
                self.presentView('network', { model: net });
            }).fail(function (xhr) {
                self.notFound({
                    view: 'networks',
                    args: {uuid: uuid},
                    xhr: xhr
                });
            });
        });
    },

    showNicTag: function(name) {
        var self = this;
        this.authenticated().then(function() {
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
        }.bind(this));
    },


    showPackage: function(uuid) {
        var self = this;
        this.authenticated().then(function() {
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
        }.bind(this));
    },

    showImage: function(uuid) {
        var self = this;
        this.authenticated().then(function() {
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
        }.bind(this));
    },

    showJob: function(uuid) {
        var self = this;
        this.authenticated().then(function() {
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
        });
    },

    showImageImport: function() {
        this.authenticated().then(function() {
            this.presentView('image-import');
        }.bind(this));
    },

    showVm: function(uuid) {
        this.authenticated().then(function() {
            this.presentComponent('vm', {
                vmUuid: uuid,
                adminui: this.app
            });
        }.bind(this));
    },
    showUser: function(account, user, tab) {
        this.authenticated().then(function() {
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

            console.log(_.str.sprintf('[Router] showUser:', props));
            this.presentComponent('user', props);
        }.bind(this));
    },

    showServer: function(uuid) {
        console.log(_.str.sprintf('[Router] showServer: %s', uuid));
        var self = this;
        this.authenticated().then(function() {
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
        }.bind(this));
    },

    showSignin: function() {
        console.log('[Router] showSignin');
        // var signinView = new SigninView({model: this.user});
        var SigninComponent = Components['signin'];
        this.state.set({
            'chrome.content': SigninComponent({ userModel: this.user }),
            'chrome.rootnav': false,
            'chrome.fullwidth': true
        });
    },

    signout: function () {
        this.user.signout();
        this.showSignin();
    },
    sanitizePath: function (path) {
        // Be nice like apache and strip out any //my//foo//bar///blah
        path = path.replace(/\/\/+/g, '/');

        if (path.length > 1) {
            // Kill a trailing '?' || '/'
            var pathLength = path.length - 1;
            if (path.lastIndexOf('?') === pathLength || path.lastIndexOf('/') === pathLength) {
                path = path.substr(0, pathLength);
            }
        }
        
        return path;
    }
});

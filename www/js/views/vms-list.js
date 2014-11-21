/** @jsx React.DOM */

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

"use strict";

var _ = require('underscore');
var Backbone = require('backbone');
var ItemTemplate = require('../tpl/vms-list-item.hbs');
var adminui = require('../adminui');
var Vms = require('../models/vms');
var React = require('react');
var request = require('../request');
var Promise = require('promise');

var Images = require('../models/images');
var User = require('../models/user');
var Package = require('../models/package');

var JSONExport = React.createFactory(require('../components/json-export.jsx'));


var _getServerPromises = {};
function getServer(serverUuid) {
    var url = _.str.sprintf('/api/servers/%s', serverUuid);
    if (_getServerPromises[serverUuid]) {
        return _getServerPromises[serverUuid].p;
    } else {
        var r, p;
        p = new Promise(function(resolve, reject) {
            r = request.get(url).end(function(res) {
                if (res.ok) {
                    resolve(res.body);
                } else {
                    reject(res.body);
                }
            });
        });
        _getServerPromises[serverUuid] = {p: p, r: r};
        return _getServerPromises[serverUuid].p;
    }
}

var _getUserPromises = {};
function getUser(userUuid) {
    var url = _.str.sprintf('/api/users/%s', userUuid);
    if (_getUserPromises[userUuid]) {
        return _getUserPromises[userUuid].p;
    } else {
        var r = null;
        var p = new Promise(function(resolve, reject) {
            r = request.get(url).end(function(res) {
                if (res.ok) {
                    resolve(res.body);
                } else {
                    reject(res.body);
                }
            });
        });
        _getUserPromises[userUuid] = {p: p, r:r };
        return _getUserPromises[userUuid].p;
    }
}

var ServerName = React.createFactory(React.createClass({
    displayName: 'ServerNameLink',
    propTypes: {
        serverUuid: React.PropTypes.string
    },
    componentWillMount: function() {
        getServer(this.props.serverUuid).then(function(server) {
            this.setState({server: server});
        }.bind(this));
    },
    render: function() {
        if (!this.state || !this.state.server) {
            return null;
        }
        return <div className="server-name"><i className="fa fa-list"></i> <a href={'/servers/'+this.props.serverUuid} onClick={this.goToServer}>{this.state.server.hostname} </a></div>;;
    },
    goToServer: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        adminui.vent.trigger('showview', 'server', { uuid: this.props.serverUuid });
    },
}));

var ItemView = Backbone.Marionette.ItemView.extend({
    tagName: 'tr',
    template: ItemTemplate,

    events: {
        'click .alias a': 'navigateToVmDetails',
        'click a.owner-name': 'navigateToOwnerDetails',
        'click a.image-name': 'navigateToImageDetails'
    },

    initialize: function(options) {
        this.user = new User({uuid: options.model.get('owner_uuid')});
        this.pkg = new Package({uuid: options.model.get('billing_id')});
    },

    templateHelpers: {
        isDocker: function() {
            return this.docker === true || this.tags.JPC_tag === 'DockerHost';
        }
    },


    onShow: function() {
        var self = this;
        var user = this.user;
        var pkg = this.pkg;
        var vm = this.model;

        getUser(this.user.get('uuid')).done(function(user) {
            self.$('.owner-name').html(user.login);
            self.$('.owner-name').attr("href", "/users/" + user.uuid);
            if (user.company && user.company.length) {
                self.$('.owner-company').html(user.company);
                self.$('.owner-company-container').show();
            } else {
                self.$('.owner-company-container').hide();
            }
        });

        if (! (vm.get('package_name') && vm.get('package_version'))) {
            pkg.fetch().done(function() {
                self.$('.package-name').html(pkg.get('name'));
                self.$('.package-version').html(pkg.get('version'));
            });
        }
    },

    onRender: function() {
        this.$('.owner-company-container').hide();
        React.render(ServerName({serverUuid: this.model.get('server_uuid')}), this.$('.server').get(0));
    },
    onClose: function() {
        React.unmountComponentAtNode(this.$('.server').get(0));
    },


    serializeData: function() {
        var data = this.model.toJSON();
        data.image = this.images.get(data.image_uuid);
        if (data.image) {
            data.image = data.image.toJSON();
        }
        data.ips = data.nics.map(function(n) {
            return n.ip;
        });
        return data;
    },

    navigateToVmDetails: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        adminui.vent.trigger('showview', 'vm', { vm: this.model });
    },

    navigateToOwnerDetails: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        adminui.vent.trigger('showcomponent', 'user', { user: this.user });
    },
    navigateToImageDetails: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        adminui.router.showImage(this.model.get('image_uuid'));
    }
});

var VmsList = require('./composite').extend({
    itemView: ItemView,
    itemViewContainer: 'tbody',
    attributes: {
        'class':'vms-list'
    },

    events: {
        'click a.more': 'onNext',
        'click a.all': 'onAll',
        'click a.export': 'onExport'
    },

    collectionEvents: {
        'sync': 'onSync',
        'request': 'onRequest'
    },

    template: require('../tpl/vms-list.hbs'),
    emptyView: require('./empty').extend({
        loadingMessage: 'Loading Virtual Machines...',
        emptyMessage: 'No Virtual Machines found',
        columns: 4
    }),

    itemViewOptions: function() {
        return {
            emptyViewModel: this.collection
        };
    },

    initialize: function() {
        this.images = new Images();
        this._requests = [];
        this._requests.push(this.images.fetch().done(this.render));
        this.listenTo(this.collection, 'request', this.onRequest, this);
    },

    onBeforeItemAdded: function(iv) {
        iv.images = this.images;
        iv.usersCache = new Backbone.Collection();
    },

    onExport: function(e) {
        e.preventDefault();
        var vms = new Vms(null, {params: this.collection.params});
        var node = this.$('.export-container').get(0);
        vms.exportGroupedByCustomer().done(function(exported) {
            React.render(new JSONExport({
                description: "Virtual Machines grouped by owner",
                data: exported,
                onRequestHide: function() {
                    React.unmountComponentAtNode(node);
                }
            }), node);
        }.bind(this));
    },

    onNext: function() {
        this.next();
    },

    onAll: function() {
        this.collection.pagingParams.perPage = null;
        this._requests.push(this.collection.fetch({remove: false}));
    },

    onRender: function() {
        if (this.collection.length) {
            this.$('caption').css('visibility', 'visible');
        } else {
            this.$('caption').css('visibility', 'hidden');
        }
        this.onSync();
    },

    next: function() {
        if (this.collection.hasNext()) {
            this.collection.next();
            this._requests.push(this.collection.fetch({remove: false}));
        }
    },

    onRequest: function() {
        this.$('caption').css('visibility', 'hidden');
    },

    onSync: function() {
        if (! this.collection.objectCount) {
            this.$('.more').hide();
            this.$('.all').hide();
        } else {
            if (this.collection.objectCount === this.collection.length) {
                this.$('.more').hide();
                this.$('.all').hide();
            } else {
                this.$('.more').show();
                this.$('.all').show();
            }
        }

        this.$('caption').css('visibility', 'visible');
        this.$('.record-count').html(this.collection.objectCount);
        this.$('.current-count').html(this.collection.length);
    },
    onClose: function() {
        this._requests.map(function(r) {
            r.abort();


        });

        Object.keys(_getServerPromises).forEach(function(k) {
            _getServerPromises[k].r.abort();
        });

        Object.keys(_getUserPromises).forEach(function(k) {
            _getUserPromises[k].r.abort();
        });

        Object._getServerPromises = {};
        Object._getUserPromises = {};
    }
});


module.exports = VmsList;

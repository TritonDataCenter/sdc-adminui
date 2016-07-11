/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var adminui = require('../adminui');
var Services = require('../models/services');
var Model = require('../models/model');
var Collection = require('../models/collection');
var CollectionView = require('./collection');
var DEFAULT_TYPE = 'all';

var Instance = Model.extend({
    idAttribute: 'uuid',
    urlRoot: '/api/instances'
});

var Instances = Collection.extend({
    model: Instance,
    url: '/api/instances'
});

var Application = Model.extend({
    idAttribute: 'uuid',
    urlRoot: '/api/applications'
});

var Applications = Collection.extend({
    model: Application,
    url: '/api/applications',
    filterByType: function (type) {
        var applications = null;
        if (type !== DEFAULT_TYPE) {
            applications = this.filter(function (application) {
                return application.attributes.name.toLowerCase() === type;
            });
        }
        return applications && new Applications(applications) || this;
    }
});

var InstanceView = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/services-instance.hbs'),
    events: {
        'click a.vm': 'navigateToVm'
    },
    attributes: {
        'class': 'instance'
    },
    navigateToVm: function () {
        adminui.router.showVm(this.model.get('uuid'));
    },
    serializeData: function () {
        var data = this.model.toJSON();
        data.vm = data.type === 'vm';
        data.agent = data.type === 'agent';
        return data;
    },
    onRender: function () {
        var self = this;
        if (this.model.get('type') === 'vm') {
            $.get('/api/vms/' + this.model.get('uuid')).done(function (res) {
                self.$('.state').addClass(res.state).html(res.state);
                self.$('.ram').addClass(res.state).html(res.ram + ' MB');
            });
        }
    }
});

var InstancesView = CollectionView.extend({
    itemView: InstanceView
});

var ServicesListItemView = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/services-item.hbs'),
    attributes: {class: 'service'},
    initialize: function () {
        this.instances = new Instances();
    },
    onRender: function () {
        new InstancesView({
            el: this.$('.instances'),
            collection: this.instances
        });
        this.instances.params = {service_uuid: this.model.get('uuid')};
        this.instances.fetch({reset: true});
    }
});

var ServicesListView = CollectionView.extend({
    itemView: ServicesListItemView
});

var NoApplicationsView = Backbone.Marionette.ItemView.extend({
    template: function () {
        return _.template('<div class="zero-state">No services available.</div>');
    }
});

var ApplicationsListView = CollectionView.extend({
    itemView: Backbone.Marionette.ItemView.extend({
        template: require('../tpl/services-application.hbs'),
        attributes: {
            'class': 'application'
        },
        initialize: function () {
            this.services = new Services();
        },
        onRender: function () {
            var self = this;
            new ServicesListView({
                el: this.$('.services'),
                collection: this.services
            });
            this.services.params = {application_uuid: this.model.get('uuid')};
            this.services.fetch({reset: true, success: function (res) {
                self.$('.number-of-services').html(res.length);
            }});
        }
    }),
    emptyView: NoApplicationsView
});

var View = Backbone.Marionette.ItemView.extend({
    id: 'page-services',
    template: require('../tpl/services.hbs'),
    events: {
        'click a[data-service-type]': 'onChangeView'
    },
    name: 'services',
    url: function () {
        return '/services';
    },
    initialize: function () {
        this.applications = new Applications();
        this.type = DEFAULT_TYPE;
    },
    makeActive: function (type) {
        this.$('[data-service-type=' + type + ']').parent().addClass('active').siblings().removeClass('active');
    },
    onChangeView: function (e) {
        e.preventDefault();
        var newType = e.target.getAttribute('data-service-type');
        if (this.type !== newType) {
            this.type = newType;
            this.makeActive(newType);
            this.applicationsView.collection = this.applications.filterByType(newType);
            this.applicationsView.render();
        }
    },
    onRender: function () {
        adminui.vent.trigger('settitle', 'services');
        this.makeActive(DEFAULT_TYPE);

        this.applicationsView = new ApplicationsListView({
            el: this.$('.applications'),
            collection: this.applications
        });
        this.applications.fetch({reset: true});
    }
});

module.exports = View;

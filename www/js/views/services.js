/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
 */

var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var adminui = require('../adminui');
var Services = require('../models/services');
var Model = require('../models/model');
var Collection = require('../models/collection');
var CollectionView = require('./collection');

var TYPES = {
    default: 'all',
    vm: 'vm',
    agent: 'agent'
};

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
    url: '/api/applications'
});

Services = Services.extend({
    filterByType: function (type) {
        var services = null;
        if (type !== TYPES.default) {
            services = this.filter(function (service) {
                return service.attributes.type.toLowerCase() === type;
            });
        }
        return services && new this.constructor(services) || this;
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
        data.name = data.params && data.params.alias || data.uuid;
        return data;
    },
    onRender: function () {
        var self = this;
        if (this.model.get('type') === TYPES.vm) {
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
    events: {
        'click a.service-link': 'navigateToService'
    },
    attributes: {class: 'service'},
    initialize: function () {
        this.instances = new Instances();
    },
    navigateToService: function () {
        adminui.router.showService(this.model.get('uuid'));
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

var NoServicesView = Backbone.Marionette.ItemView.extend({
    template: function () {
        return _.template('<div class="zero-state">No services available.</div>');
    }
});

var ServicesListView = CollectionView.extend({
    itemView: ServicesListItemView,
    emptyView: NoServicesView
});

var View = Backbone.Marionette.ItemView.extend({
    id: 'page-services',
    template: require('../tpl/services.hbs'),
    events: {
        'click li[data-section-type]': 'onChangeSection',
        'click li[service-filter-type]': 'onChangeServiceFilter'
    },
    name: 'services',
    url: function () {
        return '/services';
    },
    initialize: function () {
        this.services = new Services();
        this.sectionServices = this.services;
        this.applications = new Applications();
        this.sectionType = TYPES.default;
        this.filterType = TYPES.default;
    },
    makeActive: function (selector) {
        this.$(selector).addClass('active').siblings().removeClass('active');
    },
    onChangeSection: function (event) {
        event.preventDefault();
        var newType = event.currentTarget.getAttribute('data-section-type');
        if (this.sectionType !== newType) {
            var self = this;
            var services;
            this.sectionType = newType;
            this.makeActive('[data-section-type=' + newType + ']');
            if (newType !== TYPES.default) {
                services = this.services.filter(function (service) {
                    return self.applications[newType] && self.applications[newType] === service.attributes.application_uuid;
                });
            }
            this.computeServicesCount(services || this.services);
            this.sectionServices = services && new Services(services) || this.services;
            var filterType = $('.service-filters .active').attr('service-filter-type');
            this.servicesListView.collection = filterType === TYPES.default ? this.sectionServices :
                this.sectionServices.filterByType(filterType);

            this.servicesListView.render();
        }
    },
    onChangeServiceFilter: function (event) {
        event.preventDefault();
        var filterType = event.currentTarget.getAttribute('service-filter-type');
        if (filterType !== this.filterType) {
            this.filterType = filterType;
            this.makeActive('li[service-filter-type=' + filterType + ']');
            this.servicesListView.collection = this.sectionServices.filterByType(filterType);
            this.servicesListView.render();
        }
    },
    computeServicesCount: function (services) {
        var vmsCount = services.filter(function (service) {
            var type = service.type || service.attributes.type;
            return type === TYPES.vm;
        }).length;

        this.$('.number-of-services.vm').html(vmsCount);
        this.$('.number-of-services.agent').html(services.length - vmsCount);
        this.$('.number-of-services.all').html(services.length);
    },
    onRender: function () {
        var self = this;
        adminui.vent.trigger('settitle', 'services');
        this.makeActive('[data-section-type=' + TYPES.default + ']');
        this.applications.fetch({reset: true}).then(function (applications) {
            self.applications = {};
            applications.forEach(function (application) {
                self.applications[application.name] = application.uuid;
            });
        });
        this.servicesListView = new ServicesListView({
            el: this.$('.services'),
            collection: this.services
        });
        this.services.fetch({reset: true}).then(this.computeServicesCount.bind(this));
    }
});

module.exports = View;

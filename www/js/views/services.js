/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var $ = require('jquery');

var Backbone = require('backbone');
var adminui = require('../adminui');


var Service = require('../models/model').extend({
    idAttribute: 'uuid',
    urlRoot: '/api/services'
});

var Services = require('../models/collection').extend({
    model: Service,
    url: '/api/services'
});

var Instance = require('../models/model').extend({
    idAttribute: 'uuid',
    urlRoot: '/api/instances'
});

var Instances = require('../models/collection').extend({
    model: Instance,
    url: '/api/instances'
});

var Application = require('../models/model').extend({
    idAttribute: 'uuid',
    urlRoot: '/api/applications'
});

var Applications = require('../models/collection').extend({
    model: Application,
    url: '/api/applications'
});


var InstanceView = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/services-instance.hbs'),
    events: {
        'click a.vm': 'navigateToVm'
    },
    attributes: {
        'class': 'instance'
    },
    navigateToVm: function() {
        adminui.router.showVm(this.model.get('uuid'));
    },
    serializeData: function() {
        var data = this.model.toJSON();
        data.vm = data.type === 'vm';
        data.agent = data.type === 'agent';
        return data;
    },
    onRender: function() {
        var self = this;
        if (this.model.get('type') === 'vm') {
            $.get('/api/vms/'+this.model.get('uuid')).done(function(res) {
                self.$('.state').addClass(res.state).html(res.state);
                self.$('.ram').addClass(res.state).html(res.ram + ' MB');
            });
        }
    }
});

var InstancesView = Backbone.Marionette.CollectionView.extend({
    itemView: InstanceView
});

var ServicesListItemView = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/services-item.hbs'),
    attributes: { 'class': 'service' },
    initialize: function() {
        this.instances = new Instances();
    },
    onRender: function() {
        this.instancesView = new InstancesView({
            el: this.$('.instances'),
            collection: this.instances
        });
        this.instances.params = { service_uuid: this.model.get('uuid') };
        this.instances.fetch({reset: true});
    }
});

var ServicesListView = Backbone.Marionette.CollectionView.extend({
    itemView: ServicesListItemView
});

var ApplicationsListView = Backbone.Marionette.CollectionView.extend({
    itemView: Backbone.Marionette.ItemView.extend({
        template: require('../tpl/services-application.hbs'),
        attributes: {
            'class': 'application'
        },
        onRender: function() {
            this.services = new Services();
            this.servicesView = new ServicesListView({
                el: this.$('.services'),
                collection: this.services
            });
            var self = this;
            this.services.params = { applications_uuid: this.model.get('uuid') };
            this.services.fetch({ reset: true })
                .done(function(res) {
                    self.$('.number-of-services').html(res.length);
                });
        }
    })
});

var View = Backbone.Marionette.ItemView.extend({
    id: 'page-services',
    template: require('../tpl/services.hbs'),
    name: 'services',
    url: function() {
        return '/services';
    },

    initialize: function() {
        this.applications = new Applications();
    },

    onRender: function() {
        adminui.vent.trigger('settitle', 'services');

        this.applicationsView = new ApplicationsListView({
            el: this.$('.applications'),
            collection: this.applications
        });
        this.applications.fetch({reset: true});
    }
});

module.exports = View;

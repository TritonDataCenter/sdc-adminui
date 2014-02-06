var Backbone = require('backbone');
var adminui = require('../adminui');


var Service = require('../models/model').extend({
    idAttribute: 'uuid',
    urlRoot: '/_/services'
});

var Services = require('../models/collection').extend({
    model: Service,
    url: '/_/services'
});

var Instance = require('../models/model').extend({
    idAttribute: 'uuid',
    urlRoot: '/_/instances'
});

var Instances = require('../models/collection').extend({
    model: Instance,
    url: '/_/instances'
});

var Application = require('../models/model').extend({
    idAttribute: 'uuid',
    urlRoot: '/_/applications'
});

var Applications = require('../models/collection').extend({
    model: Application,
    url: '/_/applications'
});


var InstanceView = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/services-instance.hbs'),
    events: {
        'click a': 'navigateToVm'
    },
    attributes: {
        'class': 'instance'
    },
    navigateToVm: function() {
        adminui.vent.trigger('showview', 'vm', {uuid: this.model.get('uuid')});
    },
    onRender: function() {
        var self = this;
        $.get('/_/vms/'+this.model.get('uuid')).done(function(res) {
            self.$('.state').addClass(res.state).html(res.state);
            self.$('.ram').addClass(res.state).html(res.ram + ' MB');
        });
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
        this.instances.fetch();
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
            this.services.fetch({ data: {application: this.model.get('uuid')}})
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
        this.applicationsView = new ApplicationsListView({
            el: this.$('.applications'),
            collection: this.applications
        });
        this.applications.fetch();
    }
});

module.exports = View;

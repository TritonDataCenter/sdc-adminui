var Backbone = require('backbone');
var _ = require('underscore');

var app = require('../adminui');

var Server = require('../models/server');
var Nics = require('../models/nics');

var NotesView = require('./notes');
var BaseView = require('./base');
var TraitsModal = require('./traits-editor');
var JobProgressView = require('./job-progress');
var ChangeRackForm = require('./server-change-rack');
var ChangePlatformForm = require('./server-change-platform');
var ServerNicsView = require('./server-nics');
var ServerSetup = require('./server-setup');

var ServerTemplate = require('../tpl/server.hbs');
var ServerView = Backbone.Marionette.ItemView.extend({
    id: 'page-server',
    sidebar: 'servers',

    template: ServerTemplate,

    events: {
        'click .setup': 'showSetupModal',
        'click .change-rack-id': 'showChangeRackField',
        'click .change-platform': 'showChangePlatformField',
        'click .modify-traits': 'showTraitsModal',
        'click .factory-reset': 'factoryReset',
        'click .reboot': 'reboot',
        'click .forget': 'forget',
        'click .change-reserve': 'toggleReserve'
    },

    url: function() {
        return _.str.sprintf('servers/%s', this.model.get('uuid'));
    },

    modelEvents: {
        'change': 'render'
    },

    initialize: function(options) {
        this.model = options.server || new Server({uuid: options.uuid});

        this.nics = new Nics({
            belongs_to_type: 'server',
            belongs_to_uuid: this.model.get('uuid')
        });
        this.model.fetch();
        this.nics.fetchNics();
    },

    templateHelpers: {
        platform_version: function() {
            return this.sysinfo['Live Image'];
        },
        cpu_type: function() {
            return this.sysinfo['CPU Type'];
        },
        cpu_physical_cores: function() {
            return this.sysinfo['CPU Physical Cores'];
        },
        cpu_total_cores: function() {
            return this.sysinfo['CPU Total Cores'];
        },
        serial_number: function() {
            return this.sysinfo['Serial Number'];
        },
        total_memory: function() {
            return this.sysinfo['MiB of Memory'];
        }
    },

    serializeData: function() {
        var data = Backbone.Marionette.ItemView.prototype.serializeData.call(this);
        data.disks = _.map(data.sysinfo['Disks'], function(v, k) {
            return {
                name: k,
                size: v['Size in GB']
            };
        });
        data.traits = _.map(data.traits, function(v, k) {
            return {
                name: k,
                value: v
            };
        });
        return data;
    },

    toggleReserve: function() {
        var newValue = !this.model.get('reserved');
        this.model.update({
            'reserved': newValue
        });
    },

    showChangePlatformField: function() {
        var self = this;
        var $link = this.$('.platform a');
        var view = new ChangePlatformForm({
            model: this.model
        });

        this.listenTo(view, 'cancel', function() {
            $link.show();
        }, this);

        this.listenTo(view, 'save', function(platform) {
            self.model.set({
                boot_platform: platform
            });
            view.remove();
            $link.show();
        });
        this.$('.platform').append(view.el);
        $link.hide();
        view.render();
    },

    showChangeRackField: function() {
        var self = this;
        var view = new ChangeRackForm({
            model: this.model
        });
        var $link = this.$('.rack td a');

        this.listenTo(view, 'cancel', function() {
            $link.show();
        }, this);

        this.listenTo(view, 'save', function(rack) {
            self.model.set({
                rack_identifier: rack
            });
            view.remove();
            $link.show();
        });
        this.$('.rack td').append(view.el);
        $link.hide();
        view.render();
    },

    showTraitsModal: function() {
        var modal = new TraitsModal({
            traits: this.model.get('traits')
        });
        var server = this.model;
        modal.show();
        this.listenTo(modal, 'save-traits', function(traits) {
            server.set({
                traits: traits
            });
            server.update({
                traits: traits
            }, function() {
                modal.close();
            });
        });
    },

    showSetupModal: function() {
        var view = new ServerSetup({
            model: this.model
        });
        view.render();
    },

    factoryReset: function() {
        this.model.factoryReset(function(job) {
            app.vent.trigger('showjob', job);
        });
    },

    reboot: function() {
        this.model.reboot(function(job) {
            app.vent.trigger('showjob', job);
        });
    },

    forget: function() {
        this.model.forget(function(err) {
            alert('Server Removed from Datacenter');
            app.vent.trigger('showview', 'servers');
        });
    },

    onRender: function() {
        this.notesView = new NotesView({
            itemUuid: this.model.get('uuid'),
            el: this.$('.notes')
        });
        this.notesView.render();
        this.nicsView = new ServerNicsView({
            nics: this.nics,
            el: this.$('.nics')
        });
        this.nicsView.render();
    }
});

module.exports = ServerView;
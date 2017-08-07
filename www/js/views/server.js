/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

'use strict';

var $ = require('jquery');
var Backbone = require('backbone');
var _ = require('underscore');

var app = require('../adminui');

var Server = require('../models/server');
var Nics = require('../models/nics');
var Vms = require('../models/vms');


var React = require('react');

var ServerPageHeader = React.createFactory(require('../components/pages/server/header.jsx'));

var NotesComponent =  React.createFactory(require('../components/notes'));

var ServerMemoryOverview = React.createFactory(require('../components/pages/server/memory-overview'));
var ServerDiskOverview = React.createFactory(require('../components/pages/server/disk-overview'));
var ServerNicsList = React.createFactory(require('../components/server-nics'));
var ManageLinkAggr = React.createFactory(require('../components/server-link-aggr/main'));
var VmsList = React.createFactory(require('../components/vms-list'));
var JSONEditor = require('./traits-editor');
var ChangeRackForm = require('./server-change-rack');
var ChangePlatformForm = require('./server-change-platform');
var ServerSetup = require('./server-setup');

var ServerNicsEdit = require('./server-nics-edit');

var ServerTemplate = require('../tpl/server.hbs');

var getInterfaces = function (sysInfo) {
    var result = {
        nic: [],
        vnic: [],
        aggr: []
    };
    _.each({
        nic: 'Network Interfaces',
        vnic: 'Virtual Network Interfaces',
        aggr: 'Link Aggregations'
    }, function (key, kind) {
        _.each(sysInfo[key], function(value, ifname) {
            value.kind = kind;
            value.ifname = ifname;
            if (kind === 'aggr') {
                var nic = _.findWhere(result.nic, {ifname: ifname}) || {};
                value = _.extend(value, nic);
            }
            result[kind].push(value);
        });
    });
    return result;
};

var ServerView = Backbone.Marionette.Layout.extend({
    id: 'page-server',
    sidebar: 'servers',
    template: ServerTemplate,
    regions: {
        'vmsRegion': '.vms-region'
    },

    events: {
        'click .setup': 'showSetupModal',
        'click .change-rack-id': 'showChangeRackField',
        'click .change-platform': 'showChangePlatformField',
        'click .change-reservation-ratio': 'showChangeReservationRatio',
        'click .change-serial-console': 'showChangeSerialConsole',
        'click .modify-traits': 'showTraitsModal',
        'click .factory-reset': 'factoryReset',
        'click .reboot': 'reboot',
        'click .forget': 'forget',
        'click .change-reserve': 'toggleReserve',
        'click .manage-nics': 'showManageNics',
        'click .manage-link-aggr': 'showManageLinkAggr'
    },

    url: function () {
        return _.str.sprintf('servers/%s', this.model.get('uuid'));
    },

    modelEvents: {
        'change': 'onUpdate',
        'error': 'onError'
    },

    onClose: function () {
        clearInterval(this._timer);
        this._requests.forEach(function (r) {
            r.abort();
        });
        this._requests = [];

        if (app.user.role('operators')) {
            React.unmountComponentAtNode(this.$('.notes-component-container').get(0));
        }

        React.unmountComponentAtNode(this.$('.server-page-header').get(0));

        if (this.model.get('setup')) {
            React.unmountComponentAtNode(this.$('.memory-overview-container').get(0));
            React.unmountComponentAtNode(this.$('.disk-overview-container').get(0));
        }

        React.unmountComponentAtNode(this.$('.server-nics').get(0));
        React.unmountComponentAtNode(this.$('.vms-region').get(0));
    },

    initialize: function (options) {
        this._requests = [];
        this.model = options.server || new Server({uuid: options.uuid});
        window.server = this.model;
        this._timer = setInterval(function () {
            this._requests.push(this.model.fetch());
        }.bind(this), 10000);

        this.nics = new Nics(null, {
            params: {
                belongs_to_type: 'server',
                belongs_to_uuid: this.model.get('uuid')
            }
        });
        this.vms = new Vms(null, {
            params: {
                server_uuid: this.model.get('uuid'),
                state: 'active'
            },
            perPage: 20
        });
    },

    onUpdate: function (model) {
        var changed = model.changed;
        this.postRender();
        // don't update if it's just sysinfo change;
        if (changed.traits ||
            changed.rack_identifier ||
            changed.boot_platform ||
            typeof(changed.reserved) !== "undefined" || changed.reservation_ratio) {
            this.render();
        }
    },

    templateHelpers: {
        platform_version: function () {
            return this.sysinfo['Live Image'];
        },
        cpu_type: function () {
            return this.sysinfo['CPU Type'];
        },
        cpu_physical_cores: function () {
            return this.sysinfo['CPU Physical Cores'];
        },
        cpu_total_cores: function () {
            return this.sysinfo['CPU Total Cores'];
        },
        serial_number: function () {
            return this.sysinfo['Serial Number'];
        },
        total_memory: function () {
            return this.sysinfo['MiB of Memory'];
        }
    },

    serializeData: function () {
        var data = Backbone.Marionette.ItemView.prototype.serializeData.call(this);
        data.total_quota = 0;

        _.each(data.sysinfo['Disks'], function (v, k) {
            data.total_quota += v['Size in GB'];
        });


        data.disks = _.map(data.sysinfo['Disks'], function (v, k) {
            return {
                name: k,
                size: v['Size in GB']
            };
        });
        data.traits = _.map(data.traits, function (v, k) {
            if (typeof(v) === 'object') {
                v = JSON.stringify(v, null, 2);
            } else {
                v = v.toString();
            }
            return {name: k, value: v};
        });
        return data;
    },

    toggleReserve: function () {
        var newValue = !this.model.get('reserved');
        this.model.save({'reserved': newValue}, {patch: true});
    },

    onError: function (e, xhr, s) {
        app.vent.trigger('notification', {
            level: 'error',
            message: 'Error retrieving server information. CNAPI said: ' + xhr.responseData.message,
            persistent: true
        });
        this.close();
    },

    showManageNics: function () {
        var view = new ServerNicsEdit({
            server: this.model,
            nics: this.nics,
            extendedNics: this.extendedNics
        });
        view.show();
    },

    showChangeSerialConsole: function () {
        function input(fieldName, value) {
            return $("<input type='text'>").attr('value', value).attr('name', fieldName);
        }
        this.$('.change-serial-console').hide();

        var $defaultConsole = input('default_console', this.model.get('default_console'));
        this.$('.serial-console .default-console').html($defaultConsole);

        var $serial = input('serial', this.model.get('serial'));
        this.$('.serial-console .serial').html($serial);

        var btn = $("<button>").addClass('btn btn-primary pull-right').html('Save');
        this.$('.serial-console .change').append(btn);
        var cancel = $("<button>").addClass('btn btn-link pull-right').html('Cancel');
        this.$('.serial-console .change').append(cancel);

        var self = this;
        var model = this.model;

        cancel.on('click', function () {
            self.render();
        });

        btn.on('click', function () {
            model.save({
                default_console: $defaultConsole.val(),
                serial: $serial.val()
            }, {patch: true}).done(function () {
                app.vent.trigger('notification', {
                    level: 'success',
                    message: 'Serial console settings updated.'
                });
                self.render();
            });
        });
    },

    showManageLinkAggr: function () {
        var $node = $('<div id="server-link-aggr-modal" class="modal fade bs-example-modal-lg">' +
            '<div class="modal-dialog modal-lg"><div class="modal-content"><div class="modal-body"></div></div></div></div>');
        var container = $node.find('.modal-body').get(0);

        React.render(new ManageLinkAggr({
            server: this.model.get('uuid'),
            nics: this.extendedNics.toJSON()
        }), container);
        $node.modal();
    },

    showChangeReservationRatio: function () {
        var $reservationRatio = this.$('span.reservation-ratio');
        var $changeReservationRatio = this.$('.change-reservation-ratio');
        var $input = $("<input type='text'/>").addClass('reservation-ratio');
        $input.val(this.model.get('reservation_ratio'));

        enterEditMode();

        var self = this;

        $input.on('blur', function (e) {
            saveVal();
        });

        $input.on('keyup', function (e) {
            if (e.which === 27) {
                exitEditMode();
            }
            if (e.which === 13) {
                saveVal();
            }
        });


        function enterEditMode() {
            $reservationRatio.after($input);
            $input.focus();
            $changeReservationRatio.hide();
            $reservationRatio.hide();
            showTooltip('Press ENTER to <i class="fa fa-check"></i> Save<br/>Press ESC to <i class="fa fa-undo"></i> Cancel');
        }

        function showTooltip(t) {
            $input.tooltip('hide');
            $input.tooltip('destroy');
            $input.tooltip({title: t, html: true}).tooltip('show');
        }

        function saveVal() {
            var val = $input.val();
            var n = Number(val);
            if (/^[0-9.]+$/.test(val) && (n >= 0 && n <= 1.0)) {
                self.model.save({reservation_ratio: n}, {patch: true}).done(exitEditMode);
            } else {
                showTooltip('Ratio should be a number between 0 and 1');
            }
        }

        function exitEditMode() {
            $changeReservationRatio.show();
            $reservationRatio.show();
            $input.tooltip('hide');
            $input.tooltip('destroy');
            $input.remove();
        }
    },

    showChangePlatformField: function () {
        var $link = this.$('.platform a');
        var $value = this.$('.platform .value');
        var view = new ChangePlatformForm({ model: this.model });

        var showNotification = function (message, level) {
            app.vent.trigger('notification', {
                level: level || 'success',
                message: message
            });
            view.remove();
            $value.show();
            $link.show();
        };
        view.on('cancel', function () {
            $value.show();
            $link.show();
        });

        view.on('save', function (platform) {
            var message = _.str.sprintf('Server has been configured to use platform: <strong>%s</strong> on next boot.', platform);
            showNotification(message);
        });

        view.on('error', function (xhr) {
            var err = xhr.body ? xhr.body : xhr.responseData;
            showNotification('Error retrieving server information: ' + err.message, 'error');
        });

        this.$('.platform .boot .item-content').append(view.el);
        $value.hide();
        $link.hide();
        view.render();
    },

    showChangeRackField: function () {
        var self = this;
        var view = new ChangeRackForm({
            model: this.model
        });
        var $span = this.$('.rack .item-content span');
        var $link = this.$('.rack .item-content a');

        this.listenTo(view, 'cancel', function () {
            $span.show();
            $link.show();
        }, this);

        this.listenTo(view, 'save', function (rack) {
            self.model.set({
                rack_identifier: rack
            });
            app.vent.trigger('notification', {
                level: 'success',
                message: 'Rack assigned to ' + rack
            });
            view.remove();
            $span.show();
            $link.show();
        });
        this.$('.rack .item-content').append(view.el);
        $span.hide();
        $link.hide();
        view.render();
    },

    showTraitsModal: function () {
        var modal = new JSONEditor({
            data: this.model.get('traits'),
            title: _.str.sprintf('Traits for server: %s', this.model.get('hostname'))
        });
        modal.show();
        modal.on('save', function (data) {
            this.model.save(
                {traits: data},
                {patch: true})
            .done(function () {
                modal.close();
                app.vent.trigger('notification', {
                    level: 'success',
                    message: 'Traits updated'
                });
            });
        }, this);
    },

    showSetupModal: function () {
        var view = new ServerSetup({ model: this.model });
        view.render();
    },

    factoryReset: function () {
        var confirm = window.confirm('!!!!!! WARNING !!!!!!! \n\nAre you sure you want to run Factory Reset on this Server?');
        if (confirm) {
            this.model.factoryReset(function (err, job) {
                if (err) {
                    window.alert(err);
                } else {
                    app.vent.trigger('showjob', job);
                }
            });
        }
    },

    reboot: function () {
        var confirm = window.confirm('!!!!!!! WARNING !!!!!!!! \n\nAre you sure you want to reboot this server? All customer zones will be rebooted');
        if (confirm) {
            this.model.reboot(function (job) {
                app.vent.trigger('showjob', job);
            });
        }
    },

    forget: function () {
        var confirm = window.confirm('!!!!!!!!! WARNING !!!!!!!! \n\nAre you sure you want to remove this server?');
        if (confirm) {
            this.model.forget(function (err) {
                app.vent.trigger('notification', {
                    level: 'success',
                    message: 'Server removed from SmartDataCenter.'
                });
                app.vent.trigger('showview', 'servers');
            });
        }
    },

    onShow: function () {
        var self = this;
        $.when(this.model.fetch(), this.nics.fetch(), this.vms.fetch()).then(function () {
            self.render();
        }).fail(function () {
            self.render();
        });
    },

    postRender: function () {
        if (app.user.role('operators')) {
            React.render( new NotesComponent({item: this.model.get('uuid')}), this.$('.notes-component-container').get(0));
        }
        this.extendedNics = this.nics.mergeSysInfo(this.model.get('sysinfo'));
        this.interfaces = getInterfaces(this.model.get('sysinfo'));
        React.render(ServerPageHeader({server: this.model}), this.$('.server-page-header').get(0));

        if (this.model.get('setup')) {
            React.render(ServerMemoryOverview({ server: this.model}), this.$('.memory-overview-container').get(0));
            React.render(ServerDiskOverview({server: this.model}), this.$('.disk-overview-container').get(0));
        }

        React.render(ServerNicsList({
            server: this.model,
            interfaces: this.interfaces,
            nics: this.extendedNics.toJSON()
        }), this.$('.server-nics').get(0));

        React.render(VmsList({
            collection: this.vms
        }), this.$('.vms-region').get(0));
    },

    onRender: function () {
        app.vent.trigger('settitle', _.str.sprintf('server: %s', this.model.get('hostname')));

        if (this.model.get('headnode')) {
            this.$('.platform .boot .value').tooltip({
                title: 'Use \'sdcadm platform\' to update the headnode\'s platform.',
                placement: 'top',
                container: 'body'
            });
        }
        
        this.$('[data-toggle=tooltip]').tooltip();
        this.postRender();
    }
});

module.exports = ServerView;

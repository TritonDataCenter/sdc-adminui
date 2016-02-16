/** @jsx React.DOM */

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */
'use strict';

function cloneObject(obj, properties) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    var result = obj.constructor();
    properties = properties || Object.keys(obj);
    properties.forEach(function (property) {
        var propertyValue = obj[property];
        if (propertyValue !== undefined) {
            result[property] = cloneObject(propertyValue);
        }
    });

    return result;
}

var Backbone = require('backbone');
var _ = require('underscore');
var React = require('react');

var NicConfigComponent = React.createFactory(require('../../nic-config'));
var JobProgress = require('../../../views/job-progress');

var VMNicForm = Backbone.Marionette.ItemView.extend({
    template: require('./nics-form.hbs'),
    id: 'vm-nic-form',
    attributes: {
        'class': 'modal'
    },
    events: {
        'click button[type=submit]': 'onSubmit'
    },

    initialize: function (options) {
        if (!this.model) {
            this.model = new Backbone.Model();
        }
        this.vm = options.vm;
        this.isPrimaryChoosingAvailable = options.isPrimaryChoosingAvailable;
    },

    onSubmit: function () {
        var self = this;
        var vm = this.vm;
        var nic = this.nicConfig.getValue();
        nic.uuid = nic.network_uuid;
        delete nic.network_uuid;
        var nics = vm.get('nics');
        if (!nic.mac) {
            vm.addNics([nic], function (err, job) {
                if (err) {
                    window.alert('Error adding network interface ' + err);
                    return;
                }
                self.$el.modal('hide').remove();
                var view = new JobProgress({ model: job });
                view.show();

                self.listenTo(view, 'execution', function(st) {
                    if (st === 'succeeded') {
                        vm.fetch();
                    }
                });
            });
        } else {
            var existingNic = _.findWhere(nics, {mac: nic.mac});

            if (existingNic) {
                _.extend(existingNic, nic);
            } else {
                nics.push(nic);
            }
            nics = nics.map(function (n) {
                if (nic.primary && nic.mac !== n.mac) {
                    n.primary = false;
                }
                return cloneObject(n, ['primary', 'mac', 'interface',
                    'allow_dhcp_spoofing', 'allow_ip_spoofing', 'allow_mac_spoofing', 'allow_restricted_traffic']);
            });

            vm.updateNics(nics, function (err, job) {
                if (err) {
                    window.alert('Error updating network interfaces ' + err);
                    return;
                }
                self.$el.modal('hide').remove();
                var view = new JobProgress({
                    model: job
                });
                view.show();
                self.listenTo(view, 'execution', function (st) {
                    if (st === 'succeeded') {
                        vm.fetch();
                    }
                });
            });
        }
    },

    disableButtons: function () {
        this.$('button[type=submit]').prop('disabled', true);
    },

    enableButtons: function () {
        this.$('button[type=submit]').prop('disabled', false);
    },

    onNicPropertyChange: function (prop, value, nic) {
        if (nic.network_uuid) {
            this.enableButtons();
        } else {
            this.disableButtons();
        }
    },

    onRender: function () {
        this.nicConfig = React.render(
            new NicConfigComponent({
                nic: this.model.toJSON(),
                readonlyNetwork: !this.model.isNew(),
                expandAntispoofOptions: false,
                isPrimaryChoosingAvailable: this.isPrimaryChoosingAvailable,
                onPropertyChange: this.onNicPropertyChange.bind(this),
                networkFilters: {
                    provisionable_by: this.vm.get('owner_uuid')
                }
            }),
            this.$('.nic-config-component').get(0));

        this.$el.modal().on('hidden', this.remove.bind(this));
        this.$el.modal('show');
        this.disableButtons();
    }
});

module.exports = VMNicForm;

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
            if (nic.primary && nics.length) {
                var hasPrimaryNic = nics.some(function (nic) {
                    return nic.primary;
                });
                if (hasPrimaryNic) {
                    window.alert('You have primary NIC defined already.');
                    return;
                }
            }

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
                delete n.vlan_id;
                delete n.nic_tag;
                delete n.ip;
                delete n.netmask;
                delete n.state;
                delete n.routes;
                delete n.belongs_to_type;
                delete n.belongs_to_uuid;
                delete n.gateway;
                delete n.resolvers;
                delete n.network_uuid;
                delete n.owner_uuid;
                delete n.uuid;
                delete n.mtu;
                delete n.cn_uuid;
                delete n.model;
                delete n.interface;
                if (nic.primary && nic.mac !== n.mac) {
                    n.primary = false;
                }
                return n;
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
                onPropertyChange: this.onNicPropertyChange.bind(this)
            }),
            this.$('.nic-config-component').get(0));

        this.$el.modal().on('hidden', this.remove.bind(this));
        this.$el.modal('show');
        this.disableButtons();
    }
});

module.exports = VMNicForm;

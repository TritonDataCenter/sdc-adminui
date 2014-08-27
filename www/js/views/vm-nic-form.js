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

var Backbone = require('backbone');
var _ = require('underscore');

var React = require('react');

var NicConfigComponent = require('../components/nic-config');


var JobProgress = require('./job-progress');

var VMNicForm = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/vm-nic-form.hbs'),
    id: 'vm-nic-form',
    attributes: {
        'class': 'modal'
    },
    events: {
        'click button[type=submit]': 'onSubmit'
    },

    initialize: function(options) {
        if (! this.model) {
            this.model = new Backbone.Model();
        }
        this.vm = options.vm;
    },

    onSubmit: function() {
        var self = this;
        var vm = this.vm;
        var nic = this.nicConfig.getValue();
        nic.uuid = nic.network_uuid;
        delete nic.network_uuid;

        if (! nic.mac) {
            vm.addNics([nic], function(err, job) {
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
            var nics = vm.get('nics');
            if (nic.primary) {
                nics = nics.map(function(n) {
                    delete n.primary;
                    return n;
                });
            }

            var existingNic = _.findWhere(nics, {mac: nic.mac});

            if (existingNic) {
                _.extend(existingNic, nic);
            } else {
                nics.push(nic);
            }

            vm.updateNics(nics, function(err, job) {
                if (err) {
                    window.alert('Error updating network interfaces ' + err);
                    return;
                }
                self.$el.modal('hide').remove();
                var view = new JobProgress({
                    model: job
                });
                view.show();
                self.listenTo(view, 'execution', function(st) {
                    if (st === 'succeeded') {
                        vm.fetch();
                    }
                });
            });
        }
    },

    disableButtons: function() {
        this.$('button[type=submit]').prop('disabled', true);
    },

    enableButtons: function() {
        this.$('button[type=submit]').prop('disabled', false);
    },

    onNicPropertyChange: function(prop, value, nic) {
        if (nic.network_uuid) {
            this.enableButtons();
        } else {
            this.disableButtons();
        }
    },

    onRender: function() {
        this.nicConfig = React.renderComponent(
            new NicConfigComponent({
                nic: this.model.toJSON(),
                expandAntispoofOptions: false,
                onPropertyChange: this.onNicPropertyChange.bind(this)
            }),
            this.$('.nic-config-component').get(0));

        this.$el.modal().on('hidden', this.remove.bind(this));
        this.$el.modal('show');
        this.disableButtons();
    }
});

module.exports = VMNicForm;

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');
var React = require('react');

var PackageSelect = React.createFactory(require('../components/package-select'));
var Package = require('../models/package');
var JobProgressView = require('./job-progress');
var PackagePreviewView = require('./package-preview');

var ViewModel = Backbone.Model.extend({});
var View = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/resize-vm.hbs'),
    attributes: {
        'class': 'modal resize-vm'
    },
    events: {
        'click button': 'onClickResize'
    },
    initialize: function(options) {
        this.vm = options.vm;
        this.model = new ViewModel();

        this.selectedPackage = new Package();
        this.packagePreviewView = new PackagePreviewView({
            model: this.selectedPackage
        });
    },
    onSelectPackage: function(pkg) {
        if (pkg && typeof(pkg) === 'object') {
            this.selectedPackage.set(pkg);
            this.$('button').prop('disabled', false);
        } else {
            this.$('button').prop('disabled', true);
            this.selectedPackage.clear();
        }
    },
    onClickResize: function() {
        this.$('.alert').hide();
        var self = this;
        var pkg = this.selectedPackage;
        var values = {};
        values.billing_id = pkg.get('uuid');
        values.package_name = pkg.get('name');
        values.package_version = pkg.get('version');
        values.cpu_cap = pkg.get('cpu_cap');
        values.max_lwps = pkg.get('max_lwps');
        values.max_swap = pkg.get('max_swap');
        // quota value needs to be in GiB
        values.quota = pkg.get('quota');
        if (values.quota) {
            values.quota = Math.ceil(Number(values.quota) / 1024);
        }

        values.vcpus = pkg.get('vcpus');
        values.zfs_io_priority = pkg.get('zfs_io_priority');
        values.ram = pkg.get('max_physical_memory');
        this.vm.update(values, function(job, error) {
            if (job) {
                self.$el.modal('hide');
                var jobView = new JobProgressView({
                    model: job
                });
                jobView.show();
            } else {
                self.$('.alert').html(error.message);
                self.$('.alert').show();
            }
        });
    },
    onRender: function() {
        this.$('.alert').hide();
        React.render(PackageSelect({onChange: this.onSelectPackage.bind(this)}), this.$('.package-preview-container').get(0));
        this.$('button').prop('disabled', true);
    },
    show: function() {
        this.render();
        this.$el.modal();
    }
});

module.exports = View;

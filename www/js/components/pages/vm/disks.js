
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright 2019 Joyent, Inc.
 */

var Backbone = require('backbone');

/**
 * Disks Table/List
 */
var Disks = Backbone.Collection.extend({});
var JobProgressView = require('../../../views/job-progress');
var DisksFormView = require('./disks-form');
var DiskRowTemplate = require('./disks-row.hbs');

var adminui = require('../../../adminui');
var DiskRow = Backbone.Marionette.ItemView.extend({
    tagName: 'tr',
    template: DiskRowTemplate,
    events: {
        'click .edit': 'resizeDisk',
        'click .delete': 'deleteDisk'
    },

    deleteDisk: function () {
        if (window.confirm('Are you sure you want to delete this disk?')) {
            this.vm.removeDisk(this.model.get('pci_slot'),
                this._onJob.bind(this));
        }
    },
    _onJob: function (err, job) {
        if (err) {
            console.log('[job error]: ', err);
            var msg = (err.responseText) ?
                    JSON.parse(err.responseText).message:
                    'Error creating job';
            window.alert(msg);
            return;
        }
        var self = this;
        var jobView = new JobProgressView({model: job});
        this.listenTo(jobView, 'execution', function (exec) {
            if (exec === 'succeeded') {
                self.vm.fetch();
            }
        });
        jobView.show();
    },

    resizeDisk: function () {
        var self = this;
        var view = new DisksFormView({
            vm: self.vm,
            model: self.model
        });
        view.render();
    }

});

var DisksView = Backbone.Marionette.CompositeView.extend({
    itemView: DiskRow,
    itemViewContainer: 'tbody',
    template: require('./disks.hbs'),
    attributes: {
        id: 'vm-disks'
    },
    events: {
        'click button': 'onClickAddDisk'
    },

    initialize: function (options)  {
        this.vm = options.vm;
        this.collection = new Disks(this.vm.get('disks'));
        this.listenTo(this.collection, "add", this.render, this);
        this.listenTo(this.collection, "remove", this.render, this);
        this.listenTo(this.collection, "sync", this.render, this);
        this.listenTo(this.vm, 'change:disks', this.resetDisks, this);
    },

    resetDisks: function(vm, n) {
        this.collection.reset(vm.get('disks'));
        this.render();
    },

    onBeforeItemAdded: function(view) {
        view.vm = this.vm;
    },

    templateHelpers: function() {
        var self = this;
        return {
            disks: function() {
                return self.collection;
            },

            hasDisks: function(data) {
                return self.collection.length > 0;
            }
        };
    },

    onClickAddDisk: function () {
        var self = this;
        var view = new DisksFormView({
            vm: self.vm
        });
        view.render();
    },

    clickedCreateDisk: function() {
        var vm = this.vm;
        var self = this;
        this.vm.createDisk(function(job, err) {
            if (err) {
                console.log('[Disks] error: ', err);
                adminui.vent.trigger('notification', {
                    level:'error',
                    message: err.message
                });
                return;
            }
            var jobView = new JobProgressView({
                model: job
            });
            self.listenTo(jobView, 'execution', function(exec) {
                if (exec === 'succeeded') {
                    vm.fetch();
                }
            });
            jobView.show();
        });
    }
});


module.exports = DisksView;

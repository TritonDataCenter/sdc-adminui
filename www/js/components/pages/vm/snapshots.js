/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');


/**
 * Snapshots Table/List
 */
var Snapshots = Backbone.Collection.extend({});
var JobProgressView = require('../../../views/job-progress');
var adminui = require('../../../adminui');

var SnapshotRowTemplate = require('./snapshots-row.hbs');
var SnapshotRow = Backbone.Marionette.ItemView.extend({
    tagName: 'tr',
    template: SnapshotRowTemplate,
    events: {
        'click .rollback': 'rollbackToSnapshot',
        'click .delete': 'deleteSnapshot'
    },
    rollbackToSnapshot: function () {
        if (window.confirm('Are you sure you want to roll back to this snapshot?')) {
            this.vm.rollbackSnapshot(this.model.get('name'), this._onJob.bind(this));
        }
    },
    deleteSnapshot: function () {
        if (window.confirm('Are you sure you want to delete this snapshot?')) {
            this.vm.deleteSnapshot(this.model.get('name'), this._onJob.bind(this));
        }
    },
    _onJob: function (job) {
        var self = this;
        var jobView = new JobProgressView({model: job});
        this.listenTo(jobView, 'execution', function (exec) {
            if (exec === 'succeeded') {
                self.vm.fetch();
            }
        });
        jobView.show();
    }
});


var View = Backbone.Marionette.CompositeView.extend({
    itemView: SnapshotRow,
    itemViewContainer: 'tbody',
    template: require('./snapshots.hbs'),
    events: {
        'click button': 'clickedCreateSnapshot'
    },
    initialize: function(options) {
        this.vm = options.vm;
        this.collection = new Snapshots(this.vm.get('snapshots'));
        this.listenTo(this.collection, "add", this.render, this);
        this.listenTo(this.collection, "remove", this.render, this);
        this.listenTo(this.collection, "sync", this.render, this);
        this.listenTo(this.vm, 'change:snapshots', this.resetSnapshots, this);
    },
    resetSnapshots: function(vm, n) {
        this.collection.reset(vm.get('snapshots'));
        this.render();
    },
    onBeforeItemAdded: function(view) {
        view.vm = this.vm;
    },
    templateHelpers: function() {
        var self = this;
        return {
            snapshots: function() {
                return self.collection;
            },
            kvm: function() {
                return self.vm.get('brand') === 'kvm';
            },
            hasSnapshots: function(data) {
                return self.collection.length > 0;
            }
        };
    },
    clickedCreateSnapshot: function() {
        var vm = this.vm;
        var self = this;
        this.vm.createSnapshot(function(job, err) {
            if (err) {
                console.log('[Snapshots] error', err);
                adminui.vent.trigger('notification', {level:'error', message: err.message});
                return;
            }
            var jobView = new JobProgressView({model: job});
            self.listenTo(jobView, 'execution', function(exec) {
                if (exec === 'succeeded') {
                    vm.fetch();
                }
            });
            jobView.show();
        });
    }
});
module.exports = View;

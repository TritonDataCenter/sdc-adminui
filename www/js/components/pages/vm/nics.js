/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var Backbone = require('backbone');
var Nics = require('../../../models/nics');

var AddNicView = require('./nics-form');
var NicsRowView = require('./nics-row');
var JobProgress = require('../../../views/job-progress');

var NicsView = Backbone.Marionette.CompositeView.extend({
    template: require('./nics.hbs'),
    itemView: NicsRowView,
    itemViewContainer: 'tbody',
    attributes: {
        id: 'vm-nics'
    },
    events: {
        'click button.add-nic': 'onClickAddNic',
        'click button.remove-nics': 'onClickRemoveNics'
    },

    initialize: function (options)  {
        this.on('itemview:nic:configure', this.onConfigureNic, this);
        this.on('itemview:nic:select', this.onSelectNic, this);
        this.on('itemview:nic:deselect', this.onDeselectNic, this);

        this.model = options.vm;

        this.selectedNics = new Backbone.Collection();
        this.collection = new Nics(null, {
            params: {
                belongs_to_type: 'zone',
                belongs_to_uuid: this.model.get('uuid')
            }
        });
        this.collection.fetch();

        this.listenTo(this.selectedNics, 'add remove reset', this.onChangeSelectedNics, this);
        this.listenTo(this.model, 'change:nics', this.resetNics, this);

    },

    onConfigureNic: function (view, nic) {
        new AddNicView({
            vm: this.model,
            model: nic,
            isPrimaryChoosingAvailable: !nic.attributes.primary
        }).render();
    },

    resetNics: function () {
        this.model.fetch();
        this.collection.fetch();
        this.selectedNics.reset();
    },

    onClickRemoveNics: function () {
        var confirm = window.confirm('Are you sure you want to remove selected nics? This will reboot the VM.');
        if (! confirm) {
            return;
        }

        var self = this;
        var macs = this.selectedNics.pluck('mac');
        this.model.removeNics(macs, function (job) {
            var jobView = new JobProgress({model: job});
            jobView.show();

            self.listenTo(jobView, 'succeeded', function () {
                self.resetNics();
            });
        });
    },

    onClickAddNic: function () {
        new AddNicView({
            vm: this.model,
            isPrimaryChoosingAvailable: true
        }).render();
    },

    onChangeSelectedNics: function () {
        if (this.selectedNics.length > 0) {
            this.enableActions();
        } else {
            this.disableActions();
        }
    },

    enableActions: function () {
        this.$('.remove-nics').show();
    },

    disableActions: function () {
        this.$('.remove-nics').hide();
    },

    onSelectNic: function (view, nic) {
        this.selectedNics.add(nic);
    },

    onDeselectNic: function (view, nic) {
        this.selectedNics.remove(nic);
    },

    onRender: function () {
        this.disableActions();
    }

});

module.exports = NicsView;


/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright 2019 Joyent, Inc.
 */

var Backbone = require('backbone');
var Disks = Backbone.Collection.extend({});

var DiskRowTemplate = require('./disks-row.hbs');
var DiskRow = Backbone.Marionette.ItemView.extend({
    tagName: 'tr',
    template: DiskRowTemplate,
    events: {
    },
    initialize: function (options)  {
        // Override list initialization
    }
});

var DisksView = Backbone.Marionette.CompositeView.extend({
    template: require('./disks.hbs'),
    itemView: DiskRow,
    itemViewContainer: 'tbody',
    attributes: {
        id: 'vm-disks'
    },
    events: {
    },

    initialize: function (options)  {
        this.vm = options.vm;
        this.collection = new Disks(this.vm.get('disks'));
    },

    templateHelpers: function() {
        var self = this;
        return {
            disks: function() {
                return self.collection;
            }
        };
    }

});


module.exports = DisksView;

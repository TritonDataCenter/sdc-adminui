/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');



var PackagePreviewView = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/package-preview.hbs'),
    attributes: {
        'class': 'package-preview'
    },
    bindings: {
        '[name=max_physical_memory]': 'max_physical_memory',
        '[name=max_swap]': 'max_swap',
        '[name=name]': 'name',
        '[name=version]': 'version',
        '[name=vcpus]': 'vcpus',
        '[name=quota]': 'quota',
        '[name=zfs_io_priority]': 'zfs_io_priority'
    },
    initialize: function(options) {
        this.model = options.model;
        this.listenTo(this.model, 'change:uuid', this.toggleDisplay);
    },
    toggleDisplay: function() {
        if (this.model.get('uuid') && this.model.get('uuid').length) {
            this.$el.show();
        } else {
            this.$el.hide();
        }
    },
    onRender: function() {
        this.stickit();
        this.toggleDisplay();
    }
});

module.exports = PackagePreviewView;

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var NicTags = require('../models/nictags');
var Backbone = require('backbone');

module.exports = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/create-nic-tag.hbs'),
    events: {
        'click .cancel': 'onCancel',
        'click .save': 'onSave'
    },
    initialize: function(options) {
        this.collection = new NicTags();
    },
    onSave: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var self = this;
        var tag = this.$('input').val();
        this.collection.create({name: tag}, {
            success: function(model) {
                console.log('nic tag save', model);
                self.trigger('save', model);
                self.close();
            }
        });
        return false;
    },
    onCancel: function(e) {
        e.preventDefault();
        this.close();
    }
});

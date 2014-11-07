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
var _ = require('underscore');

var PackageSelect = React.createFactory(require('../components/package-select'));

var UserVmsFilter = Backbone.Marionette.ItemView.extend({
    attributes: {
        'class': 'vms-filter'
    },
    template: require('../tpl/user-vms-filter.hbs'),
    events: {
        'submit form': 'onSubmit'
    },
    onSubmit: function(e) {
        e.preventDefault();

        var data = Backbone.Syphon.serialize(this);
        _.each(data, function(v, k) {
            if (typeof(data[k]) === 'string' && data[k].length === 0) {
                delete data[k];
            }
        });
        this.trigger('query', data);
    },
    onRender: function() {
        React.renderC(
            PackageSelect({}),
            this.$('.package-select').get(0)
        );
    }
});

module.exports = UserVmsFilter;

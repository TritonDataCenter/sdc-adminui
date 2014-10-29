/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

"use strict";

/**
 * ./vms.js
 */

var React = require('react');
var app = require('../adminui');
var _ = require('underscore');
var Backbone = require('backbone');

var Vms = require('../models/vms');
var VmsList = require('./vms-list');
var VmsTemplate = require('../tpl/vms.hbs');

var FilterForm = require('../components/pages/vms/filter-form');

module.exports = Backbone.Marionette.Layout.extend({
    name: 'vms',
    id: 'page-vms',
    template: VmsTemplate,

    url: function() {
        return 'vms';
    },

    regions: {
        'listRegion': '.list-region'
    },

    ui: {
        'alert': '.alert'
    },

    events: {
        'click .provision-button':'provision',
        'click .toggle-filter':'toggleFiltersPanel'
    },

    initialize: function(options) {
        this.filterView = new FilterForm();
        this.collection = new Vms(null, { perPage: 20 });
        this.listView = new VmsList({ collection: this.collection });

        this.listenTo(this.collection, 'error', this.onError, this);
    },

    provision: function() {
        app.vent.trigger('showview', 'provision', {});
    },


    query: function(params) {
        this.ui.alert.hide();
        this.collection.params = params;
        this.collection.firstPage();
        this.collection.fetch({reset: true});
    },


    onMoreVms: function(e) {
        this.next();
    },

    next: function() {
        if (this.collection.hasNext()) {
            this.collection.next();
            this.collection.fetch({remove: false});
        }
    },

    onError: function(model, res) {
        if (res.status === 409 || res.status === 422) {
            var obj = JSON.parse(res.responseText);
            var errors = _.map(obj.errors, function(e) {
                return e.message;
            });
            app.vent.trigger('notification', {
                level: 'error',
                message: errors.join(' ')
            });
        } else {
            app.vent.trigger('error', {
                xhr: res,
                context: 'vms / vmapi'
            });
        }
    },

    onShow: function() {
        this.$('.alert').hide();
        React.renderComponent(FilterForm({
            initialParams: { state: 'running'},
            handleSearch: this.query.bind(this)
        }), this.$('.filter-form').get(0));

        this.listRegion.show(this.listView);
    },

    onRender: function() {
        app.vent.trigger('settitle', 'vms');

        this.query({state: 'running', sort: "create_timestamp.desc"});

        return this;
    }
});

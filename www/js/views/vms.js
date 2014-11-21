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

var FilterForm = React.createFactory(require('../components/pages/vms/filter-form'));

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

        this.initialFilter = JSON.parse(window.localStorage.getItem('vms::last_filter')) || {};
        console.log('[vms] initialFilter', this.initialFilter);
    },

    provision: function() {
        app.vent.trigger('showview', 'provision', {});
    },


    query: function(params) {
        this.ui.alert.hide();
        this.collection.params = params;
        this.collection.firstPage();
        this.collection.fetch({reset: true}).done(function() {
            var val = JSON.stringify(params);
            console.log('[vms] set vms::last_filter', val);
            window.localStorage.setItem('vms::last_filter', val);
        });
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
        React.render(FilterForm({
            initialParams: this.initialFilter,
            handleSearch: this.query.bind(this)
        }), this.$('.filter-form').get(0));

        this.listRegion.show(this.listView);
    },
    onClose: function() {
        React.unmountComponentAtNode(this.$('.filter-form').get(0));
    },

    onRender: function() {
        app.vent.trigger('settitle', 'vms');

        this.query(this.initialFilter);

        return this;
    }
});

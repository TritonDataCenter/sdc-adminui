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
var $ = require('jquery');
var app = require('../adminui');
var _ = require('underscore');
var Backbone = require('backbone');

var Vms = require('../models/vms');
var VmsList = require('./vms-list');
var VmsTemplate = require('../tpl/vms.hbs');
var UserInput = require('./typeahead-user');
var Images = require('../models/images');

var ImageTypeaheadView = require('../tpl/typeahead-image.hbs');

var FilterForm = Backbone.Marionette.ItemView.extend({
    events: {
        'submit form.quick': 'onQuick',
        'change select.sort': 'onQuick',
        'submit form.more': 'detailedSearch',
        'click .toggle-filter': 'toggleFiltersPanel'
    },

    initialize: function() {
        this.params = {};
        this.images = new Images();
    },

    template: require('../tpl/vms-filter.hbs'),

    onRender: function() {
        this.userInput = new UserInput({el: this.$('input[name=owner_uuid]')});
        this.userInput.render();
        var self = this;
        this.images.fetch().done(function() {
            self.prepareImageInput();
        });

        this.$('.more').hide();

        setTimeout(function() {
            $('#datetimepicker-from').datetimepicker();
            $('#datetimepicker-to').datetimepicker();
            $('#datetimepicker-from').on('dp.change', function(e) {
                $('#datetimepicker-to').data("DateTimePicker").setMinDate(e.date);
            });
            $('#datetimepicker-to').on('dp.change', function(e) {
                $('#datetimepicker-from').data("DateTimePicker").setMaxDate(e.date);
            });
        });
    },
    onShow: function() {
    },

    prepareImageInput: function() {
        var source = this.images.map(function(i) {
            return {
                'uuid': i.get('uuid'),
                'tokens': [i.get('uuid'), i.get('version'), i.get('name')],
                'name': i.get('name'),
                'version': i.get('version')
            };
        });

        this.$("input[name=image_uuid]").typeahead({
            name: 'images',
            local: source,
            valueKey: 'uuid',
            cache: false,
            limit: 8,
            template: ImageTypeaheadView
        });
    },

    onQuick: function(e) {
        e.preventDefault();

        var obj = this.$('form.quick').serializeObject();
        var params = {};
        params[obj.property] = obj.value;
        params.sort = this.$("select[name=sort]").val();
        console.log("query", params);
        this.trigger('query', params);
    },

    detailedSearch: function(e) {
        e.preventDefault();

        var params = this.$('form.more').serializeObject();

        if ($("#datetimepicker-from input").val().length) {
            var provisioned_from = $("#datetimepicker-from").data('DateTimePicker').getDate();
            params.provisioned_from = provisioned_from.toDate().getTime();
        }
        if ($("#datetimepicker-to input").val().length) {
            var provisioned_to = $("#datetimepicker-to").data('DateTimePicker').getDate();
            params.provisioned_to = provisioned_to.toDate().getTime();
        }

        this.trigger('query', params);
        console.log("query", params);
    },

    toggleFiltersPanel: function(e) {
        e.preventDefault();
        var filterPanel = this.$('.more');
        var filterPanelVisible = (filterPanel.is(':visible'));
        this.$('form.quick .btn-info').prop('disabled', !filterPanelVisible);
        this.$('form.quick select').prop('disabled', !filterPanelVisible);
        this.$('form.quick input').prop('disabled', !filterPanelVisible);
        if (filterPanelVisible) {
            filterPanel.hide();
            this.$('.toggle-filter').html('Show More Filter Options');
        } else {
            this.$('.toggle-filter').html('Show Less Filter Options');
            filterPanel.show();
        }
    }
});



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

        this.listenTo(this.filterView, 'query', this.query, this);
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

        this.listRegion.show(this.listView);
    },

    onRender: function() {
        this.filterView.setElement(this.$('.vms-filter'));
        this.filterView.render();

        this.query({state: 'running', sort: "create_timestamp.desc"});

        return this;
    },

    onBeforeClose: function() {
        $(window).off('scroll', this.onSroll);
    }
});

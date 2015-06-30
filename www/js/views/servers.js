/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

'use strict';
var _ = require('underscore');
var Backbone = require('backbone');
var React = require('react');
var app = require('adminui');
var $ = require('jquery');
var Servers = require('../models/servers');
var ServerBootOptionsView = require('./server-boot-options');

require('jquery');
require('d3');
require('epoch');

var SlidingPanelRegionType = Backbone.Marionette.Region.extend({
    open: function (view) {
        this.$el.hide();
        this.$el.html(view.el);
        this.$el.slideDown('fast');
    },
    close: function () {
        var view = this.currentView;
        var self = this;
        if (!view || view.isClosed) {
            return;
        }

        var close = Backbone.Marionette.Region.prototype.close;
        this.currentView.$el.slideUp('fast', function () {
            close.apply(self);
        });
    }
});

var ServersList = React.createFactory(require('../components/servers-list'));

var NicTags = require('../models/nictags');
var FilterForm = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/servers-filter.hbs'),
    events: {
        'submit form': 'onSubmit',
        'keyup input': 'onSubmit',
        'change select': 'onSubmit',
        'click .input-group-addon': 'changeDirection'
    },
    changeDirection: function (e) {
        var $directionInput = $('input[name=direction]');
        var directionValue = $directionInput.val();
        $('.input-group-addon span').toggleClass('glyphicon-sort-by-alphabet glyphicon-sort-by-alphabet-alt');
        $directionInput.val(directionValue === 'asc' ? 'desc' : 'asc');
        this.onSubmit(e);
    },
    onShow: function () {
        this.nictags = new NicTags();
        this.nictags.on('sync', this.renderNicTagsDropdown, this);
        this.nictags.fetch();
    },
    renderNicTagsDropdown: function () {
        var $select = this.$('select[name=nictag]');
        $select.empty();
        $select.append($('<option value="">any</option>'));
        this.nictags.each(function(nt) {
            var option = $('<option />').attr('value', nt.get('name')).html(nt.get('name'));
            $select.append(option);
        }, this);
    },
    getQuery: function () {
        return Backbone.Syphon.serialize(this);
    },
    onSubmit: _.debounce(function (e) {
        e.preventDefault();
        var params = Backbone.Syphon.serialize(this);
        this.trigger('query', params);
    }, 300)
});

var ServersView = Backbone.Marionette.Layout.extend({
    sidebar: 'servers',
    id: 'page-servers',
    template: require('../tpl/servers.hbs'),
    events: {
        'click .toggle-boot-options':'toggleBootOptions'
    },
    url: function () {
        return 'servers';
    },
    regions: {
        'bootOptionsRegion': {
            selector: '.default-boot-options-region',
            regionType: SlidingPanelRegionType
        },
        'filterRegion': '.servers-filter-region'
    },

    onRequest: function () {
        this.$('.record-summary').hide();
    },

    onSync: function () {
        if (this.collection.length) {
            this.$('.record-count').html(this.collection.length);
            this.$('.record-summary').show();
        } else {
            this.$('.record-summary').hide();
        }
    },

    initialize: function () {
        this.collection = new Servers(null, {params: {sort: 'hostname'}});
        this.filterForm = new FilterForm();

        this.listenTo(this.collection, 'request', this.onRequest);
        this.listenTo(this.collection, 'sync', this.onSync);
    },

    query: function (params) {
        if (params) {
            if (params.reserved === 'false' && params.setup === '') {
                params.setup = 'true';
            }
            this.collection.params = params;
        }
        this.collection.fetch();
    },

    onShow: function () {
        this.listenTo(this.filterForm, 'query', this.query);

        React.render(ServersList({collection: this.collection}), this.$('.servers-list-region').get(0));
        this.filterRegion.show(this.filterForm);
        app.vent.trigger('settitle', 'servers');
    },

    onClose: function () {
        React.unmountComponentAtNode(this.$('.servers-list-region').get(0));
    },

    toggleBootOptions: function () {
        var bootOptionsButton = this.$('.toggle-boot-options');
        var bootOptionsRegion = this.bootOptionsRegion;

        function close () {
            bootOptionsRegion.close();
            bootOptionsButton.removeClass('disabled');
        }

        function saved () {
            app.vent.trigger('notification', {
                level: 'success',
                message: 'Default Boot Options updated'
            });
            close();
        }

        if (this.bootOptionsRegion.currentView) {
            close();
        } else {
            bootOptionsButton.addClass('disabled');

            var bootOptions = new Backbone.Model();
            bootOptions.url = '/api/boot/default';
            var bootOptionsView = new ServerBootOptionsView({model: bootOptions});
            bootOptionsView.on('saved', saved);
            bootOptionsView.on('cancel', close);

            bootOptions.fetch().done(function () {
                bootOptionsRegion.show(bootOptionsView);
            });
        }
    }
});

module.exports = ServersView;


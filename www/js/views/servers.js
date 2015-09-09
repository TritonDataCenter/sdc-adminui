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
var utils = require('../lib/utils')
var NicTags = require('../models/nictags');

var GLYPH_ICON_CLASS = 'glyphicon';
var GLYPH_ICONS = {
    hostname: {
        asc: 'glyphicon-sort-by-alphabet',
        desc: 'glyphicon-sort-by-alphabet-alt'
    },
    provisionable_ram: {
        asc: 'glyphicon-sort-by-attributes',
        desc: 'glyphicon-sort-by-attributes-alt'
    },
    current_platform: {
        asc: 'glyphicon-sort-by-order',
        desc: 'glyphicon-sort-by-order-alt'
    }
};
GLYPH_ICONS.boot_platform = GLYPH_ICONS.current_platform;

function changeGlyphicon() {
    var directionValue = $('input[name=direction]').val();
    var sortValue = $('select[name=sort]').val();
    var sortGlyphicons = GLYPH_ICONS[sortValue] || GLYPH_ICONS.hostname;
    $('.input-group-addon span').removeClass().addClass(GLYPH_ICON_CLASS + ' ' + sortGlyphicons[directionValue] || sortGlyphicons.asc);
}

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
        $directionInput.val(directionValue === 'asc' ? 'desc' : 'asc');
        this.onSubmit(e);
    },
    initialize: function (options) {
        this.options = options || [];
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
        this.nictags.each(function (nt) {
            var option = $('<option />').attr('value', nt.get('name')).html(nt.get('name'));
            $select.append(option);
        }, this);
        utils.setFilterOptions(this.options);
    },
    getQuery: function () {
        return Backbone.Syphon.serialize(this);
    },
    onSubmit: _.debounce(function (e) {
        e.preventDefault();
        changeGlyphicon();
        var params = Backbone.Syphon.serialize(this);
        app.router.changeSearch(params);
        app.vent.trigger('query', params);
    }, 300)
});

var ServersView = Backbone.Marionette.Layout.extend({
    sidebar: 'servers',
    id: 'page-servers',
    template: require('../tpl/servers.hbs'),
    events: {
        'click .toggle-boot-options': 'toggleBootOptions'
    },
    url: function () {
        var url = 'servers';
        return location.pathname === '/servers' ? (url + location.search || '') : url;
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

    initialize: function (options) {
        this.serversOptions = options;
        this.filterForm = new FilterForm(options);
    },

    onShow: function () {
        var self = this;
        React.render(ServersList({
            options: self.serversOptions
        }), this.$('.servers-list-region').get(0));
        this.filterRegion.show(this.filterForm);
        app.vent.trigger('settitle', 'servers');
    },

    onClose: function () {
        app.poller.stop();
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
            var bootOptionsView = new ServerBootOptionsView({
                model: bootOptions
            });
            bootOptionsView.on('saved', saved);
            bootOptionsView.on('cancel', close);

            bootOptions.fetch().done(function () {
                bootOptionsRegion.show(bootOptionsView);
            });
        }
    }
});

module.exports = ServersView;

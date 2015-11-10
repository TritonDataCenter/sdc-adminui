/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var adminui = require('adminui');
var Backbone = require('backbone');
var NetworksView = require('./networks');
var NictagsView = require('./nictags');
var FabricsView = require('./fabrics');

var Networking = Backbone.Marionette.Layout.extend({
    template: require('../tpl/networking.hbs'),

    events: {
        'click a[data-view]': 'onChangeView'
    },

    regions: {
        'tabContent': '.tab-panel'
    },

    sidebar: 'networking',

    url: function () {
        var url = '/networking';
        if (this.options && this.options.tab) {
            url += '/' + this.options.tab;
            if (this.options.querystring) {
                url += '?' + this.options.querystring;
            } else if (this.options.query) {
                url += '?' +  adminui.router.serialize(this.options.query);
            }
        } else {
            url += '/networks';
        }
        return url;
    },

    initialize: function () {
        this.currentView = this.getCurrentView(this.options.tab, this.options);
    },

    makeActive: function (view) {
        this.$('[data-view=' + view + ']').parent().addClass('active').siblings().removeClass('active');
    },
    onChangeView: function (e) {
        e.preventDefault();
        var view = e.target.getAttribute('data-view');
        this.makeActive(view);
        this.tabContent.show(this.getCurrentView(view));
        adminui.router.navigate('networking/' + view);
    },
    getCurrentView: function (view, params) {
        if (view === 'nictags') {
            return new NictagsView(params);
        } else if (view === 'fabrics') {
            return new FabricsView(params);
        } else {
            return new NetworksView(params);
        }
    },
    onRender: function () {
        adminui.vent.trigger('settitle', 'networking');
        this.makeActive(this.options.tab || 'networks');
    },
    onShow: function () {
        this.tabContent.show(this.currentView);
    }
});

module.exports = Networking;

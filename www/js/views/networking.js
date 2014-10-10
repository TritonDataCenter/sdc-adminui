/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var adminui = require('adminui');
var Backbone = require('backbone');
var NetworksView = require('./networks');
var NictagsView = require('./nictags');

var Networking = Backbone.Marionette.Layout.extend({
    template: require('../tpl/networking.hbs'),

    events: {
        'click a[data-view]': 'onChangeView'
    },

    regions: {
        'tabContent': '.tab-panel'
    },

    sidebar: 'networking',

    url: function() {
        if (this.options.tab) {
            return '/networking/' + this.options.tab;
        } else {
            return '/networking';
        }
    },

    initialize: function() {
        this.networksView = new NetworksView();
        this.nictagsView = new NictagsView();
        this.currentView = this.options.tab === 'nictags' ? this.nictagsView : this.networksView;
    },

    makeActive: function(view) {
        this.$('[data-view='+view+']').parent().addClass('active').siblings().removeClass('active');
    },

    onChangeView: function(e) {
        e.preventDefault();
        var v = e.target.getAttribute('data-view');
        this.makeActive(v);
        if (v === 'nictags') {
            this.tabContent.show(this.nictagsView);
            adminui.router.navigate('networking/nictags');
        } else if (v === 'networks') {
            this.tabContent.show(this.networksView);
            adminui.router.navigate('networking/networks');
        }
    },
    onRender: function() {
        adminui.vent.trigger('settitle', 'networking');
        this.makeActive(this.options.tab || 'networks');
    },
    onShow: function() {
        this.tabContent.show(this.currentView);
    }
});

module.exports = Networking;

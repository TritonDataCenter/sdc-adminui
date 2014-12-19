/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');
var _ = require('underscore');

var CollectionView = require('./collection');

var Packages = require('../models/packages');

var PackagesTemplate = require('../tpl/packages.hbs');
var PackagesListItemTemplate = require('../tpl/packages-list-item.hbs');

var UserInput = require('./typeahead-user');

var adminui = require('../adminui');

var Handlebars = require('handlebars');
Handlebars.registerHelper('normalize', function(v) {
    v = Number(v);
    if (v % 1024 === 0) {
        return _.str.sprintf("%d GB", v / 1024);
    }

    return _.str.sprintf("%d MB", v);
});

var PackagesListItemView = Backbone.Marionette.ItemView.extend({
    tagName: 'li',
    template: PackagesListItemTemplate,
    events: {
        'click': 'select'
    },
    select: function() {
        this.trigger('select', this.model);
    }
});



var PackagesList = CollectionView.extend({
    tagName: 'ul',
    emptyView: require('./empty'),
    itemViewOptions: function() {
        return {
            emptyViewModel: this.collection
        };
    },

    attributes: {
        'class': 'nav'
    },

    itemView: PackagesListItemView,

    onBeforeItemAdded: function(itemView) {
        this.listenTo(itemView, 'select', this.onSelect, this);
    },

    onSelect: function(pkg) {
        adminui.vent.trigger('showview', 'package', {model: pkg});
    }
});




var PackagesView = Backbone.Marionette.Layout.extend({
    regions: {
        'list': '#list',
        'detail': '#detail'
    },

    attributes: {
        id: "page-packages"
    },

    events: {
        'submit form': 'onSubmitSearchForm',
        'click button.search': 'search',
        'input input': 'search',
        'change select[name=state]': 'search',
        'change select[name=ram-op]': 'search',
        'change select[name=disk-op]': 'search',
        'click button.create': 'showCreateForm',
        'blur input[name=owner_uuid]': 'onFinishSelectUser'
    },

    ui: {
        'searchInput': '.search input',
        'createButton': 'button.create'
    },

    sidebar: 'packages',

    url: 'packages',

    template: PackagesTemplate,

    initialize: function(options) {
        options = options || {};
        this.packages = new Packages();
        this.listenTo(this.packages, 'error', this.onError);

        this.filterOptions = {};
    },

    onError: function(model, xhr) {
        adminui.vent.trigger('error', {
            xhr: xhr,
            context: 'packages / ufds',
            message: 'error occurred while retrieving package information'
        });
    },

    onRender: function() {
        adminui.vent.trigger('settitle', 'packages');

        var packagesList = new PackagesList({ collection: this.packages });

        this.search().done(function() {
            packagesList.render();
        });

        this.userInput = new UserInput({el: this.$('input[name=owner_uuid]')});
        this.listenTo(this.userInput, 'selected', this.onSelectUser);
        this.userInput.render();

        this.list.show(packagesList);
    },

    onShow: function() {
        this.ui.searchInput.on('input', this.search.bind(this));
        this.ui.searchInput.focus();
    },

    showCreateForm: function() {
        adminui.vent.trigger('showview', 'packages-form');
    },

    onSubmitSearchForm: function(e) {
        e.preventDefault();
    },

    onSelectUser: function(u) {
        if (u && this.$('[name=owner_uuid]').val() === u.get('uuid')) {
            this.filterOptions['owner_uuids'] = [u.get('uuid')];
        } else {
            delete this.filterOptions['owner_uuids'];
        }
        this.search();
    },

    onFinishSelectUser: function() {
        console.log('onFinishSelectUser');
        if (this.$('input[name=owner_uuid]').val().length !== 36) {
            console.log('no uuid');
            var self = this;
            setTimeout(function() {
                self.$('input[name=owner_uuid]').val('');
            }, 10);
            delete this.filterOptions['owner_uuids'];
        }
    },

    search: function() {
        var params = this.getFilterOptions();
        console.log('search params', params);
        return this.packages.fetch({ params: params }, {reset: true});
    },

    getFilterOptions: function() {
        var state = this.$('select[name=state]').val();
        if (state === 'active') {
            this.filterOptions['active'] = true;
        } else if (state === 'inactive') {
            this.filterOptions['active'] = false;
        } else {
            delete this.filterOptions['active'];
        }

        if (this.$('input[name=name]').val()) {
            this.filterOptions['name'] = this.$('input[name=name]').val();
        } else {
            delete this.filterOptions['name'];
        }

        if (this.$('input[name=group]').val()) {
            this.filterOptions['group'] = this.$('input[name=group]').val();
        } else {
            delete this.filterOptions['group'];
        }

        if (this.$('input[name=billing_id]').val()) {
            this.filterOptions['billing_id'] = this.$('select[name=billing_id]').val();
        } else {
            delete this.filterOptions['billing_id'];
        }

        var ram_val = this.$('input[name="ram-value"]').val();
        var ram_op = this.$('select[name=ram-op]').val();
        if (ram_val && ram_val.length) {
            this.filterOptions['max_physical_memory'] = {};
            this.filterOptions['max_physical_memory'][ram_op] = ram_val;
        } else {
            delete this.filterOptions['max_physical_memory'];
        }
        var disk_val = this.$('input[name="disk-value"]').val();
        var disk_op = this.$('select[name="disk-op"]').val();
        if (disk_val && disk_val.length) {
            this.filterOptions['quota'] = {};
            this.filterOptions['quota'][disk_op] = Number(disk_val) * 1024;
        } else {
            delete this.filterOptions['quota'];
        }

        return this.filterOptions;
    },

    showForm: function(model) {
        if (!model) {
            this.$(".sidebar").animate({ opacity: 0.4 });
            this.list.currentView.deselect();
        }

    }

});


module.exports = PackagesView;

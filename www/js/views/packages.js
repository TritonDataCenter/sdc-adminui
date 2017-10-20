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
var utils = require('../lib/utils');

var Handlebars = require('handlebars');
Handlebars.registerHelper('normalize', function (v) {
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
    select: function () {
        this.trigger('select', this.model);
    }
});



var PackagesList = CollectionView.extend({
    tagName: 'ul',
    emptyView: require('./empty'),
    itemViewOptions: function () {
        return {
            emptyViewModel: this.collection
        };
    },

    attributes: {
        'class': 'nav'
    },

    itemView: PackagesListItemView,

    onBeforeItemAdded: function (itemView) {
        this.listenTo(itemView, 'select', this.onSelect, this);
    },

    onSelect: function (pkg) {
        adminui.vent.trigger('showview', 'package', {
            model: pkg
        });
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
        'blur input[name=owner_uuids]': 'onFinishSelectUser'
    },

    ui: {
        'searchInput': '.search input',
        'createButton': 'button.create'
    },

    sidebar: 'packages',

    url: function () {
        var url = 'packages';
        return location.pathname === '/packages' ? (url + location.search || '') : url;
    },
    template: PackagesTemplate,

    initialize: function (options) {
        if (Object.keys(options).length && !options.active) {
            options.active = '';
        }
        this.options = Object.keys(options).length ? options : {active: 'true'};
        this.packages = new Packages();
        this.listenTo(this.packages, 'error', this.onError);
        this.filterOptions = {};
    },

    onError: function (model, xhr) {
        adminui.vent.trigger('error', {
            xhr: xhr,
            context: 'packages / ufds',
            message: 'error occurred while retrieving package information'
        });
    },

    onRender: function () {
        var self = this;
        adminui.vent.trigger('settitle', 'packages');

        var packagesList = new PackagesList({
            collection: this.packages
        });

        var options = {
            el: this.$('input[name=owner_uuids]')
        };
        var ownerUuids = this.options['owner_uuids[0]'];
        if (ownerUuids) {
            options.preSelectedUser = ownerUuids;
        }
        this.userInput = new UserInput(options);
        this.search(null, true).done(function () {
            packagesList.render();
            self.userInput.render();
            self.list.show(packagesList);
        });
    },

    onShow: function () {
        this.ui.searchInput.on('input', this.search.bind(this));
        this.ui.searchInput.focus();
        this.setFilterOptions(this.options);
        this.listenTo(this.userInput, 'selected', this.onSelectUser);
        if (Object.keys(this.options).length) {
            this.options = {};
        }
    },

    showCreateForm: function () {
        adminui.vent.trigger('showview', 'packages-form');
    },

    onSubmitSearchForm: function (e) {
        e.preventDefault();
    },

    onSelectUser: function (u) {
        if (u && this.$('[name=owner_uuids]').val() === u.get('uuid')) {
            this.filterOptions['owner_uuids'] = [u.get('uuid')];
        } else {
            delete this.filterOptions['owner_uuids'];
        }
        this.search();
    },

    onFinishSelectUser: function () {
        console.log('onFinishSelectUser');
        if (this.$('input[name=owner_uuids]').val().length !== 36) {
            console.log('no uuid');
            var self = this;
            setTimeout(function () {
                self.$('input[name=owner_uuids]').val('');
            }, 10);
            delete this.filterOptions['owner_uuids'];
        }
    },

    search: function (event, notChangeSearch) {
        var params = _.extend(this.getFilterOptions(), this.options);
        console.log('search params', params);
        if (!notChangeSearch) {
            adminui.router.changeSearch(params);
        }
        return this.packages.fetch({
            params: params
        }, {
            reset: true
        });
    },

    setFilterOptions: function (options) {
        utils.setFilterOptions(options);
        ['max_physical_memory', 'quota'].forEach(function (field) {
            Object.keys(options).forEach(function (key) {
                if (key.match(field)) {
                    var target = field === 'quota' ? 'disk' : 'ram';
                    $('select[name=' + target +  '-op] option[value="' +
                        key.replace(/([a-z&\]&\[&\_])/g, '') + '"]').attr('selected', 'true');

                    $('input[name=' + target +  '-value]').val(options[key]);
                }
            });
        });
    },

    getFilterOptions: function () {
        var self = this;
        var getValue = function (name) {
            return $((name === 'active' ? 'select' : 'input') + '[name=' + name + ']').val();
        };

        var data = {
            active: getValue('active'),
            name_substring: getValue('name'),
            traits: getValue('traits'),
            group: getValue('group'),
            billing_id: getValue('billing_id')
        };

        Object.keys(data).forEach(function (key) {
            var value = data[key];
            if (value && ((key === 'active' && value === 'true' || value === 'false') || key !== 'active')) {
                self.filterOptions[key] = value;
            } else {
                delete self.filterOptions[key];
            }
        });

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

    showForm: function (model) {
        if (!model) {
            this.$(".sidebar").animate({
                opacity: 0.4
            });
            this.list.currentView.deselect();
        }

    }

});


module.exports = PackagesView;

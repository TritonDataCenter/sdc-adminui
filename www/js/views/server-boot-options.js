/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var Backbone = require('backbone');
var Platforms = require('../models/platforms');

var _ = require('underscore');

var platformsSelectItem = Backbone.View.extend({
    tagName: 'option',
    render: function () {
        var platform = this.model.toJSON();
        this.$el.attr('value', platform.version);
        this.$el.text(platform.label);
    }
});

module.exports = Backbone.Marionette.ItemView.extend({
    id: 'server-boot-options',
    template: require('../tpl/server-boot-options.hbs'),
    events: {
        'click .save': 'onSave',
        'click .cancel': 'onCancel',
        'keydown textarea': 'onInputKeydown',
        'keyup textarea': 'onInputKeyup'
    },

    initialize: function (options) {
        this.platforms = new Platforms();
        this.platformSelect = new Backbone.Marionette.CollectionView({
            itemView: platformsSelectItem,
            collection: this.platforms
        });
    },

    serializeData: function () {
        var data = _.clone(this.model.toJSON());
        data.kernel_args = JSON.stringify(data.kernel_args, null, 2);
        return data;
    },

    onInputKeydown: function () {
        this.$('.error').text();
        this.$('.error').hide();
        this.$('.save').prop('disabled', true);
    },

    onInputKeyup: _.debounce(function () {
        var text = this.$('textarea').val();
        try {
            var json = JSON.parse(text);
            this.$('.error').text();
            this.$('.error').hide();
            this.$('.save').prop('disabled', false);
        } catch (e) {
            this.$('.error').text(e.message);
            this.$('.error').show();
            this.$('.save').prop('disabled', true);
        }
    }, 200),

    onRender: function () {
        var self = this;
        var platform = this.model.get('platform');
        this.$('textarea').autosize();

        this.platformSelect.setElement(this.$('select[name=platform]'));
        this.platforms.fetch().done(function () {
            self.platforms.forEach(function (data) {
                data = data.toJSON();
                if (data[platform] || data.version === platform) {
                    self.$('select[name=platform]').val(data.version);
                }
            });
        });
    },

    onCancel: function () {
        this.trigger('cancel');
    },

    onSave: function (e) {
        e.preventDefault();
        var self = this;

        var data = {
            kernel_args: JSON.parse(this.$('textarea').val()),
            platform: this.$('[name=platform]').val()
        };

        this.model.save(data).done(function () {
            self.trigger('saved');
        });
    }

});

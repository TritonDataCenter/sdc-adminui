/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var Backbone = require('backbone');
var api = require('../request');

var Platforms = require('../models/platforms');
var Platform = Backbone.Model.extend({});

var ViewModel = Backbone.Model.extend({});
var ChangePlatformTemplate = function() {
    return '<select class="form-control" data-placeholder-text="Choose Platform"></select><button class="btn btn-primary save">Save</button><button class="btn btn-link cancel">Cancel</button>';
};

var ChangePlatformForm = Backbone.Marionette.ItemView.extend({
    attributes: {
        'class': 'change-platform-form'
    },
    template: ChangePlatformTemplate,
    events: {
        'click button.save': 'save',
        'click button.cancel': 'cancel'
    },
    initialize: function (options) {
        this.platforms = new Platforms();
        this.platforms.params = {for_server: true};
        this.platforms.fetch();
        this.listenTo(this.platforms, 'sync', this.applyBindings);
        this.viewModel = new ViewModel();
        this.viewModel.set({
            platform: options.model.get('boot_platform')
        });
    },
    save: function () {
        var self = this;
        var platform = this.$('select').val();
        var params = platform === 'latest' ? {} : {platform: platform};
        api.post('/api/boot/' + this.model.id).send(params).end(function (res) {
            if (res.ok) {
                self.trigger('save', platform);
            } else {
                self.trigger('error', res);
            }
        }.bind(this));
    },
    cancel: function () {
        this.trigger('cancel');
        this.remove();
    },
    applyBindings: function () {
        this.stickit(this.viewModel, {
            'select': {
                observe: 'platform',
                initialize: function ($el, model, options) {
                    $el.chosen();
                },
                selectOptions: {
                    collection: 'this.platforms',
                    labelPath: 'label',
                    valuePath: 'version'
                }
            }
        });
    }
});

module.exports = ChangePlatformForm;

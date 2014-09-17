/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');
var Bloodhound = require('bloodhound');

var Images = require('../models/images');

var ImageTypeaheadTpl = require('../tpl/typeahead-image.hbs');

var ImageTypeaheadView = Backbone.Marionette.View.extend({
    events: {
        'typeahead:selected': 'onTypeaheadSelect',
        'typeahead:opened': 'onOpened',
        'typeahead:closed': 'onTypeaheadClosed',
        'typeahead:cursorchanged': 'onCursorChanged'
    },

    template: ImageTypeaheadTpl,

    initialize: function(options) {
        options = options || {};
        this.imagesCollection = new Images();
        this.listenTo(this.imagesCollection, 'sync', this.initializeEngine);
    },

    clearField: function() {
        process.nextTick(function() {
            this.trigger('selected', null);
            this.$el.val('');
        }.bind(this));
    },

    onOpened: function() {
        this.selectedImage = null;
        this.trigger('selected', null);
    },

    onTypeaheadSelect: function(e, datum) {
        console.debug('typeahead selected', e, datum);
        this.selectedImage = datum.model;
        this.$el.tooltip('destroy');
        this.trigger('selected', datum.model);
    },

    onTypeaheadClosed: function(e, suggestion, dataset) {
        console.debug('typeahead closed');
        var $field = this.$el;

        if (this.selectedImage && $field.val() === this.selectedImage.get('uuid')) {
            return;
        }

        if ($field.val().length !== 36) {
            this.clearField();
            this.$el.tooltip({
                placement: 'top',
                title: 'Invalid image UUID provided.'
            });
            if ($field.val().length !== 0) {
                this.$el.focus();
            }
        }
    },

    initializeEngine: function() {
        var source = this.imagesCollection.map(function(i) {
            var tokens = [i.get('uuid'), i.get('version'), i.get('name')];
            if (i.get('billing_tags') && Array.isArray(i.get('billing_tags'))) {
                i.get('billing_tags').forEach(function(t) {
                    tokens.push(t);
                });
            }

            if (i.get('tags') && typeof i.get('tags') === 'object') {
                var tags = i.get('tags');
                Object.keys(tags).forEach(function(tagKey) {
                    var tagValue = tags[tagKey];
                    var token = ['tag', tagKey, tagValue].join(':');
                    tokens.push(token);
                });
            }

            return {
                'model': i,
                'uuid': i.get('uuid'),
                'tokens': tokens,
                'name': i.get('name'),
                'version': i.get('version')
            };
        });

        this.engine = new Bloodhound({
            name: 'images',
            local: source,
            datumTokenizer: function(datum) {
                return datum.tokens;
            },
            sorter: function(a, b) {
                return -(a.version.localeCompare(b.version));
            },
            queryTokenizer: function(query) {
                return Bloodhound.tokenizers.whitespace(query);
            },
            limit: 30
        });

        this.engine.initialize();
        this.renderInput();
    },

    showLoading: function() {
        if (this.$el.parent().parent().find('.tt-loading').length) {
            this.$el.parent().parent().find(".tt-loading").show();
        } else {
            this.$el.parent().after("<div class='tt-loading'>Loading</div>");
        }
    },

    hideLoading: function() {
        this.$el.parent().parent().find(".tt-loading").hide();
    },
    renderInput: function() {
        this.$el.typeahead({
            name: 'images',
            minLength: 3,
            highlight: true,
        },
        {
            displayKey: 'uuid',
            name: 'images',
            source: this.engine.ttAdapter(),
            templates: {
                suggestion: ImageTypeaheadTpl
            }
        });
    },

    render: function() {
        this.imagesCollection.fetch();
    }
});

module.exports = ImageTypeaheadView;
